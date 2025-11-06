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
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Scale, IndianRupee, MapPin, Package, Wallet, Banknote, CreditCard } from 'lucide-react';
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
  customer_id?: string;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScrapItem;
  onSuccess?: () => void;
}

const PurchaseDialog = ({ open, onOpenChange, item, onSuccess }: PurchaseDialogProps) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [sellerUpiId, setSellerUpiId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const fetchSellerUpi = async () => {
      if (!item.customer_id) return;
      const { data } = await supabase
        .from('profiles')
        .select('upi_id')
        .eq('user_id', item.customer_id)
        .single();
      if (data?.upi_id) setSellerUpiId(data.upi_id);
    };
    if (open) fetchSellerUpi();
  }, [open, item.customer_id]);

  const handlePurchase = async () => {
    if (!profile || !item.customer_id) return;

    if (paymentMethod === 'upi' && !transactionId.trim()) {
      toast({
        title: t('Transaction ID Required'),
        description: t('Please enter the UPI transaction ID'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('scrap_item_id', item.id)
      .in('status', ['pending', 'completed'])
      .single();

    if (existingTransaction) {
      toast({
        title: t('Already Purchased'),
        description: t('This item already has a transaction'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const transactionData: any = {
        scrap_item_id: item.id,
        buyer_id: profile.user_id,
        customer_id: item.customer_id,
        amount: item.actual_price || item.expected_price,
        status: 'pending',
        payment_method: paymentMethod,
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }

      const { error: updateError } = await supabase
        .from('scrap_items')
        .update({
          status: 'pending',
          actual_price: item.expected_price
        })
        .eq('id', item.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast({
        title: t('Purchase Initiated'),
        description: t('Your purchase is pending. Complete the payment to finalize.'),
      });

      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: t('Error'),
        description: error?.message || t('Failed to complete purchase. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('Purchase Confirmation')}</DialogTitle>
          <DialogDescription>
            {t('Review the item details before confirming your purchase.')}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-2 space-y-4" style={{ maxHeight: 'calc(90vh - 180px)', scrollbarWidth: 'thin' }}>
        <Card>
          <CardContent className="p-4">
            {item.image_url && (
              <div className="mb-4 rounded-md overflow-hidden bg-muted">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                <Badge className={getCategoryColor(item.category)}>
                  {item.category}
                </Badge>
              </div>

              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{item.weight_kg} kg</span>
                </div>

                <div className="flex items-center text-sm">
                  <IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium text-primary">
                    ₹{item.actual_price || item.expected_price}
                  </span>
                </div>
              </div>

              {item.location && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{item.location}</span>
                </div>
              )}

              <div className="flex items-center text-sm">
                <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{t('Listed on')} {new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-foreground mb-2">{t('Purchase Summary')}</h4>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('Total Amount:')}</span>
              <span className="text-xl font-bold text-primary">
                ₹{item.actual_price || item.expected_price}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('Payment Method')}</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{t('Cash on Pickup')}</p>
                    <p className="text-xs text-muted-foreground">{t('Pay when you collect the item')}</p>
                  </div>
                </Label>
              </div>

              {sellerUpiId && (
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{t('UPI Payment')}</p>
                      <p className="text-xs text-muted-foreground">{t('Pay now via UPI')}</p>
                    </div>
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{t('Card Payment')}</p>
                    <p className="text-xs text-muted-foreground">{t('Pay with debit/credit card')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === 'upi' && sellerUpiId && (
            <div className="space-y-3 border rounded-lg p-4 bg-primary/5">
              <div>
                <Label className="text-sm font-medium">{t('Seller UPI ID')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={sellerUpiId} readOnly className="font-mono" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(sellerUpiId);
                      toast({ title: t('Copied!'), description: t('UPI ID copied to clipboard') });
                    }}
                  >
                    {t('Copy')}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="txnId" className="text-sm font-medium">{t('Transaction ID')} *</Label>
                <Input
                  id="txnId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={t('Enter UPI transaction ID')}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Complete the payment and enter the transaction ID here')}
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="border rounded-lg p-4 bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                {t('Card payment gateway integration coming soon. Please use UPI or Cash.')}
              </p>
            </div>
          )}
        </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? t('Processing...') : t('Confirm Purchase')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
