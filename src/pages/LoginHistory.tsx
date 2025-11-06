import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { History, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { useTranslation } from '@/hooks/useTranslation';
import DashboardLayout from '@/components/layout/DashboardLayout';

type LoginHistoryEntry = Tables<'login_history'>;

const LoginHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('login_history')
          .select('*')
          .eq('user_id', user.id)
          .order('login_timestamp', { ascending: false });

        if (error) {
          setError(t('Failed to load login history'));
          return;
        }

        setLoginHistory(data || []);
      } catch (error: any) {
        setError(t('Failed to load login history'));
      } finally {
        setLoading(false);
      }
    };

    fetchLoginHistory();
  }, [user?.id, t]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('Loading...')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back to Dashboard')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('Login History')}</h1>
          <p className="text-muted-foreground">
            {t('View your recent login activity and security events')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('Recent Login Activity')}
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
            {loading ? (
              <div className="text-sm text-muted-foreground">{t('Loading login history...')}</div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : loginHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('No login history available.')}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Login Time')}</TableHead>
                      <TableHead>{t('Logout Time')}</TableHead>
                      <TableHead>{t('Duration')}</TableHead>
                      <TableHead>{t('Login Method')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((entry) => {
                      const loginTime = new Date(entry.login_timestamp);
                      const logoutTime = entry.logout_timestamp ? new Date(entry.logout_timestamp) : null;
                      const duration = logoutTime ? Math.round((logoutTime.getTime() - loginTime.getTime()) / 60000) : null;
                      
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="text-sm">{loginTime.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            <div className="text-xs text-muted-foreground">{loginTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                          </TableCell>
                          <TableCell>
                            {logoutTime ? (
                              <>
                                <div className="text-sm">{logoutTime.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                                <div className="text-xs text-muted-foreground">{logoutTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</div>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">{t('Active')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {duration !== null ? (
                              <span className="text-xs">{duration} {t('min')}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs capitalize">{entry.login_method || 'email'}</span>
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LoginHistory;
