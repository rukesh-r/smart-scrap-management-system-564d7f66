-- Function to revert pending items back to available after 1 minute
CREATE OR REPLACE FUNCTION revert_expired_pending_items()
RETURNS void AS $$
BEGIN
  UPDATE scrap_items
  SET status = 'available'
  WHERE status = 'pending'
  AND updated_at < NOW() - INTERVAL '1 minute'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.scrap_item_id = scrap_items.id
    AND t.status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check and revert on item view
CREATE OR REPLACE FUNCTION check_and_revert_pending()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM revert_expired_pending_items();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs before selecting scrap items
-- Note: PostgreSQL doesn't support SELECT triggers, so we'll call this manually
