import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../../api/axios';
import type { Inventory } from '../../types';

interface InventoryType {
  Id: number;
  Name: string;
}

interface InventoryGeneralTabProps {
  inventory: Inventory;
  canEdit: boolean;
  onInventoryUpdated: (patch: Partial<Inventory>) => void;
}

type GeneralFormState = {
  title: string;
  description: string;
  inventoryTypeId: number;
  isPublic: boolean;
};

const InventoryGeneralTab: React.FC<InventoryGeneralTabProps> = ({
  inventory,
  canEdit,
  onInventoryUpdated,
}) => {

  const [types, setTypes] = useState<InventoryType[]>([]);

  const [form, setForm] = useState<GeneralFormState>({
    title: inventory.Title,
    description: inventory.Description ?? '',
    inventoryTypeId: inventory.InventoryTypeId,
    isPublic: inventory.IsPublic
  });

  const [rowVersion, setRowVersion] = useState<string>(inventory.RowVersion ?? '');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/inventory-types')
      .then(res => setTypes(res.data))
      .catch(() => setError('Failed to load categories'));
  }, []);

  const saveChanges = async () => {
    if (!canEdit || !dirty) return;

    try {
      setSaving(true);

      const res = await api.put(`/Inventory/${inventory.Id}`, {
        title: form.title,
        description: form.description,
        inventoryTypeId: form.inventoryTypeId,
        isPublic: form.isPublic,
        tags: inventory.Tags ?? [],
        rowVersion
      });

      setRowVersion(res.data.rowVersion);
      setDirty(false);

      onInventoryUpdated({
        Title: form.title,
        Description: form.description,
        InventoryTypeId: form.inventoryTypeId,
        IsPublic: form.isPublic,
        RowVersion: res.data.rowVersion
      });

    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('Inventory was modified by another user. Refresh page.');
      } else {
        setError('Failed to save changes');
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof GeneralFormState>(
    key: K,
    value: GeneralFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  return (
    <Paper sx={{ p: 3 }}>

      <Typography variant="h6" sx={{ mb: 2 }}>
        General settings
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2}>

        <TextField
          label="Title"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          disabled={!canEdit}
        />

        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          multiline
          rows={4}
          disabled={!canEdit}
        />

        <FormControl>

          <InputLabel>Category</InputLabel>

          <Select
            label="Category"
            value={form.inventoryTypeId}
            onChange={(e) => updateField('inventoryTypeId', Number(e.target.value))}
            disabled={!canEdit}
          >

            {types.map(type => (
              <MenuItem key={type.Id} value={type.Id}>
                {type.Name}
              </MenuItem>
            ))}

          </Select>

        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={form.isPublic}
              onChange={(e) => updateField('isPublic', e.target.checked)}
              disabled={!canEdit}
            />
          }
          label="Public inventory (all authenticated users can add items)"
        />

      </Stack>

      <Box sx={{ mt: 3 }}>

        <Button
          variant="contained"
          onClick={saveChanges}
          disabled={!dirty || saving || !canEdit}
        >
          Save
        </Button>

      </Box>

    </Paper>
  );
};

export default InventoryGeneralTab;