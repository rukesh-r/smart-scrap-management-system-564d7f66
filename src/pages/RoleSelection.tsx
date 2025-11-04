import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import RoleSelectionDialog from '@/components/auth/RoleSelectionDialog';

const RoleSelection = () => {
  const { user, userRole, loading, refreshUserRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if user already has a role
  if (!loading && userRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading while checking auth state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleRoleSelected = async () => {
    await refreshUserRole();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light via-background to-accent/10">
      <RoleSelectionDialog
        open={true}
        userId={user.id}
        onRoleSelected={handleRoleSelected}
      />
    </div>
  );
};

export default RoleSelection;