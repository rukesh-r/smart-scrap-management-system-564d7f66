import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ShoppingCart, Package, Filter } from 'lucide-react';
import ScrapItemCard from '@/components/scrap/ScrapItemCard';
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

const BuyerDashboard = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<ScrapItem[]>([]);
  const [pendingItems, setPendingItems] = useState<ScrapItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ScrapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [weightFilter, setWeightFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'pending' | 'purchased'>('marketplace');

  const categories = [
    'Metal', 'Plastic', 'Paper', 'Glass', 'Electronics', 'Textile', 'Wood', 'Other'
  ];

  const fetchAvailableScrap = async () => {
    if (!profile) return;

    const { data: myTransactions } = await supabase
      .from('transactions')
      .select('scrap_item_id')
      .eq('buyer_id', profile.user_id)
      .in('status', ['pending', 'completed']);

    const purchasedIds = myTransactions?.map(t => t.scrap_item_id) || [];

    const { data, error } = await supabase
      .from('scrap_items')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('Error'),
        description: t('Failed to fetch available scrap items'),
        variant: 'destructive',
      });
    } else {
      const availableItems = (data || []).filter(item => !purchasedIds.includes(item.id));
      setScrapItems(availableItems);
      setFilteredItems(availableItems);
    }
  };

  const fetchPendingItems = async () => {
    if (!profile) return;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('scrap_item_id')
      .eq('buyer_id', profile.user_id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending transactions:', error);
      return;
    }

    const itemIds = transactions?.map(t => t.scrap_item_id) || [];
    
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('scrap_items')
        .select('*')
        .in('id', itemIds)
        .order('created_at', { ascending: false });

      setPendingItems(items || []);
    } else {
      setPendingItems([]);
    }
  };

  const fetchPurchasedItems = async () => {
    if (!profile) return;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('scrap_item_id')
      .eq('buyer_id', profile.user_id)
      .eq('status', 'completed');

    if (error) {
      console.error('Error fetching purchased transactions:', error);
      return;
    }

    const itemIds = transactions?.map(t => t.scrap_item_id) || [];
    
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('scrap_items')
        .select('*')
        .in('id', itemIds)
        .order('created_at', { ascending: false });

      setPurchasedItems(items || []);
    } else {
      setPurchasedItems([]);
    }
  };

  useEffect(() => {
    if (profile) {
      setLoading(true);
      Promise.all([
        fetchAvailableScrap(),
        fetchPendingItems(),
        fetchPurchasedItems()
      ]).finally(() => setLoading(false));
    }
  }, [profile]);

  useEffect(() => {
    let filtered = scrapItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Weight filter
    if (weightFilter !== 'all') {
      switch (weightFilter) {
        case 'light':
          filtered = filtered.filter(item => item.weight_kg < 10);
          break;
        case 'medium':
          filtered = filtered.filter(item => item.weight_kg >= 10 && item.weight_kg < 50);
          break;
        case 'heavy':
          filtered = filtered.filter(item => item.weight_kg >= 50);
          break;
      }
    }

    setFilteredItems(filtered);
  }, [scrapItems, searchTerm, categoryFilter, weightFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
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
          {t('Scrap Marketplace')}
        </h1>
        <p className="text-muted-foreground">
          {t('Discover and purchase recyclable materials from verified sellers')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'marketplace' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('marketplace');
            setSearchTerm('');
            setCategoryFilter('all');
            setWeightFilter('all');
          }}
        >
          {t('Marketplace')} ({scrapItems.length})
        </Button>
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
        >
          {t('Pending')} ({pendingItems.length})
        </Button>
        <Button
          variant={activeTab === 'purchased' ? 'default' : 'outline'}
          onClick={() => setActiveTab('purchased')}
        >
          {t('Completed')} ({purchasedItems.length})
        </Button>
      </div>

      {/* Stats */}
      {activeTab === 'marketplace' && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Available Items')}</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{scrapItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Categories')}</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(scrapItems.map(item => item.category)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Weight')}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scrapItems.reduce((sum, item) => sum + item.weight_kg, 0).toFixed(1)} kg
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters - Only show for marketplace */}
      {activeTab === 'marketplace' && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('Search items...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t('Category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Categories')}</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={weightFilter} onValueChange={setWeightFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t('Weight Range')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Weights')}</SelectItem>
            <SelectItem value="light">{t('Light (< 10kg)')}</SelectItem>
            <SelectItem value="medium">{t('Medium (10-50kg)')}</SelectItem>
            <SelectItem value="heavy">{t('Heavy (> 50kg)')}</SelectItem>
          </SelectContent>
        </Select>
        </div>
      )}

      {/* Results */}
      <div>
        {activeTab === 'marketplace' ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? t('Item') : t('Items')} {t('Found')}
              </h2>
            </div>

            {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('No items found')}</h3>
              <p className="text-muted-foreground text-center">
                {t('Try adjusting your search filters to find more items')}
              </p>
            </CardContent>
          </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <ScrapItemCard
                    key={item.id}
                    item={item}
                    isOwner={false}
                    onUpdate={() => {
                      fetchAvailableScrap();
                      fetchPendingItems();
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'pending' ? (
          <>
            {pendingItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('No pending transactions')}</h3>
              <p className="text-muted-foreground text-center">
                {t('Pending payments will appear here')}
              </p>
            </CardContent>
          </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingItems.map((item) => (
                  <ScrapItemCard
                    key={item.id}
                    item={item}
                    isOwner={false}
                    showCompleteButton={true}
                    showCancelButton={true}
                    showEditButton={true}
                    onUpdate={() => {
                      fetchAvailableScrap();
                      fetchPendingItems();
                      fetchPurchasedItems();
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {purchasedItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('No completed purchases')}</h3>
              <p className="text-muted-foreground text-center">
                {t('Completed purchases will appear here')}
              </p>
            </CardContent>
          </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {purchasedItems.map((item) => (
                  <ScrapItemCard
                    key={item.id}
                    item={item}
                    isOwner={false}
                    onUpdate={() => {
                      fetchAvailableScrap();
                      fetchPendingItems();
                      fetchPurchasedItems();
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
