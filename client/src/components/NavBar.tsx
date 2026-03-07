import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { isAdminToken } from '../utils/auth';

const NavBar: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAdmin = isAdminToken(token);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ display: 'flex', gap: 2 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ color: 'inherit', textDecoration: 'none', mr: 2 }}
        >
          Inventory App
        </Typography>

        <Box
          component="form"
          onSubmit={onSearch}
          sx={{ flexGrow: 1, maxWidth: 500 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Search inventories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              sx: { backgroundColor: 'white', borderRadius: 1 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" edge="end" size="small">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {token ? (
          <>
            <Button color="inherit" component={RouterLink} to="/inventories">
              My inventories
            </Button>
            {isAdmin && (
              <Button color="inherit" component={RouterLink} to="/admin">
                Admin
              </Button>
            )}
            <Button color="inherit" component={RouterLink} to="/profile">
              Profile
            </Button>
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
