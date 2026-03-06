import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/Auth/login', null, {
        params: { email, password }
      });
      localStorage.setItem('token', res.data.token);
      navigate('/inventories'); // пока не создано, но позже
    } catch {
      alert('Login failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" align="center">Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Sign In
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link to="/register">Don't have an account? Register</Link>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default Login;