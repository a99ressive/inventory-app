import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
} from '@mui/material';

type ProfileInventory = {
  Id: string;
  Title: string;
  Description?: string | null;
  IsPublic: boolean;
  OwnerId: string;
  InventoryTypeId: number;
};

type SortBy = 'title' | 'created';
type Order = 'asc' | 'desc';

const InventoryTable: React.FC<{
  title: string;
  rows: ProfileInventory[];
}> = ({ title, rows }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Public</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Open</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((inv) => (
            <TableRow key={inv.Id}>
              <TableCell>{inv.Title}</TableCell>
              <TableCell>{inv.Description ?? '—'}</TableCell>
              <TableCell>{inv.IsPublic ? 'Yes' : 'No'}</TableCell>
              <TableCell>{inv.InventoryTypeId}</TableCell>
              <TableCell>
                <Link component={RouterLink} to={`/inventories/${inv.Id}`} underline="hover">
                  Open
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No inventories
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

const Profile: React.FC = () => {
  const [owned, setOwned] = React.useState<ProfileInventory[]>([]);
  const [writeAccess, setWriteAccess] = React.useState<ProfileInventory[]>([]);
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortBy>('title');
  const [order, setOrder] = React.useState<Order>('asc');
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const query = new URLSearchParams({
        search,
        sortBy,
        order,
      }).toString();

      const [ownedRes, accessRes] = await Promise.all([
        api.get(`/Profile/owned?${query}`),
        api.get(`/Profile/write-access?${query}`),
      ]);

      setOwned(ownedRes.data ?? []);
      setWriteAccess(accessRes.data ?? []);
      setError('');
    } catch {
      setError('Failed to load profile inventories');
    }
  }, [search, sortBy, order]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="created">Created</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Order</InputLabel>
          <Select
            label="Order"
            value={order}
            onChange={(e) => setOrder(e.target.value as Order)}
          >
            <MenuItem value="asc">ASC</MenuItem>
            <MenuItem value="desc">DESC</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <InventoryTable title="Inventories I own" rows={owned} />
      <InventoryTable title="Inventories with my write access" rows={writeAccess} />
    </>
  );
};

export default Profile;