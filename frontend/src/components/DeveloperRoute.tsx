import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DeveloperRouteProps {
  children: React.ReactNode;
}

export const DeveloperRoute: React.FC<DeveloperRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '24px',
          color: '#667eea',
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isDeveloper) {
    // Not a developer - redirect to game
    return <Navigate to="/game" replace />;
  }

  return <>{children}</>;
};
