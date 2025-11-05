import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Recycle,
  LogOut,
  User,
  Settings,
  Package,
  ShoppingCart,
  BarChart3,
  Menu,
  X,
  Home,
  PlusCircle,
  History,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { NotificationBell } from '@/components/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, profile, userRole, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'buyer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'customer':
        return <Package className="h-4 w-4" />;
      case 'buyer':
        return <ShoppingCart className="h-4 w-4" />;
      case 'admin':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'customer') return t('Seller');
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const currentRole = userRole?.role || 'customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light via-background to-accent/5">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Recycle className="h-8 w-8 text-primary mr-2" />
                <span className="text-2xl font-bold text-foreground">EcoScrap</span>
              </div>
              <Badge className={getRoleColor(currentRole)}>
                {getRoleIcon(currentRole)}
                <span className="ml-1">{getRoleLabel(currentRole)}</span>
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hover:bg-green-200">
                <Home className="h-4 w-4 mr-1" />
                {t('Home')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login-history')} className="hover:bg-green-200">
                <History className="h-4 w-4 mr-1" />
                {t('History')}
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{t('Welcome back!')}</p>
              </div>
              <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all" onClick={() => navigate('/profile')}>
                <AvatarImage src={avatarUrl} alt={profile?.full_name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
