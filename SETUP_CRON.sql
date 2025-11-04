-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup function to run every minute
SELECT cron.schedule(
  'cleanup-expired-transactions',
  '* * * * *',
  'SELECT cleanup_expired_pending_transactions();'
);
