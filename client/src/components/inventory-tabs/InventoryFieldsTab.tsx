import React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/axios';
import { parseCustomFields } from '../../utils/inventoryData';
import type { CustomField } from '../../types';

interface InventoryFieldsTabProps {
  inventoryId: string;
  customFields: unknown;
  canEdit: boolean;
  onFieldsUpdated: (newFields: CustomField[]) => void;
}

type FieldType = 'string' | 'text' | 'number' | 'boolean' | 'link';

const TYPE_LABELS: Record<FieldType, string> = {
  string:  'Single-line text',
  text:    'Multi-line text',
  number:  'Number',
  boolean: 'Checkbox (true/false)',
  link:    'Link (URL)',
};

const MAX_PER_TYPE = 3;

const InventoryFieldsTab: React.FC<InventoryFieldsTabProps> = ({
  inventoryId,
  customFields,
  canEdit,
  onFieldsUpdated,
}) => {
  const [fields, setFields] = React.useState<CustomField[]>(() =>
    parseCustomFields(customFields)
  );

  // форма добавления
  const [newTitle, setNewTitle] = React.useState('');
  const [newType, setNewType] = React.useState<FieldType>('string');
  const [newDescription, setNewDescription] = React.useState('');
  const [newShowInTable, setNewShowInTable] = React.useState(true);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    setFields(parseCustomFields(customFields));
  }, [customFields]);

  const countOfType = (type: FieldType) =>
    fields.filter((f) => f.Type === type).length;

  const canAddType = (type: FieldType) => countOfType(type) < MAX_PER_TYPE;

  const saveFields = async (newFields: CustomField[]) => {
    try {
      setSaving(true);
      setError('');
      await api.put(`/Inventory/${inventoryId}/fields`, { fields: newFields });
      setFields(newFields);
      onFieldsUpdated(newFields);
      setSuccess('Saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save fields');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) { setError('Title is required'); return; }
    if (fields.some((f) => f.Title === title)) { setError('Field with this title already exists'); return; }
    if (!canAddType(newType)) { setError(`Max ${MAX_PER_TYPE} fields of type "${TYPE_LABELS[newType]}"`); return; }

    const field: CustomField = {
      Type: newType,
      Title: title,
      Description: newDescription.trim() || null,
      ShowInTable: newShowInTable,
    };

    const updated = [...fields, field];
    void saveFields(updated);
    setNewTitle('');
    setNewDescription('');
    setNewShowInTable(true);
  };

  const handleDelete = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    void saveFields(updated);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Fields</Typography>

      {!canEdit && (
        <Alert severity="info">You have read-only access to field settings.</Alert>
      )}
      {error   && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {/* Таблица текущих полей */}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Show in table</TableCell>
              {canEdit && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, i) => (
              <TableRow key={`${field.Type}-${field.Title}`}>
                <TableCell>{field.Title}</TableCell>
                <TableCell>{TYPE_LABELS[field.Type as FieldType] ?? field.Type}</TableCell>
                <TableCell>{field.Description || '—'}</TableCell>
                <TableCell>{field.ShowInTable ? 'Yes' : 'No'}</TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <Tooltip title="Delete field">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(i)}
                        disabled={saving}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} align="center" sx={{ color: 'text.secondary' }}>
                  No custom fields yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Форма добавления */}
      {canEdit && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Add new field</Typography>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                label="Field name"
                size="small"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                sx={{ flex: 1, minWidth: 180 }}
                required
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as FieldType)}
                >
                  {(Object.entries(TYPE_LABELS) as [FieldType, string][]).map(([val, label]) => (
                    <MenuItem key={val} value={val} disabled={!canAddType(val)}>
                      {label}
                      {!canAddType(val) && ' (max 3)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Description (shown as hint in form)"
              size="small"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              fullWidth
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newShowInTable}
                    onChange={(e) => setNewShowInTable(e.target.checked)}
                  />
                }
                label="Show in items table"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={saving || !newTitle.trim()}
              >
                {saving ? 'Saving…' : 'Add field'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default InventoryFieldsTab;