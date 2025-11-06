import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLoginTracking = (userId: string | undefined) => {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const logLogin = async () => {
      try {
        const { data, error } = await supabase
          .from('login_history')
          .insert({
            user_id: userId,
            login_timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            login_method: 'email',
            success: true
          })
          .select('id')
          .single();

        if (!error && data) {
          sessionIdRef.current = data.id;
        }
      } catch (error) {
        console.error('Failed to log login:', error);
      }
    };

    const logLogout = async () => {
      if (!sessionIdRef.current) return;

      try {
        await supabase
          .from('login_history')
          .update({ logout_timestamp: new Date().toISOString() })
          .eq('id', sessionIdRef.current);
      } catch (error) {
        console.error('Failed to log logout:', error);
      }
    };

    logLogin();

    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        navigator.sendBeacon(
          `${supabase.supabaseUrl}/rest/v1/login_history?id=eq.${sessionIdRef.current}`,
          JSON.stringify({ logout_timestamp: new Date().toISOString() })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      logLogout();
    };
  }, [userId]);

  return sessionIdRef;
};
