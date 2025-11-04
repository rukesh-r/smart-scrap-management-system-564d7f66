import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Scale, IndianRupee, Eye, CheckCircle, X, Edit } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import PurchaseDialog from './PurchaseDialog';
import ScrapItemDetailsDialog from './ScrapItemDetailsDialog';
import EditTransactionDialog from './EditTransactionDialog';
import CompletePaymentDialog from './CompletePaymentDialog';
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

interface ScrapItemCardProps {
  item: ScrapItem;
  isOwner: boolean;
  onUpdate?: () => void;
  showCompleteButton?: boolean;
  showCancelButton?: boolean;
  showEditButton?: boolean;
}

const ScrapItemCard = ({ item, isOwner, onUpdate, showCompleteButton = false, showCancelButton = false, showEditButton = false }: ScrapItemCardProps) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <Badge className={getCategoryColor(item.category)}>
              {item.category}
            </Badge>
            <Badge className={getStatusColor(item.status)}>
              {item.status}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg text-card-foreground line-clamp-2">{item.title}</h3>
        </CardHeader>

        <CardContent className="pb-3">
          {item.image_url && (
            <div className="mb-3 rounded-md overflow-hidden bg-muted">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {item.description}
          </p>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Scale className="h-4 w-4 mr-2" />
              <span>{item.weight_kg} kg</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <IndianRupee className="h-4 w-4 mr-2" />
              <span className="font-medium text-foreground">
                ₹{item.actual_price || item.expected_price}
              </span>
              {item.actual_price && item.actual_price !== item.expected_price && (
                <span className="ml-2 line-through">
                  ₹{item.expected_price}
                </span>
              )}
            </div>

            {item.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{item.location}</span>
              </div>
            )}

            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3">
          {showCompleteButton || showCancelButton || showEditButton ? (
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex space-x-2">
                {showCompleteButton && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('Complete Payment')}
                  </Button>
                )}
                {showEditButton && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('Edit Payment')}
                  </Button>
                )}
              </div>
              {showCancelButton && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error: txnError } = await supabase
                        .from('transactions')
                        .update({ status: 'cancelled' })
                        .eq('scrap_item_id', item.id)
                        .eq('buyer_id', profile?.user_id);

                      if (txnError) throw txnError;

                      const { error: itemError } = await supabase
                        .from('scrap_items')
                        .update({ status: 'available' })
                        .eq('id', item.id);

                      if (itemError) throw itemError;

                      toast({
                        title: t('Success'),
                        description: t('Transaction cancelled'),
                      });
                      onUpdate?.();
                    } catch (error) {
                      toast({
                        title: t('Error'),
                        description: t('Failed to cancel transaction'),
                        variant: 'destructive',
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('Cancel Payment')}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex space-x-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDetailsDialog(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('View Details')}
              </Button>
              {!isOwner && item.status === 'available' && (
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => setShowPurchaseDialog(true)}
                >
                  {t('Buy Now')}
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Purchase Dialog */}
      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        item={item}
        onSuccess={onUpdate}
      />

      {/* Details Dialog */}
      <ScrapItemDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        item={item}
        isOwner={isOwner}
        onUpdate={onUpdate}
      />

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={item}
        onSuccess={onUpdate}
      />

      {/* Complete Payment Dialog */}
      <CompletePaymentDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        item={item}
        onSuccess={onUpdate}
      />
    </>
  );
};

export default ScrapItemCard;
