import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const navigate = useNavigate();

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
            </TableRow>
          </TableHead>

          <TableBody>
            {inventories.map((inv) => (
              <TableRow
                key={inv.Id}
                hover
                onClick={() => navigate(`/inventories/${inv.Id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{inv.Title}</TableCell>
                <TableCell>{inv.Description}</TableCell>
                <TableCell>{inv.IsPublic ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}

            {inventories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
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
