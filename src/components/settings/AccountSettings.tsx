import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserCog, Trash2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const AccountSettings = () => {
  const { profile, user, userRole, signOut } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', profile.user_id);

      if (roleError) throw roleError;

      const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);
      if (authError) throw authError;

      toast({
        title: t('Success'),
        description: t('Account deleted successfully'),
      });

      signOut();
    } catch (error: any) {
      toast({
        title: t('Error'),
        description: error.message || t('Failed to delete account'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getRoleLabel = (role: string) => {
    if (role === 'customer') return t('Seller');
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (!profile || !user) {
    return <div>{t('Loading...')}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            {t('Account Information')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('Full Name')}</Label>
              <p className="text-lg font-semibold">{profile.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('Email')}</Label>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('Role')}</Label>
              <div className="mt-1">
                <Badge className={getRoleColor(userRole?.role || 'customer')}>
                  {getRoleLabel(userRole?.role || 'customer')}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('Account Created')}</Label>
              <p className="text-lg font-semibold">
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {t('Connected Accounts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">G</span>
                </div>
                <div>
                  <p className="font-medium">Google</p>
                  <p className="text-sm text-muted-foreground">{t('Connected')}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {t('Disconnect')}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Connect additional accounts for easier login and account recovery.')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t('Danger Zone')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium text-destructive">{t('Delete Account')}</p>
              <p className="text-sm text-muted-foreground">
                {t('Permanently delete your account and all associated data. This action cannot be undone.')}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  {t('Delete Account')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:')}
                    <br /><br />
                    • {t('Your profile information')}<br />
                    • {t('All scrap items you\'ve listed')}<br />
                    • {t('Transaction history')}<br />
                    • {t('All associated data')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={loading}
                  >
                    {loading ? t('Deleting...') : t('Yes, delete my account')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;
