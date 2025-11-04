-- Function to automatically cancel expired pending transactions and reset item status
CREATE OR REPLACE FUNCTION cleanup_expired_pending_transactions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update scrap items back to available if transaction is pending for more than 5 minutes
  UPDATE scrap_items si
  SET status = 'available'
  WHERE si.id IN (
    SELECT t.scrap_item_id
    FROM transactions t
    WHERE t.status = 'pending'
    AND t.created_at < NOW() - INTERVAL '5 minutes'
  );

  -- Cancel the expired pending transactions
  UPDATE transactions
  SET status = 'cancelled'
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Create a unique constraint to prevent multiple transactions per scrap item
CREATE UNIQUE INDEX idx_one_transaction_per_item 
ON transactions(scrap_item_id) 
WHERE status IN ('pending', 'completed');
