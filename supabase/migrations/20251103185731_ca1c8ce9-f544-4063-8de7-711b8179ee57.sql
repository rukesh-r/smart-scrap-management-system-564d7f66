-- Update cleanup function to use 2 minutes timeout instead of 5
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_transactions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update scrap items back to available if pending transaction expired (2 minutes)
  UPDATE scrap_items si
  SET status = 'available'
  WHERE si.id IN (
    SELECT t.scrap_item_id
    FROM transactions t
    WHERE t.status = 'pending'
    AND t.created_at < NOW() - INTERVAL '2 minutes'
  );

  -- Cancel expired pending transactions (2 minutes)
  UPDATE transactions
  SET status = 'cancelled'
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '2 minutes';
END;
$$;

-- Create a trigger to automatically cleanup on transaction insert/update
CREATE OR REPLACE FUNCTION public.trigger_cleanup_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.cleanup_expired_pending_transactions();
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS auto_cleanup_transactions ON transactions;

-- Create trigger that runs cleanup whenever a transaction is inserted or updated
CREATE TRIGGER auto_cleanup_transactions
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_on_transaction();