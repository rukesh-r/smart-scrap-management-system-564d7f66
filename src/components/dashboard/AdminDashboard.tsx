import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalBuyers: number;
  totalScrapItems: number;
  availableItems: number;
  soldItems: number;
  totalTransactions: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalBuyers: 0,
    totalScrapItems: 0,
    availableItems: 0,
    soldItems: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [profilesRes, scrapItemsRes, transactionsRes] = await Promise.all([
        supabase.from('profiles').select('role', { count: 'exact' }),
        supabase.from('scrap_items').select('status', { count: 'exact' }),
        supabase.from('transactions').select('amount')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (scrapItemsRes.error) throw scrapItemsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      const profiles = profilesRes.data || [];
      const scrapItems = scrapItemsRes.data || [];
      const transactions = transactionsRes.data || [];

      const totalUsers = profiles.length;
      const totalCustomers = profiles.filter(p => p.role === 'customer').length;
      const totalBuyers = profiles.filter(p => p.role === 'buyer').length;

      const totalScrapItems = scrapItems.length;
      const availableItems = scrapItems.filter(item => item.status === 'available').length;
      const soldItems = scrapItems.filter(item => item.status === 'sold').length;

      const totalTransactions = transactions.length;
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        totalUsers,
        totalCustomers,
        totalBuyers,
        totalScrapItems,
        availableItems,
        soldItems,
        totalTransactions,
        totalRevenue,
      });
    } catch (error) {
      toast({
        title: t('Error'),
        description: t('Failed to fetch dashboard statistics'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('Admin Dashboard')}
        </h1>
        <p className="text-muted-foreground">
          {t('Monitor platform performance and user activity')}
        </p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('User Statistics')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Users')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Sellers')}</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Buyers')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalBuyers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('User Ratio')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalUsers > 0 ? Math.round((stats.totalBuyers / stats.totalUsers) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">{t('Buyers to Total')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Marketplace Stats */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('Marketplace Statistics')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Items')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScrapItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Available')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.availableItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Sold Items')}</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.soldItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Success Rate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalScrapItems > 0 ? Math.round((stats.soldItems / stats.totalScrapItems) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Stats */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('Transaction Statistics')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Transactions')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Revenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
