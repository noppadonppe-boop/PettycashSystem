import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useSessionExpired } from '../context/AuthContext';
import type { UserRole } from '../auth/roles';
import { hasAnyRole } from '../auth/roles';
import { logout } from '../auth/authService';

function Spinner() {
  return (
    <div className="w-full h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
    </div>
  );
}

export function ProtectedRoute({
  children,
  requireApproved = true,
  requireRoles,
}: {
  children: React.ReactNode;
  requireApproved?: boolean;
  requireRoles?: UserRole[];
}) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const sessionExpired = useSessionExpired();
  const location = useLocation();

  useEffect(() => {
    if (!firebaseUser) return;
    if (!sessionExpired) return;
    // Safe place to logout (NOT inside onAuthStateChanged).
    logout().catch(() => {});
  }, [firebaseUser, sessionExpired]);

  if (loading) return <Spinner />;

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (sessionExpired) {
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: 'session-expired' }} />;
  }

  // Important: if firebaseUser exists but profile hasn't loaded yet, show spinner.
  if (!userProfile) return <Spinner />;

  if (userProfile.status === 'rejected') return <Navigate to="/login" replace state={{ reason: 'rejected' }} />;

  if (requireApproved && userProfile.status === 'pending') return <Navigate to="/pending" replace />;
  if (requireApproved && userProfile.status !== 'approved') return <Navigate to="/pending" replace />;

  if (requireRoles && !hasAnyRole(userProfile.roles, requireRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

