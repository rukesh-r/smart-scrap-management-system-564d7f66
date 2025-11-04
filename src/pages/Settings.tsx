import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Palette, CreditCard, MapPin, UserCog, ArrowLeft } from 'lucide-react';
import ProfileSettings from '@/components/settings/ProfileSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import TransactionSettings from '@/components/settings/TransactionSettings';
import LocationSettings from '@/components/settings/LocationSettings';

import AccountSettings from '@/components/settings/AccountSettings';
import { useTranslation } from '@/hooks/useTranslation';

const Settings = () => {
  const { user, profile, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('security');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('Loading settings...')}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  const currentRole = userRole?.role || 'customer';

  // Define which tabs are visible for each role
  const getVisibleTabs = (role: string) => {
    const baseTabs = [
      { id: 'security', label: t('Security'), icon: Shield },
      { id: 'preferences', label: t('Preferences'), icon: Palette },
      { id: 'account', label: t('Account'), icon: UserCog },
    ];

    if (role === 'customer' || role === 'buyer') {
      return [
        ...baseTabs,
        { id: 'transactions', label: t('Transactions'), icon: CreditCard },
        { id: 'location', label: t('Location'), icon: MapPin },
      ];
    }

    return baseTabs;
  };

  const visibleTabs = getVisibleTabs(currentRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-light via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back to Dashboard')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('Settings')}</h1>
          <p className="text-muted-foreground">
            {t('Manage your account preferences and settings')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('Account Settings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 text-xs md:text-sm"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="security">
                <SecuritySettings />
              </TabsContent>

              <TabsContent value="preferences">
                <PreferencesSettings />
              </TabsContent>

              {(currentRole === 'customer' || currentRole === 'buyer') && (
                <TabsContent value="transactions">
                  <TransactionSettings />
                </TabsContent>
              )}

              {(currentRole === 'customer' || currentRole === 'buyer') && (
                <TabsContent value="location">
                  <LocationSettings />
                </TabsContent>
              )}

              <TabsContent value="account">
                <AccountSettings />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
