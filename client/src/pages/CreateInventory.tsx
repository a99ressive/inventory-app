import React, { useState } from 'react';
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
  FormControl
} from '@mui/material';

const CreateInventory: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inventoryTypeId, setInventoryTypeId] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const navigate = useNavigate();

  const types = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Books' },
    { id: 3, name: 'Apparel' },
    // остальные...
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/Inventory', {
        title,
        description,
        inventoryTypeId,
        isPublic
      });
      navigate('/inventories');
// вместо navigate(`/inventories/${res.data}`);
    } catch {
      alert('Failed to create inventory');
    }
  };

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
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Type</InputLabel>
          <Select
            value={inventoryTypeId}
            label="Type"
            onChange={(e) => setInventoryTypeId(Number(e.target.value))}
          >
            {types.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
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
          label="Public"
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Create
        </Button>
      </form>
    </Container>
  );
};

export default CreateInventory;
