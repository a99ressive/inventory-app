import React from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import api from '../../api/axios';
import { parseCustomIdConfig } from '../../utils/inventoryData';

interface InventoryCustomIdTabProps {
  inventoryId: string;
  customIdConfig: unknown;
  canEdit: boolean;
}

const InventoryCustomIdTab: React.FC<InventoryCustomIdTabProps> = ({
  inventoryId,
  customIdConfig,
  canEdit,
}) => {
  const config = React.useMemo(() => parseCustomIdConfig(customIdConfig), [customIdConfig]);
  const [preview, setPreview] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadPreview = React.useCallback(async () => {
    if (!config) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.post(`/Inventory/${inventoryId}/custom-id/preview`, config);
      setPreview(String(res.data ?? ''));
    } catch {
      setError('Failed to generate Custom ID preview');
    } finally {
      setLoading(false);
    }
  }, [inventoryId, config]);

  React.useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Custom ID</Typography>

      {!canEdit && (
        <Alert severity="info">
          You have read-only access to Custom ID settings.
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">Preview</Typography>
        <Typography variant="h6" sx={{ mt: 1 }}>
          {loading ? 'Generating...' : preview || '-'}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => void loadPreview()} disabled={loading || !config}>
            Refresh preview
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Current config (JSON)
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: 'action.hover',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(config, null, 2)}
        </Box>
      </Paper>
    </Stack>
  );
};

export default InventoryCustomIdTab;
