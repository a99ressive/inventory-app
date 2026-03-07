import React from 'react';
import api from '../api/axios';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

type AccessUser = {
  Id: string;
  Email: string;
  Name: string;
};

type SortBy = 'name' | 'email';

interface Props {
  inventoryId: string;
  ownerId: string;
}

const AccessSettingsTab: React.FC<Props> = ({ inventoryId, ownerId }) => {
  const [accessUsers, setAccessUsers] = React.useState<AccessUser[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<AccessUser[]>([]);
  const [sortBy, setSortBy] = React.useState<SortBy>('name');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const loadAccess = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/Inventory/${inventoryId}/access?sortBy=${sortBy}`);
      const rows = ((res.data ?? []) as AccessUser[]).filter((user) => user.Id !== ownerId);
      setAccessUsers(rows);
      setSelected((prev) => prev.filter((id) => rows.some((user) => user.Id === id)));
      setError('');
    } catch {
      setError('Failed to load access list');
    } finally {
      setLoading(false);
    }
  }, [inventoryId, ownerId, sortBy]);

  React.useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(
          `/Users/search?query=${encodeURIComponent(q)}&sort=${sortBy}&limit=10`
        );

        const existingIds = new Set(accessUsers.map((user) => user.Id));
        const nextSuggestions = ((res.data ?? []) as AccessUser[]).filter(
          (user) => user.Id !== ownerId && !existingIds.has(user.Id)
        );

        setSuggestions(nextSuggestions);
      } catch {
        // Ignore autocomplete errors to avoid blocking the page.
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, sortBy, accessUsers, ownerId]);

  const addUser = async (userId: string) => {
    try {
      await api.post(`/Inventory/${inventoryId}/access/${userId}`);
      setQuery('');
      setSuggestions([]);
      await loadAccess();
    } catch {
      setError('Failed to add user to access list');
    }
  };

  const removeSelected = async () => {
    if (!selected.length) return;

    try {
      await Promise.all(
        selected.map((userId) => api.delete(`/Inventory/${inventoryId}/access/${userId}`))
      );
      await loadAccess();
    } catch {
      setError('Failed to remove users from access list');
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allChecked = accessUsers.length > 0 && selected.length === accessUsers.length;
  const indeterminate = selected.length > 0 && selected.length < accessUsers.length;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Access settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort mode</InputLabel>
          <Select
            label="Sort mode"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
          >
            <MenuItem value="name">By name</MenuItem>
            <MenuItem value="email">By email</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          color="error"
          disabled={selected.length === 0}
          onClick={() => void removeSelected()}
        >
          Remove selected ({selected.length})
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Add user (autocomplete by name/email)
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Type username or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {suggestions.length > 0 && (
          <Paper variant="outlined" sx={{ mt: 1, maxHeight: 220, overflowY: 'auto' }}>
            {suggestions.map((user) => (
              <Box
                key={user.Id}
                sx={{
                  px: 1.5,
                  py: 1,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
                onClick={() => void addUser(user.Id)}
              >
                <Typography variant="body2">{user.Name || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.Email}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allChecked}
                  indeterminate={indeterminate}
                  onChange={(event) =>
                    setSelected(event.target.checked ? accessUsers.map((user) => user.Id) : [])
                  }
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {accessUsers.map((user) => (
              <TableRow key={user.Id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(user.Id)}
                    onChange={() => toggleOne(user.Id)}
                  />
                </TableCell>
                <TableCell>{user.Name || '-'}</TableCell>
                <TableCell>{user.Email}</TableCell>
              </TableRow>
            ))}

            {accessUsers.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Access list is empty
                </TableCell>
              </TableRow>
            )}

            {loading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default AccessSettingsTab;
