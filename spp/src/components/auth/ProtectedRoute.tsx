import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole } from '../../utils/role';
import type { Role } from '../../utils/role';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-primary/20 border-t-emerald-primary rounded-full animate-spin" />
          <span className="text-sm font-bold text-obsidian animate-pulse">Memuat hak akses...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(normalizeRole(user.role))) {
      // Redirect to their appropriate dashboard if wrong role
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};
