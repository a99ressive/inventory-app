import React from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link,
  Alert,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import api from '../api/axios';

type PublicInventoryRow = {
  Id: string;
  Title: string;
  Description?: string | null;
  OwnerName: string;
  ItemCount: number;
  Tags: string[];
};

type TagCloudItem = {
  Tag: string;
  Count: number;
};

type PublicHomeDto = {
  Latest: PublicInventoryRow[];
  TopPopular: PublicInventoryRow[];
  TagCloud: TagCloudItem[];
};

const InventoryTable: React.FC<{ title: string; rows: PublicInventoryRow[] }> = ({ title, rows }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Tags</TableCell>
            <TableCell>Open</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((inv) => (
            <TableRow key={inv.Id}>
              <TableCell>{inv.Title}</TableCell>
              <TableCell>{inv.Description ?? '—'}</TableCell>
              <TableCell>{inv.OwnerName}</TableCell>
              <TableCell>{inv.ItemCount}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                  {inv.Tags.map((t) => <Chip key={t} size="small" label={t} />)}
                </Stack>
              </TableCell>
              <TableCell>
                <Link component={RouterLink} to={`/inventories/${inv.Id}`} underline="hover">
                  Open
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">No data yet</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  </Box>
);

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q')?.trim() ?? '';

  const [home, setHome] = React.useState<PublicHomeDto | null>(null);
  const [searchRows, setSearchRows] = React.useState<PublicInventoryRow[]>([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (q) {
      api.get(`/Public/search?query=${encodeURIComponent(q)}`)
        .then((res) => {
          setSearchRows(res.data ?? []);
          setError('');
        })
        .catch(() => setError('Failed to load search results.'));
      return;
    }

    api.get('/Public/home')
      .then((res) => {
        setHome(res.data);
        setError('');
      })
      .catch(() => setError('Failed to load home data.'));
  }, [q]);

  return (
    <>
      <Typography variant="h4" gutterBottom>Inventories</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {q ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search results for "{q}"
          </Typography>
          <InventoryTable title="Search results" rows={searchRows} />
        </>
      ) : (
        <>
          <InventoryTable title="Latest inventories" rows={home?.Latest ?? []} />
          <InventoryTable title="Top 5 popular inventories" rows={home?.TopPopular ?? []} />

          <Typography variant="h6" sx={{ mb: 1 }}>Tag cloud</Typography>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {(home?.TagCloud ?? []).map((t) => (
                <Chip
                  key={t.Tag}
                  label={`${t.Tag} (${t.Count})`}
                  onClick={() => setSearchParams({ q: t.Tag })}
                  clickable
                />
              ))}
            </Stack>
          </Paper>
        </>
      )}
    </>
  );
};

export default Home;