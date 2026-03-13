import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../api/axios';

interface InventoryCustomIdTabProps {
  inventoryId: string;
  customIdConfig: unknown;
  canEdit: boolean;
}

// Типы элементов — совпадают с C# enum CustomIdElementType
type ElementType =
  | 'FixedText'
  | 'Sequence'
  | 'Random6Digit'
  | 'Random9Digit'
  | 'Random20Bit'
  | 'Random32Bit'
  | 'Guid'
  | 'DateTime';

interface IdElement {
  Type: ElementType;
  Value?: string;    // для FixedText
  Format?: string;   // для DateTime
  Padding?: number;  // для Sequence
}

interface IdConfig {
  Elements: IdElement[];
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  FixedText:    'Fixed text',
  Sequence:     'Sequence',
  Random6Digit: '6-digit random',
  Random9Digit: '9-digit random',
  Random20Bit:  '20-bit random',
  Random32Bit:  '32-bit random',
  Guid:         'GUID',
  DateTime:     'Date/time',
};

function parseConfig(raw: unknown): IdConfig {
  if (
    raw &&
    typeof raw === 'object' &&
    'Elements' in raw &&
    Array.isArray((raw as IdConfig).Elements)
  ) {
    return raw as IdConfig;
  }
  // fallback — дефолтный sequence
  return { Elements: [{ Type: 'Sequence', Padding: 4 }] };
}

const DEFAULT_NEW_ELEMENT: IdElement = { Type: 'Sequence', Padding: 4 };

const InventoryCustomIdTab: React.FC<InventoryCustomIdTabProps> = ({
  inventoryId,
  customIdConfig,
  canEdit,
}) => {
  const [config, setConfig] = React.useState<IdConfig>(() => parseConfig(customIdConfig));
  const [preview, setPreview] = React.useState('');
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [newType, setNewType] = React.useState<ElementType>('Sequence');

  // Обновляем локальный стейт если пришёл новый config снаружи
  React.useEffect(() => {
    setConfig(parseConfig(customIdConfig));
  }, [customIdConfig]);

  const loadPreview = React.useCallback(async (cfg: IdConfig) => {
    try {
      setPreviewLoading(true);
      setError('');
      const res = await api.post(`/Inventory/${inventoryId}/custom-id/preview`, cfg);
      setPreview(String(res.data ?? ''));
    } catch {
      setError('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [inventoryId]);

  // Загружаем превью при изменении конфига
  React.useEffect(() => {
    void loadPreview(config);
  }, [config, loadPreview]);

  const updateElement = (index: number, patch: Partial<IdElement>) => {
    setConfig(prev => ({
      Elements: prev.Elements.map((el, i) => i === index ? { ...el, ...patch } : el),
    }));
  };

  const removeElement = (index: number) => {
    setConfig(prev => ({
      Elements: prev.Elements.filter((_, i) => i !== index),
    }));
  };

  const addElement = () => {
    const newEl: IdElement = newType === 'FixedText'
      ? { Type: 'FixedText', Value: '' }
      : newType === 'Sequence'
      ? { Type: 'Sequence', Padding: 4 }
      : newType === 'DateTime'
      ? { Type: 'DateTime', Format: 'yyyyMMdd' }
      : { Type: newType };

    setConfig(prev => ({ Elements: [...prev.Elements, newEl] }));
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.put(`/Inventory/${inventoryId}/fields`, {
        customIdConfig: config,
      });
      setSuccess('Saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Custom ID</Typography>

      {!canEdit && (
        <Alert severity="info">You have read-only access to Custom ID settings.</Alert>
      )}
      {error   && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {/* Превью */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2">Preview</Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => void loadPreview(config)} disabled={previewLoading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Chip
          label={previewLoading ? 'Generating…' : preview || '—'}
          variant="outlined"
          sx={{ fontFamily: 'monospace', fontSize: 15 }}
        />
      </Paper>

      {/* Список элементов */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Elements ({config.Elements.length})
        </Typography>

        <Stack spacing={1.5}>
          {config.Elements.map((el, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              {/* Номер */}
              <Typography
                variant="caption"
                sx={{ mt: 1, minWidth: 20, color: 'text.secondary' }}
              >
                {i + 1}.
              </Typography>

              {/* Тип (только чтение, чтобы не путаться) */}
              <Chip
                label={ELEMENT_LABELS[el.Type]}
                size="small"
                sx={{ mt: 0.5, flexShrink: 0 }}
              />

              {/* Доп. параметры */}
              <Box sx={{ flex: 1 }}>
                {el.Type === 'FixedText' && (
                  <TextField
                    size="small"
                    label="Text"
                    value={el.Value ?? ''}
                    disabled={!canEdit}
                    onChange={(e) => updateElement(i, { Value: e.target.value })}
                    fullWidth
                  />
                )}
                {el.Type === 'Sequence' && (
                  <TextField
                    size="small"
                    label="Padding (leading zeros)"
                    type="number"
                    value={el.Padding ?? 4}
                    disabled={!canEdit}
                    onChange={(e) => updateElement(i, { Padding: Number(e.target.value) })}
                    sx={{ width: 200 }}
                    inputProps={{ min: 1, max: 20 }}
                  />
                )}
                {el.Type === 'DateTime' && (
                  <TextField
                    size="small"
                    label="Format"
                    value={el.Format ?? 'yyyyMMdd'}
                    disabled={!canEdit}
                    onChange={(e) => updateElement(i, { Format: e.target.value })}
                    helperText="e.g. yyyyMMdd, yyyy-MM-dd, HHmm"
                    sx={{ width: 240 }}
                  />
                )}
              </Box>

              {/* Удалить */}
              {canEdit && (
                <Tooltip title="Remove element">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeElement(i)}
                    disabled={config.Elements.length <= 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Stack>

        {/* Добавить элемент */}
        {canEdit && config.Elements.length < 10 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Add element</InputLabel>
              <Select
                label="Add element"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ElementType)}
              >
                {(Object.keys(ELEMENT_LABELS) as ElementType[]).map((t) => (
                  <MenuItem key={t} value={t}>
                    {ELEMENT_LABELS[t]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addElement}
            >
              Add
            </Button>
          </Box>
        )}
      </Paper>

      {/* Сохранить */}
      {canEdit && (
        <Box>
          <Button
            variant="contained"
            onClick={() => void saveConfig()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Custom ID config'}
          </Button>
        </Box>
      )}
    </Stack>
  );
};

export default InventoryCustomIdTab;