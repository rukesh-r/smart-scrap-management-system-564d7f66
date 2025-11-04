import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, CreditCard, Receipt, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { useTranslation } from '@/hooks/useTranslation';

interface Transaction {
  id: string;
  amount: number;
  buyer_id: string;
  customer_id: string;
  scrap_item_id: string;
  status: string;
  payment_method?: string;
  transaction_date: string;
  scrap_item?: {
    title: string;
    category: string;
    status: string;
  };
}

const TransactionSettings = () => {
  const { profile, userRole } = useAuth();
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTransactions = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          scrap_item:scrap_items(title, category, status)
        `);

      if (userRole?.role === 'customer') {
        query = query.eq('customer_id', profile.user_id);
      } else if (userRole?.role === 'buyer') {
        query = query.eq('buyer_id', profile.user_id);
      }

      const { data, error } = await query
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Transaction fetch error:', error);
        setTransactions([]);
        setLoading(false);
        return;
      }

      setTransactions(data || []);
    } catch (error: any) {
      console.error('Transaction error:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTransactions, 500);
    return () => clearTimeout(timer);
  }, [profile?.user_id, userRole?.role]);

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  const handleDownloadReceipt = (transaction: Transaction) => {
    // Generate PDF receipt
    const doc = new jsPDF();

    // Set font to Times New Roman
    doc.setFont('times', 'normal');

    // Set up the PDF - Title with larger font
    doc.setFontSize(18);
    doc.text(t('EcoScrap Transaction Receipt'), 20, 30);

    // Add a line
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Transaction details - uniform font size
    doc.setFontSize(11);
    let yPosition = 50;

    doc.text(`${t('Transaction ID')}: ${transaction.id}`, 20, yPosition);
    yPosition += 10;

    doc.text(`${t('Date')}: ${new Date(transaction.transaction_date).toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;

    doc.text(`${t('Amount')}: ₹${transaction.amount.toFixed(2)}`, 20, yPosition);
    yPosition += 10;

    doc.text(`${t('Status')}: ${transaction.status}`, 20, yPosition);
    yPosition += 10;

    doc.text(`${t('Payment Method')}: ${transaction.payment_method || 'N/A'}`, 20, yPosition);
    yPosition += 15;

    // Item details - same font size
    doc.text(`${t('Item Details')}:`, 20, yPosition);
    yPosition += 10;

    doc.text(`${t('Item')}: ${transaction.scrap_item?.title || 'N/A'}`, 20, yPosition);
    yPosition += 10;

    doc.text(`${t('Category')}: ${transaction.scrap_item?.category || 'N/A'}`, 20, yPosition);
    yPosition += 20;

    // Footer - same font size
    doc.text(t('Thank you for using EcoScrap!'), 20, yPosition);

    // Save the PDF
    doc.save(`receipt-${transaction.id}.pdf`);

    toast({
      title: t('Success'),
      description: t('Receipt PDF downloaded successfully'),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const totalPurchases = transactions
    .filter(t => t.buyer_id === profile?.user_id && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSales = transactions
    .filter(t => t.customer_id === profile?.user_id && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return <div>{t('Loading transactions...')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Transaction Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Total Purchases')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.buyer_id === profile?.user_id && t.status === 'completed').length} {t('transactions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Total Sales')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.customer_id === profile?.user_id && t.status === 'completed').length} {t('transactions')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('Transaction History')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Transactions')}</SelectItem>
                <SelectItem value="completed">{t('Completed')}</SelectItem>
                <SelectItem value="pending">{t('Pending')}</SelectItem>
                <SelectItem value="failed">{t('Failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('No transactions found')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {transaction.scrap_item?.title || t('Unknown Item')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.scrap_item?.category} • {new Date(transaction.transaction_date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(transaction.status)}>
                        {t('Payment')}: {transaction.status}
                      </Badge>
                      <Badge variant="outline">
                        {t('Item')}: {transaction.scrap_item?.status || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-semibold">₹{transaction.amount.toFixed(2)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(transaction)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('Receipt')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionSettings;
