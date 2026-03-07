import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  TextField,
  Button,
  Container,
  Typography,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress
} from '@mui/material';

interface InventoryType {
  id: number;
  name: string;
}

const CreateInventory: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inventoryTypeId, setInventoryTypeId] = useState<number | ''>('');
  const [isPublic, setIsPublic] = useState(false);
  const [types, setTypes] = useState<InventoryType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/inventory-types')
      .then(res => {
        setTypes(res.data);
        if (res.data.length > 0) {
          setInventoryTypeId(res.data[0].id);
        }
      })
      .catch(() => {
        alert('Failed to load inventory types');
      })
      .finally(() => setLoadingTypes(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inventoryTypeId) {
      alert('Please select inventory type');
      return;
    }

    try {
      await api.post('/Inventory', {
        title,
        description,
        inventoryTypeId,
        isPublic
      });

      navigate('/inventories');
    } catch {
      alert('Failed to create inventory');
    }
  };

  if (loadingTypes) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Create Inventory
      </Typography>

      <form onSubmit={handleSubmit}>

        <TextField
          fullWidth
          margin="normal"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <TextField
          fullWidth
          margin="normal"
          label="Description"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Category</InputLabel>

          <Select
            value={inventoryTypeId}
            label="Category"
            onChange={(e) => setInventoryTypeId(Number(e.target.value))}
          >
            {types.map(type => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>

        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          }
          label="Public inventory (all authenticated users can add items)"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
        >
          Create Inventory
        </Button>

      </form>
    </Container>
  );
};

export default CreateInventory;