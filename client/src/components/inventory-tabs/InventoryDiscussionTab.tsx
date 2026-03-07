import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Link,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import api from '../../api/axios';
import type { InventoryComment } from '../../types';

interface InventoryDiscussionTabProps {
  inventoryId: string;
  isAuthenticated: boolean;
  canPost: boolean;
}

function mergeComments(
  previous: InventoryComment[],
  incoming: InventoryComment[]
): InventoryComment[] {
  const byId = new Map<string, InventoryComment>();

  for (const comment of previous) {
    byId.set(comment.Id, comment);
  }

  for (const comment of incoming) {
    byId.set(comment.Id, comment);
  }

  return Array.from(byId.values()).sort((a, b) =>
    new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
  );
}

const InventoryDiscussionTab: React.FC<InventoryDiscussionTabProps> = ({
  inventoryId,
  isAuthenticated,
  canPost,
}) => {
  const [comments, setComments] = React.useState<InventoryComment[]>([]);
  const [draft, setDraft] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [posting, setPosting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [lastCommentAt, setLastCommentAt] = React.useState<string | null>(null);

  const loadComments = React.useCallback(
    async (after?: string) => {
      const res = await api.get(`/Inventory/${inventoryId}/comments`, {
        params: after ? { after } : undefined,
      });

      const incoming = (res.data ?? []) as InventoryComment[];
      setComments((prev) => (after ? mergeComments(prev, incoming) : incoming));

      if (incoming.length > 0) {
        setLastCommentAt(incoming[incoming.length - 1].CreatedAt);
      }
    },
    [inventoryId]
  );

  React.useEffect(() => {
    let mounted = true;

    const initialLoad = async () => {
      try {
        await loadComments();
        if (mounted) setError('');
      } catch {
        if (mounted) setError('Failed to load discussion');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initialLoad();

    return () => {
      mounted = false;
    };
  }, [loadComments]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void loadComments(lastCommentAt ?? undefined).catch(() => {
        setError((prev) => prev || 'Failed to refresh discussion');
      });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [loadComments, lastCommentAt]);

  const handlePost = async () => {
    const content = draft.trim();
    if (!content || posting || !canPost) return;

    try {
      setPosting(true);
      setError('');
      const res = await api.post(`/Inventory/${inventoryId}/comments`, { content });
      const created = res.data as InventoryComment;

      setComments((prev) => mergeComments(prev, [created]));
      setLastCommentAt(created.CreatedAt);
      setDraft('');
    } catch {
      setError('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Discussion
      </Typography>

      {!isAuthenticated && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Sign in to post comments.
        </Alert>
      )}

      {isAuthenticated && !canPost && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You do not have permission to post comments in this inventory.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Write comment (Markdown supported)"
            multiline
            minRows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!isAuthenticated || !canPost || posting}
          />
          <Box>
            <Button
              variant="contained"
              onClick={() => void handlePost()}
              disabled={!isAuthenticated || !canPost || posting || draft.trim().length === 0}
            >
              {posting ? 'Posting...' : 'Post comment'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {loading ? (
        <Typography color="text.secondary">Loading comments...</Typography>
      ) : (
        <Stack spacing={2}>
          {comments.map((comment) => (
            <Paper key={comment.Id} sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <Link component={RouterLink} to={`/profile/${comment.UserId}`} underline="hover">
                  {comment.UserName}
                </Link>
                {' • '}
                {new Date(comment.CreatedAt).toLocaleString()}
              </Typography>
              <Box sx={{ '& p': { my: 0.5 } }}>
                <ReactMarkdown>{comment.Content}</ReactMarkdown>
              </Box>
            </Paper>
          ))}

          {comments.length === 0 && (
            <Typography color="text.secondary">No comments yet.</Typography>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default InventoryDiscussionTab;
