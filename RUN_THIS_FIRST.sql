-- STEP 1: Fix existing stuck transactions
-- Run this first to update all completed transactions where items are still pending

UPDATE scrap_items
SET status = 'sold', updated_at = NOW()
WHERE id IN (
  SELECT si.id
  FROM scrap_items si
  JOIN transactions t ON t.scrap_item_id = si.id
  WHERE t.status = 'completed' AND si.status != 'sold'
);

-- Verify the fix worked
SELECT 
  t.status as transaction_status,
  si.status as item_status,
  si.title,
  t.transaction_date
FROM transactions t
JOIN scrap_items si ON t.scrap_item_id = si.id
WHERE t.status = 'completed'
ORDER BY t.transaction_date DESC
LIMIT 10;
