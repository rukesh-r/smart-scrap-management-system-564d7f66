-- Update all existing pending transactions to completed
-- Run this in your Supabase SQL Editor

UPDATE transactions
SET status = 'completed'
WHERE status = 'pending'
AND scrap_item_id IN (
  SELECT id FROM scrap_items WHERE status = 'sold'
);
