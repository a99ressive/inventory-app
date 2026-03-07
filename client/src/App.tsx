import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import MyInventories from './pages/MyInventories';
import CreateInventory from './pages/CreateInventory';
import InventoryDetail from './pages/InventoryDetail';
import Home from './pages/Home';
import { Box, Container } from '@mui/material';
import Profile from './pages/Profile';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Box>
      <NavBar />
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin>
                <AdminPage />
              </PrivateRoute>
            }
          />

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
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route path="/inventories/:id" element={<InventoryDetail />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
