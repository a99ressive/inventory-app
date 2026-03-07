import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import api from '../api/axios';
import ItemFormModal from '../components/ItemFormModal';
import type { Item, Inventory } from '../types';
import AccessSettingsTab from '../components/AccessSettingsTab';

const InventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [tab, setTab] = useState(0);

  const canWrite = inventory?.CanWrite ?? false;

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [inventoryRes, itemsRes] = await Promise.all([
        api.get(`/Inventory/${id}`),
        api.get(`/inventory/${id}/items`),
      ]);

      setInventory(inventoryRes.data);
      setItems(itemsRes.data);
      setError('');
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!canWrite && tab === 4) {
      setTab(0);
    }
  }, [canWrite, tab]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(event.target.checked ? items.map((item) => item.Id) : []);
  };

  const handleSelectOne = (itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!canWrite || selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} item(s)?`)) return;

    try {
      await Promise.all(
        selectedIds.map((itemId) => api.delete(`/inventory/${id}/items/${itemId}`))
      );
      setSelectedIds([]);
      loadData();
    } catch {
      alert('Failed to delete some items');
    }
  };

  const handleAddItem = () => {
    if (!canWrite) return;
    setEditingItem(undefined);
    setModalOpen(true);
  };

  const handleRowClick = (item: Item) => {
    if (!canWrite) return;
    setEditingItem(item);
    setModalOpen(true);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!inventory) return <Alert severity="error">Inventory not found</Alert>;

  return (
    <div>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {inventory.Title}
          </Typography>
          {inventory.Description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {inventory.Description}
            </Typography>
          )}
          <Typography variant="caption" display="block" color="text.secondary">
            Public: {inventory.IsPublic ? 'Yes' : 'No'} | Type ID: {inventory.InventoryTypeId}
          </Typography>
        </CardContent>
      </Card>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, next) => setTab(next)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Items" />
          <Tab label="Discussion" />
          <Tab label="General settings" />
          <Tab label="Custom ID" />
          <Tab label="Access settings" disabled={!canWrite} />
          <Tab label="Fields" />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Items</Typography>
            {canWrite && (
              <Box>
                <Button variant="contained" onClick={handleAddItem} sx={{ mr: 1 }}>
                  Add Item
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0}
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              </Box>
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {canWrite && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
                        checked={items.length > 0 && selectedIds.length === items.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
                  <TableCell>Custom ID</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.Id}
                    hover={canWrite}
                    onClick={() => handleRowClick(item)}
                    sx={{ cursor: canWrite ? 'pointer' : 'default' }}
                  >
                    {canWrite && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(item.Id)}
                          onChange={() => handleSelectOne(item.Id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>{item.CustomId}</TableCell>
                    <TableCell>
                      <pre style={{ margin: 0 }}>{JSON.stringify(item.Data, null, 2)}</pre>
                    </TableCell>
                    <TableCell>{item.CreatedById}</TableCell>
                    <TableCell>{new Date(item.CreatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}

                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 5 : 4} align="center">
                      No items yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <ItemFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            inventoryId={id!}
            item={editingItem}
            onSuccess={loadData}
          />
        </>
      )}

      {tab === 1 && <Alert severity="info">Discussion tab: next step (comments + realtime polling)</Alert>}
      {tab === 2 && <Alert severity="info">General settings tab: next step (autosave + optimistic locking)</Alert>}
      {tab === 3 && <Alert severity="info">Custom ID tab: next step (builder + preview API)</Alert>}
      {tab === 4 && (
        canWrite
          ? <AccessSettingsTab inventoryId={id!} />
          : <Alert severity="info">You do not have permission to manage access settings.</Alert>
      )}
      {tab === 5 && <Alert severity="info">Fields tab: next step (custom fields editor)</Alert>}
      {tab === 6 && <Alert severity="info">Statistics tab: next step (aggregations)</Alert>}
    </div>
  );
};

export default InventoryDetail;
