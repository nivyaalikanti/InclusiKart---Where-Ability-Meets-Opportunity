import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner'; // Default import

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'seller' && user.profileStatus !== 'verified') {
    const allowedPaths = ['/seller/profile-verification', '/seller/dashboard'];
    const currentPath = window.location.pathname;
    
    if (!allowedPaths.includes(currentPath)) {
      return <Navigate to="/seller/profile-verification" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;