import React from 'react';
import api from '../api/axios';
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Button,
  Box,
  TextField,
  Alert,
  Stack,
} from '@mui/material';

type AdminUser = {
  Id: string;
  Email: string;
  UserName: string;
  IsBlocked: boolean;
  IsAdmin: boolean;
};

const AdminPage: React.FC = () => {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (query.trim()) params.set('query', query.trim());

      const res = await api.get(`/Admin/users?${params.toString()}`);
      setUsers(res.data ?? []);
      setSelectedIds([]);
      setError('');
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const allChecked = users.length > 0 && selectedIds.length === users.length;
  const indeterminate =
    selectedIds.length > 0 && selectedIds.length < users.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? users.map((u) => u.Id) : []);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runBulk = async (
    action: 'block' | 'unblock' | 'grantAdmin' | 'revokeAdmin' | 'delete'
  ) => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((id) => {
          if (action === 'block') {
            return api.post(`/Admin/users/${id}/block`, { isBlocked: true });
          }
          if (action === 'unblock') {
            return api.post(`/Admin/users/${id}/block`, { isBlocked: false });
          }
          if (action === 'grantAdmin') {
            return api.post(`/Admin/users/${id}/admin`);
          }
          if (action === 'revokeAdmin') {
            return api.delete(`/Admin/users/${id}/admin`);
          }
          return api.delete(`/Admin/users/${id}`);
        })
      );

      await loadUsers();
    } catch {
      setError('Bulk action failed');
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Admin: User Management
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search by email or username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="outlined" onClick={() => setPage(1)}>
          Apply Search
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Bulk actions (selected: {selectedIds.length})
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="contained"
            color="warning"
            disabled={selectedIds.length === 0}
            onClick={() => runBulk('block')}
          >
            Block
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={selectedIds.length === 0}
            onClick={() => runBulk('unblock')}
          >
            Unblock
          </Button>
          <Button
            variant="contained"
            disabled={selectedIds.length === 0}
            onClick={() => runBulk('grantAdmin')}
          >
            Grant Admin
          </Button>
          <Button
            variant="outlined"
            disabled={selectedIds.length === 0}
            onClick={() => runBulk('revokeAdmin')}
          >
            Revoke Admin
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={selectedIds.length === 0}
            onClick={() => runBulk('delete')}
          >
            Delete
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allChecked}
                  indeterminate={indeterminate}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>UserName</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Blocked</TableCell>
              <TableCell>Admin</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.Id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(u.Id)}
                    onChange={() => toggleSelectOne(u.Id)}
                  />
                </TableCell>
                <TableCell>{u.UserName}</TableCell>
                <TableCell>{u.Email}</TableCell>
                <TableCell>{u.IsBlocked ? 'Yes' : 'No'}</TableCell>
                <TableCell>{u.IsAdmin ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No users
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </Button>
        <Typography sx={{ alignSelf: 'center' }}>Page: {page}</Typography>
        <Button variant="outlined" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </Box>
    </>
  );
};

export default AdminPage;