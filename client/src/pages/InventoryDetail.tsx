import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import api from '../api/axios';
import ItemFormModal from '../components/ItemFormModal';
import type { Item, Inventory } from '../types';

const InventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(items.map((item) => item.Id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
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
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadData();
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
            Public: {inventory.IsPublic ? 'Yes' : 'No'} | Type ID: {inventory.InventoryTypeId} | Last Sequence: {inventory.LastSequence}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Items</Typography>
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
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedIds.length > 0 && selectedIds.length < items.length
                  }
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Custom ID</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.Id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(item.Id)}
                    onChange={() => handleSelectOne(item.Id)}
                  />
                </TableCell>
                <TableCell>{item.CustomId}</TableCell>
                <TableCell>
                  <pre style={{ margin: 0 }}>{JSON.stringify(item.Data, null, 2)}</pre>
                </TableCell>
                <TableCell>{item.CreatedById}</TableCell>
                <TableCell>{new Date(item.CreatedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEditItem(item)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default InventoryDetail;