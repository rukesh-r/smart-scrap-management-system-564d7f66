-- Delete duplicate transactions, keeping only the latest one per item
DELETE FROM transactions
WHERE id NOT IN (
  SELECT DISTINCT ON (scrap_item_id) id
  FROM transactions
  WHERE status IN ('pending', 'completed')
  ORDER BY scrap_item_id, created_at DESC
);

-- Now create the unique constraint
CREATE UNIQUE INDEX idx_one_transaction_per_item 
ON transactions(scrap_item_id) 
WHERE status IN ('pending', 'completed');

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_pending_transactions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE scrap_items si
  SET status = 'available'
  WHERE si.id IN (
    SELECT t.scrap_item_id
    FROM transactions t
    WHERE t.status = 'pending'
    AND t.created_at < NOW() - INTERVAL '5 minutes'
  );

  UPDATE transactions
  SET status = 'cancelled'
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '5 minutes';
END;
$$;
