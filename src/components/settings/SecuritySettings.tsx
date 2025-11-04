import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Lock, Eye, EyeOff, LogOut, Smartphone, History, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { useTranslation } from '@/hooks/useTranslation';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';

type LoginHistoryEntry = Tables<'login_history'>;

const SecuritySettings = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(true);
  const [loginHistoryError, setLoginHistoryError] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    if (!passwordData.new || passwordData.new !== passwordData.confirm) {
      toast({
        title: t('Error'),
        description: t('New passwords do not match'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;

      setPasswordData({ current: '', new: '', confirm: '' });
      toast({
        title: t('Success'),
        description: t('Password updated successfully'),
      });
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to update password'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoading(true);
    try {
      // Sign out from all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      toast({
        title: t('Success'),
        description: t('Logged out from all devices'),
      });
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to logout from all devices'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const hasActiveFactor = data?.totp?.some(factor => factor.status === 'verified');
      setTwoFactorEnabled(!!hasActiveFactor);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled) {
      setShowTwoFactorSetup(true);
    } else {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const factor = data?.totp?.find(f => f.status === 'verified');
        
        if (factor) {
          const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (error) throw error;
          
          setTwoFactorEnabled(false);
          toast({
            title: t('Success'),
            description: t('Two-factor authentication disabled'),
          });
        }
      } catch (error: any) {
        toast({
          title: t('Error'),
          description: error.message || t('Failed to disable 2FA'),
          variant: 'destructive',
        });
        setTwoFactorEnabled(true);
      }
    }
  };

  const handleClearHistory = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('login_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setLoginHistory([]);
      toast({
        title: t('Success'),
        description: t('Login history cleared successfully'),
      });
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to clear login history'),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    checkTwoFactorStatus();
    
    const fetchLoginHistory = async () => {
      if (!user?.id) return;

      try {
        setLoginHistoryLoading(true);
        setLoginHistoryError(null);

        const { data, error } = await supabase
          .from('login_history')
          .select('*')
          .eq('user_id', user.id)
          .order('login_timestamp', { ascending: false })
          .limit(5);

        if (error) {
          setLoginHistoryError(t('Failed to load login history'));
          setLoginHistoryLoading(false);
          return;
        }

        setLoginHistory(data || []);
      } catch (error: any) {
        setLoginHistoryError(t('Failed to load login history'));
      } finally {
        setLoginHistoryLoading(false);
      }
    };

    const timer = setTimeout(fetchLoginHistory, 1000);
    return () => clearTimeout(timer);
  }, [user?.id, t]);

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('Change Password')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t('Current Password')}</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.current}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                placeholder={t('Enter current password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('New Password')}</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.new}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                placeholder={t('Enter new password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('Confirm New Password')}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
              placeholder={t('Confirm new password')}
            />
          </div>

          <Button onClick={handlePasswordChange} disabled={loading} className="w-full md:w-auto">
            {loading ? t('Updating...') : t('Update Password')}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t('Two-Factor Authentication')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('Enable 2FA')}</p>
              <p className="text-sm text-muted-foreground">
                {t('Add an extra layer of security to your account')}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
            />
          </div>
        </CardContent>
      </Card>

      <TwoFactorSetup
        open={showTwoFactorSetup}
        onOpenChange={setShowTwoFactorSetup}
        onSuccess={() => {
          checkTwoFactorStatus();
        }}
      />

      {/* Login History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('Login History')}
            </CardTitle>
            {loginHistory.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    {t('Clear History')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('Clear Login History')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('This will permanently delete all your login history records. This action cannot be undone.')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t('Clear All')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loginHistoryLoading ? (
            <div className="text-sm text-muted-foreground">{t('Loading login history...')}</div>
          ) : loginHistoryError ? (
            <div className="text-sm text-destructive">{loginHistoryError}</div>
          ) : loginHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('No login history available.')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Date & Time')}</TableHead>
                    <TableHead>{t('Device Info')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.login_timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {entry.user_agent ? (
                          <span className="text-xs text-muted-foreground truncate max-w-32 block">
                            {entry.user_agent.substring(0, 30)}...
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {entry.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs">
                            {entry.success ? t('Success') : t('Failed')}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('Active Sessions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {t('You are currently logged in on this device.')}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full md:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                {t('Logout from All Devices')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('Logout from All Devices')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('This will sign you out from all devices where you\'re currently logged in. You will need to sign in again on each device.')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogoutAllDevices} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('Logout All')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
