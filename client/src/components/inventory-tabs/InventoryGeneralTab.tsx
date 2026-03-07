import React from 'react';
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

const INVENTORY_TYPES = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Books' },
  { id: 3, name: 'Apparel' },
  { id: 4, name: 'Furniture' },
  { id: 5, name: 'Tools' },
  { id: 6, name: 'Automotive' },
  { id: 7, name: 'Sports' },
  { id: 8, name: 'Medical' },
  { id: 9, name: 'Food' },
  { id: 10, name: 'Cosmetics' },
  { id: 11, name: 'Construction' },
  { id: 12, name: 'Miscellaneous' },
];

function createFormFromInventory(inventory: Inventory): GeneralFormState {
  return {
    title: inventory.Title ?? '',
    description: inventory.Description ?? '',
    inventoryTypeId: inventory.InventoryTypeId,
    isPublic: inventory.IsPublic,
  };
}

const InventoryGeneralTab: React.FC<InventoryGeneralTabProps> = ({
  inventory,
  canEdit,
  onInventoryUpdated,
}) => {
  const [form, setForm] = React.useState<GeneralFormState>(() => createFormFromInventory(inventory));
  const [rowVersion, setRowVersion] = React.useState<string>(inventory.RowVersion ?? '');
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [error, setError] = React.useState('');
  const [conflict, setConflict] = React.useState(false);

  React.useEffect(() => {
    setForm(createFormFromInventory(inventory));
    setRowVersion(inventory.RowVersion ?? '');
    setDirty(false);
    setConflict(false);
  }, [inventory]);

  const saveChanges = React.useCallback(async () => {
    if (!canEdit || !dirty || saving || conflict) return;

    if (!rowVersion) {
      setError('Missing version token. Reload page and try again.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const res = await api.put(`/Inventory/${inventory.Id}`, {
        title: form.title,
        description: form.description,
        inventoryTypeId: form.inventoryTypeId,
        isPublic: form.isPublic,
        tags: inventory.Tags ?? [],
        rowVersion,
      });

      const nextRowVersion = (res.data?.RowVersion as string | undefined) ?? rowVersion;
      setRowVersion(nextRowVersion);
      setDirty(false);
      setConflict(false);
      setLastSavedAt(new Date());

      onInventoryUpdated({
        Title: form.title,
        Description: form.description,
        InventoryTypeId: form.inventoryTypeId,
        IsPublic: form.isPublic,
        RowVersion: nextRowVersion,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setConflict(true);
        setError('Inventory was changed by another user. Refresh the page before editing again.');
        return;
      }

      setError('Autosave failed. Changes are still local and will retry on next cycle.');
    } finally {
      setSaving(false);
    }
  }, [canEdit, dirty, saving, conflict, rowVersion, inventory.Id, inventory.Tags, form, onInventoryUpdated]);

  React.useEffect(() => {
    if (!canEdit) return undefined;

    const timer = window.setInterval(() => {
      void saveChanges();
    }, 8000);

    return () => window.clearInterval(timer);
  }, [canEdit, saveChanges]);

  const onFieldChange = <K extends keyof GeneralFormState>(key: K, value: GeneralFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setConflict(false);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        General settings
      </Typography>

      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to inventory settings.
        </Alert>
      )}

      {error && (
        <Alert severity={conflict ? 'warning' : 'error'} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label="Title"
          value={form.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          disabled={!canEdit}
          required
        />

        <TextField
          label="Description"
          value={form.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          multiline
          minRows={4}
          disabled={!canEdit}
        />

        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={form.inventoryTypeId}
            onChange={(event) => onFieldChange('inventoryTypeId', Number(event.target.value))}
            disabled={!canEdit}
          >
            {INVENTORY_TYPES.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={form.isPublic}
              onChange={(event) => onFieldChange('isPublic', event.target.checked)}
              disabled={!canEdit}
            />
          }
          label="Public inventory (all authenticated users can add/edit items)"
        />
      </Stack>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          onClick={() => void saveChanges()}
          disabled={!canEdit || !dirty || saving || conflict}
        >
          Save now
        </Button>
        <Typography variant="body2" color="text.secondary">
          {saving && 'Saving...'}
          {!saving && dirty && !conflict && 'Unsaved changes. Autosave runs every 8 seconds.'}
          {!saving && !dirty && lastSavedAt && `Last saved: ${lastSavedAt.toLocaleTimeString()}`}
          {!saving && !dirty && !lastSavedAt && 'No local changes.'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default InventoryGeneralTab;
