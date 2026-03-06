import React, { useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import api from '../api/axios';
import type { Item } from '../types';

// Импортируем тип Item, если он есть в проекте
// import { Item } from '../types';

interface ItemFormData {
  customId: string;
  data: string; // JSON string
}

interface ItemFormModalProps {
  open: boolean;
  onClose: () => void;
  inventoryId: string;
  item?: Item; // объект предмета для редактирования
  onSuccess: () => void;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
};

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  open,
  onClose,
  inventoryId,
  item,
  onSuccess,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    defaultValues: {
      customId: '',
      data: '{}',
    },
  });

  useEffect(() => {
    if (item) {
      setValue('customId', item.CustomId);
      setValue('data', JSON.stringify(item.Data, null, 2));
    } else {
      reset();
    }
  }, [item, setValue, reset]);

  const onSubmit = async (formData: ItemFormData) => {
    try {
      const dataObj = JSON.parse(formData.data);
      const payload = {
        customId: formData.customId,
        data: dataObj,
      };

      if (item) {
        await api.put(`/inventory/${inventoryId}/items/${item.Id}`, payload);
      } else {
        await api.post(`/inventory/${inventoryId}/items`, payload);
      }
      onSuccess();
      onClose();
    } catch {
      alert('Failed to save item. Check JSON format.');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          {item ? 'Edit Item' : 'Create Item'}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="customId"
            control={control}
            rules={{ required: 'Custom ID is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Custom ID"
                fullWidth
                margin="normal"
                error={!!errors.customId}
                helperText={errors.customId?.message}
              />
            )}
          />
          <Controller
            name="data"
            control={control}
            rules={{
              required: 'Data is required',
              validate: (value) => {
                try {
                  JSON.parse(value);
                  return true;
                } catch {
                  return 'Invalid JSON';
                }
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Data (JSON)"
                fullWidth
                margin="normal"
                multiline
                rows={6}
                error={!!errors.data}
                helperText={errors.data?.message}
              />
            )}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default ItemFormModal;
