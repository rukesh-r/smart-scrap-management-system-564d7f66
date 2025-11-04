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
import { Input } from '@/components/ui/input';
import { Scale, IndianRupee, MapPin, Calendar, Wallet, Banknote, CreditCard, CheckCircle } from 'lucide-react';
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

interface Transaction {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_date: string;
}

interface CompletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScrapItem;
  onSuccess?: () => void;
}

const CompletePaymentDialog = ({ open, onOpenChange, item, onSuccess }: CompletePaymentDialogProps) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!profile || !open) return;

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('scrap_item_id', item.id)
        .eq('buyer_id', profile.user_id)
        .eq('status', 'pending')
        .single();

      if (data) {
        setTransaction(data as Transaction);
      }
    };

    fetchTransaction();
  }, [open, profile, item.id]);

  const handleCompletePayment = async () => {
    if (!profile || !transaction) return;

    // Validate based on payment method
    if (transaction.payment_method === 'upi' && !upiTransactionId.trim()) {
      toast({
        title: t('Transaction ID Required'),
        description: t('Please enter the UPI transaction ID'),
        variant: 'destructive',
      });
      return;
    }

    if (transaction.payment_method === 'card' && !confirmationCode.trim()) {
      toast({
        title: t('Confirmation Required'),
        description: t('Please enter the payment confirmation code'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Update transaction to completed
      const { error: txnError } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
        })
        .eq('id', transaction.id)
        .eq('buyer_id', profile.user_id);

      if (txnError) throw txnError;

      // Update scrap item to sold
      const { error: itemError } = await supabase
        .from('scrap_items')
        .update({ status: 'sold' })
        .eq('id', item.id);

      if (itemError) throw itemError;

      toast({
        title: t('Payment Completed'),
        description: t('Your payment has been successfully processed'),
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Complete payment error:', error);
      toast({
        title: t('Error'),
        description: (error instanceof Error ? error.message : String(error)) || t('Failed to complete payment'),
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'upi':
        return <Wallet className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return t('Cash on Pickup');
      case 'upi':
        return t('UPI Payment');
      case 'card':
        return t('Card Payment');
      default:
        return method;
    }
  };

  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            {t('Complete Payment')}
          </DialogTitle>
          <DialogDescription>
            {t('Confirm that you have completed the payment for this item')}
          </DialogDescription>
        </DialogHeader>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{item.weight_kg} kg</span>
                </div>

                <div className="flex items-center text-sm">
                  <IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium text-primary">
                    ₹{transaction.amount}
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
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{t('Transaction Date')}: {new Date(transaction.transaction_date).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">{t('Payment Method')}</Label>
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(transaction.payment_method)}
                <span className="font-medium">{getPaymentMethodLabel(transaction.payment_method)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('Amount to Pay:')}</span>
              <span className="text-2xl font-bold text-primary">
                ₹{transaction.amount}
              </span>
            </div>
          </div>

          {transaction.payment_method === 'upi' && (
            <div className="space-y-2">
              <Label htmlFor="upiTxnId" className="text-sm font-medium">
                {t('UPI Transaction ID')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upiTxnId"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                placeholder={t('Enter your UPI transaction ID')}
              />
              <p className="text-xs text-muted-foreground">
                {t('Enter the transaction ID received after making the UPI payment')}
              </p>
            </div>
          )}

          {transaction.payment_method === 'card' && (
            <div className="space-y-2">
              <Label htmlFor="confirmCode" className="text-sm font-medium">
                {t('Confirmation Code')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmCode"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder={t('Enter payment confirmation code')}
              />
              <p className="text-xs text-muted-foreground">
                {t('Enter the confirmation code from your payment receipt')}
              </p>
            </div>
          )}

          {transaction.payment_method === 'cash' && (
            <div className="border rounded-lg p-4 bg-warning/5 border-warning/20">
              <p className="text-sm text-foreground">
                <strong>{t('Note:')}</strong> {t('Please ensure you have collected the item and paid the seller in cash before completing this transaction.')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleCompletePayment}
            disabled={loading}
            className="bg-success hover:bg-success/90"
          >
            {loading ? t('Processing...') : t('Confirm Payment Completion')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompletePaymentDialog;
