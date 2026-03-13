import React, { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import api from '../api/axios';
import DynamicItemForm from './forms/DynamicItemForm';
import type { CustomField, Item } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  inventoryId: string;
  item?: Item;
  fields: CustomField[];
  onSuccess: () => void;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95vw', sm: 520 },
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

type ItemValues = Record<string, unknown>;

const ItemFormModal: React.FC<Props> = ({
  open,
  onClose,
  inventoryId,
  item,
  fields,
  onSuccess,
}) => {
  const [customId, setCustomId] = useState('');
  const [values, setValues] = useState<ItemValues>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // При открытии — заполняем из item (редактирование) или сбрасываем (создание)
  useEffect(() => {
    if (!open) return;
    if (item) {
      setCustomId(item.CustomId ?? '');
      setValues((item.Data as ItemValues) ?? {});
    } else {
      setCustomId('');
      setValues({});
    }
    setError('');
  }, [open, item]);

  const handleChange = (field: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    try {
      setLoading(true);
      if (item) {
        // Редактирование
        await api.put(`/inventory/${inventoryId}/items/${item.Id}`, {
          customId: customId.trim() || item.CustomId,
          data: values,
          rowVersion: item.RowVersion,
        });
      } else {
        // Создание — customId генерируется сервером, не передаём
        await api.post(`/inventory/${inventoryId}/items`, {
          data: values,
        });
      }
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: string } })?.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {item ? 'Edit Item' : 'Add Item'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* CustomId — только при редактировании (при создании генерируется сервером) */}
        {item && (
          <>
            <TextField
              fullWidth
              label="Custom ID"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              helperText="Unique ID within this inventory"
              sx={{ mb: 2 }}
            />
            {fields.length > 0 && <Divider sx={{ mb: 2 }} />}
          </>
        )}

        {/* Кастомные поля */}
        {fields.length > 0 ? (
          <DynamicItemForm
            fields={fields}
            values={values}
            onChange={handleChange}
          />
        ) : (
          <Alert severity="info">
            This inventory has no custom fields yet. Go to the <strong>Fields</strong> tab to add them.
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} /> : 'Save'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ItemFormModal;