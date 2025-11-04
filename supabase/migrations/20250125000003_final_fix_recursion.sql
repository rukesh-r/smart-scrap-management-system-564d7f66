-- Drop ALL problematic policies
DROP POLICY IF EXISTS "Buyers can update available items to sold" ON public.scrap_items;
DROP POLICY IF EXISTS "Buyers can update scrap items when purchasing" ON public.scrap_items;

-- Drop the trigger that might cause recursion
DROP TRIGGER IF EXISTS auto_cleanup_transactions ON transactions;

-- Create simple non-recursive policy for buyers
CREATE POLICY "Buyers can update scrap items"
ON public.scrap_items
FOR UPDATE
USING (status IN ('available', 'pending'));

-- Recreate cleanup trigger to run AFTER statement completes (not during)
CREATE OR REPLACE FUNCTION public.trigger_cleanup_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only cleanup if this is a new pending transaction
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Use a simple update without complex queries
    UPDATE transactions
    SET status = 'cancelled'
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '2 minutes'
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_cleanup_transactions
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_on_transaction();
