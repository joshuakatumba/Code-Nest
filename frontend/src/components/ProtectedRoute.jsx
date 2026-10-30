import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const hasToken = Boolean(localStorage.getItem('codenest_token'));

  if (loading) {
    return <div className="loading-state">Loading session...</div>;
  }

  if (!user && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
