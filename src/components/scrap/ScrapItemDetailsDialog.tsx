import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Scale, IndianRupee, MapPin, Calendar, User, Package, Star, Clock, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import EditScrapDialog from './EditScrapDialog';

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
  location_lat?: number;
  location_lng?: number;
  created_at: string;
  customer_id: string;
}

interface Profile {
  full_name: string;
  phone?: string;
  address?: string;
  role: string;
  upi_id?: string;
}

interface ScrapItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScrapItem;
  isOwner: boolean;
  onUpdate?: () => void;
}

const ScrapItemDetailsDialog = ({ open, onOpenChange, item, isOwner, onUpdate }: ScrapItemDetailsDialogProps) => {
  const { profile: currentProfile } = useAuth();
  const { t } = useTranslation();
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const fetchSellerProfile = async () => {
    if (!item.customer_id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, address, role, upi_id')
      .eq('user_id', item.customer_id)
      .single();

    if (error) {
      console.error('Error fetching seller profile:', error);
    } else {
      setSellerProfile(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && item.customer_id) {
      fetchSellerProfile();
    }
  }, [open, item.customer_id]);

  const getCategoryColor = (category: string) => {
    const colors = {
      'Metal': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
      'Plastic': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Paper': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Glass': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'Electronics': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Textile': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'Wood': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success/10 text-success border-success/20';
      case 'sold':
        return 'bg-muted text-muted-foreground border-muted';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('Item Details')}</span>
            <Badge className={getStatusColor(item.status)}>
              {item.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {t('Complete information about this scrap item')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Image and Basic Info */}
          <Card>
            <CardContent className="p-4">
              {item.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-2xl font-bold text-primary mb-1">
                      <IndianRupee className="h-6 w-6 mr-1" />
                      ₹{item.actual_price || item.expected_price}
                    </div>
                    {item.actual_price && item.actual_price !== item.expected_price && (
                      <div className="text-sm text-muted-foreground line-through">
                        ₹{item.expected_price}
                      </div>
                    )}
                  </div>
                </div>

                {item.description && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{t('Description')}</h4>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Item Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Package className="h-5 w-5 mr-2" />
                {t('Specifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">{t('Weight')}</span>
                    <p className="font-medium">{item.weight_kg} kg</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">{t('Category')}</span>
                    <p className="font-medium">{item.category}</p>
                  </div>
                </div>
              </div>

              {item.location && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">{t('Location')}</span>
                      <p className="font-medium">{item.location}</p>
                    </div>
                  </div>
                  {item.location_lat && item.location_lng && (
                    <a
                      href={`https://www.google.com/maps?q=${item.location_lat},${item.location_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline ml-6"
                    >
                      <MapPin className="h-4 w-4" />
                      {t('View on Google Maps')}
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">{t('Listed')}</span>
                  <p className="font-medium">{formatDate(item.created_at)}</p>
                  <p className="text-xs text-muted-foreground">
                    {calculateDaysAgo(item.created_at)} {calculateDaysAgo(item.created_at) === 1 ? t('day') : t('days')} {t('ago')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller/Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2" />
                {isOwner ? t('Your Information') : t('Seller Information')}
              </CardTitle>
            </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  </div>
                ) : sellerProfile ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">{t('Name')}</span>
                      <p className="font-medium">{sellerProfile.full_name}</p>
                    </div>

                    {sellerProfile.phone && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t('Phone')}</span>
                        <p className="font-medium">{sellerProfile.phone}</p>
                      </div>
                    )}

                    {sellerProfile.address && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t('Address')}</span>
                        <p className="font-medium">{sellerProfile.address}</p>
                      </div>
                    )}

                    {sellerProfile.upi_id && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t('UPI ID (Payment)')}</span>
                        <p className="font-medium">{sellerProfile.upi_id}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {t('Verified')} {sellerProfile.role}
                      </Badge>
                    </div>
                  </div>
              ) : (
                <p className="text-muted-foreground">{t('Information not available')}</p>
              )}
            </CardContent>
          </Card>

          {/* Pricing History (if applicable) */}
          {item.actual_price && item.actual_price !== item.expected_price && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {t('Pricing History')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('Original asking price')}</span>
                    <span className="line-through text-muted-foreground">₹{item.expected_price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{t('Current price')}</span>
                    <span className="font-bold text-primary">₹{item.actual_price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {isOwner && item.status === 'available' && (
            <Button type="button" onClick={() => setShowEditDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('Edit Item')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <EditScrapDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={item}
        onSuccess={() => {
          onUpdate?.();
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
};

export default ScrapItemDetailsDialog;
