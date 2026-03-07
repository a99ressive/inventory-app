import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import api from '../../api/axios';
import ItemFormModal from '../ItemFormModal';
import type { CustomField, Item } from '../../types';

interface InventoryItemsTabProps {
  inventoryId: string;
  items: Item[];
  canWrite: boolean;
  tableFields: CustomField[];
  onRefresh: () => void;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return '-';
  }
}

const InventoryItemsTab: React.FC<InventoryItemsTabProps> = ({
  inventoryId,
  items,
  canWrite,
  tableFields,
  onRefresh,
}) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | undefined>(undefined);

  React.useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.Id === id)));
  }, [items]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(event.target.checked ? items.map((item) => item.Id) : []);
  };

  const handleSelectOne = (itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!canWrite || selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} item(s)?`)) return;

    try {
      await Promise.all(
        selectedIds.map((itemId) => api.delete(`/inventory/${inventoryId}/items/${itemId}`))
      );
      setSelectedIds([]);
      onRefresh();
    } catch {
      window.alert('Failed to delete selected items');
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

  const allChecked = items.length > 0 && selectedIds.length === items.length;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < items.length;
  const totalColumns = (canWrite ? 1 : 0) + 1 + tableFields.length + 2;

  return (
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
                    checked={allChecked}
                    indeterminate={indeterminate}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              <TableCell>Custom ID</TableCell>
              {tableFields.map((field) => (
                <TableCell key={field.Title}>{field.Title}</TableCell>
              ))}
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
                  <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(item.Id)}
                      onChange={() => handleSelectOne(item.Id)}
                    />
                  </TableCell>
                )}
                <TableCell>{item.CustomId}</TableCell>
                {tableFields.map((field) => (
                  <TableCell key={`${item.Id}-${field.Title}`}>
                    {formatCellValue(item.Data[field.Title])}
                  </TableCell>
                ))}
                <TableCell>{item.CreatedById}</TableCell>
                <TableCell>{new Date(item.CreatedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={totalColumns} align="center">
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
        inventoryId={inventoryId}
        item={editingItem}
        onSuccess={onRefresh}
      />
    </>
  );
};

export default InventoryItemsTab;
