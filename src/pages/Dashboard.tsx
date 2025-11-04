import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import BuyerDashboard from '@/components/dashboard/BuyerDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleSelectionDialog from '@/components/auth/RoleSelectionDialog';

const Dashboard = () => {
  const { user, profile, userRole, loading, refreshUserRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Redirect to role selection if user doesn't have a role yet
  if (!userRole) {
    return <Navigate to="/role-selection" replace />;
  }

  const renderDashboard = () => {
    console.log('Current user role:', userRole?.role, 'User:', profile.full_name);
    
    switch (userRole?.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'buyer':
        return <BuyerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Navigate to="/role-selection" replace />;
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;
