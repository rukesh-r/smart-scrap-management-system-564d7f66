import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, IndianRupee, TrendingUp } from 'lucide-react';
import ScrapItemCard from '@/components/scrap/ScrapItemCard';
import AddScrapDialog from '@/components/scrap/AddScrapDialog';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface ScrapItem {
  id: string;
  title: string;
  description: string;
  category: string;
  weight_kg: number;
  expected_price: number;
  actual_price?: number;
  image_url?: string;
  status: string;
  location?: string;
  created_at: string;
  customer_id: string;
}

const CustomerDashboard = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'sold'>('available');

  const fetchScrapItems = async () => {
    if (!profile) return;

    // Revert expired pending items (non-blocking)
    supabase.rpc('revert_expired_pending_items').then().catch(() => {});

    const { data, error } = await supabase
      .from('scrap_items')
      .select('*')
      .eq('customer_id', profile.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('Error'),
        description: t('Failed to fetch your scrap items'),
        variant: 'destructive',
      });
    } else {
      setScrapItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScrapItems();
  }, [profile, t]);

  const stats = {
    totalItems: scrapItems.length,
    availableItems: scrapItems.filter(item => item.status === 'available').length,
    pendingItems: scrapItems.filter(item => item.status === 'pending').length,
    soldItems: scrapItems.filter(item => item.status === 'sold').length,
    totalValue: scrapItems.reduce((sum, item) => sum + (item.actual_price || item.expected_price), 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t('Welcome back')}, {profile?.full_name}!
        </h1>
        <p className="text-muted-foreground">
          {t('Manage your scrap listings and track your sales')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Total Items')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
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
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.soldItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Total Value')}</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button and Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'available' ? 'default' : 'outline'}
            onClick={() => setActiveTab('available')}
          >
            {t('Available Items')} ({stats.availableItems})
          </Button>
          <Button
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
          >
            {t('Pending')} ({stats.pendingItems})
          </Button>
          <Button
            variant={activeTab === 'sold' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sold')}
          >
            {t('Sold Items')} ({stats.soldItems})
          </Button>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          {t('Add New Item')}
        </Button>
      </div>

      {/* Scrap Items Grid */}
      {scrapItems.filter(item => item.status === activeTab).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {activeTab === 'available' ? t('No available items') : activeTab === 'pending' ? t('No pending items') : t('No sold items yet')}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {activeTab === 'available' 
                ? t('Start by adding your first scrap item to the marketplace')
                : activeTab === 'pending'
                ? t('Items with pending payments will appear here')
                : t('Items you sell will appear here')}
            </p>
            {activeTab === 'available' && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('Add Your First Item')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scrapItems
            .filter(item => item.status === activeTab)
            .map((item) => (
              <ScrapItemCard
                key={item.id}
                item={item}
                isOwner={true}
                onUpdate={fetchScrapItems}
              />
            ))}
        </div>
      )}

      {/* Add Scrap Dialog */}
      <AddScrapDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchScrapItems}
      />
    </div>
  );
};

export default CustomerDashboard;
