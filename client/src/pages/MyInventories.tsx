import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
} from '@mui/material';
import type { Inventory } from '../types';

const MyInventories: React.FC = () => {
  const [inventories, setInventories] = useState<Inventory[]>([]);

  useEffect(() => {
    api.get('/Inventory/mine').then((res) => {
      setInventories(res.data);
    });
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        My Inventories
      </Typography>
      <Button
        component={Link}
        to="/inventories/new"
        variant="contained"
        sx={{ mb: 2 }}
      >
        Create New Inventory
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Public</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventories.map((inv) => (
              <TableRow key={inv.Id}>
                <TableCell>{inv.Title}</TableCell>
                <TableCell>{inv.Description}</TableCell>
                <TableCell>{inv.IsPublic ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button component={Link} to={`/inventories/${inv.Id}`}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {inventories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No inventories yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default MyInventories;