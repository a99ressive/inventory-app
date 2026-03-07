import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminToken } from '../utils/auth';

interface Props {
  children: React.JSX.Element;
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<Props> = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdminToken(token)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
