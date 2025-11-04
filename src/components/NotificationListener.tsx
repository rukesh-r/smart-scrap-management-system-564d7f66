import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const NotificationListener = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          toast({
            title: '🎉 New Purchase!',
            description: 'A buyer has purchased your scrap. Check your transactions.',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
            toast({
              title: '✅ Payment Completed!',
              description: 'Payment has been received for your scrap sale.',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
};
