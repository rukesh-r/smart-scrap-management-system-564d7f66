import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface ScrapItem {
  id: string;
  title: string;
}

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScrapItem;
  onSuccess?: () => void;
}

const EditTransactionDialog = ({ open, onOpenChange, item, onSuccess }: EditTransactionDialogProps) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!profile || !open) return;
      const { data } = await supabase
        .from('transactions')
        .select('payment_method')
        .eq('scrap_item_id', item.id)
        .eq('buyer_id', profile.user_id)
        .single();
      if (data?.payment_method) setPaymentMethod(data.payment_method);
    };
    fetchTransaction();
  }, [open, item.id, profile]);

  const handleUpdate = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ payment_method: paymentMethod })
        .eq('scrap_item_id', item.id)
        .eq('buyer_id', profile.user_id);

      if (error) throw error;

      toast({
        title: t('Success'),
        description: t('Transaction updated successfully'),
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: t('Error'),
        description: t('Failed to update transaction'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit Transaction')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t('Payment Method')}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('Cash on Pickup')}</SelectItem>
                <SelectItem value="upi">{t('UPI Payment')}</SelectItem>
                <SelectItem value="card">{t('Card Payment')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? t('Updating...') : t('Update')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;
