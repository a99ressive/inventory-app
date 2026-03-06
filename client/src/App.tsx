import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import MyInventories from './pages/MyInventories';
import CreateInventory from './pages/CreateInventory';
import InventoryDetail from './pages/InventoryDetail';
import { Box, Container } from '@mui/material';

function App() {
  return (
    <Box>
      <NavBar />
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/inventories"
            element={
              <PrivateRoute>
                <MyInventories />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventories/new"
            element={
              <PrivateRoute>
                <CreateInventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventories/:id"
            element={
              <PrivateRoute>
                <InventoryDetail />
              </PrivateRoute>
            }
          />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;