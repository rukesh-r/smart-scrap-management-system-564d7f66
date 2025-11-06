-- Fix for transactions showing as pending in seller dashboard
-- This script ensures that when a buyer completes payment, the seller sees it as sold

-- Step 1: Check current status of transactions and items
SELECT 
  t.id as transaction_id,
  t.status as transaction_status,
  si.id as item_id,
  si.status as item_status,
  si.title,
  t.buyer_id,
  si.customer_id as seller_id
FROM transactions t
JOIN scrap_items si ON t.scrap_item_id = si.id
WHERE t.status = 'completed' AND si.status != 'sold'
ORDER BY t.transaction_date DESC;

-- Step 2: Fix any completed transactions where item status is not 'sold'
UPDATE scrap_items
SET status = 'sold'
WHERE id IN (
  SELECT si.id
  FROM scrap_items si
  JOIN transactions t ON t.scrap_item_id = si.id
  WHERE t.status = 'completed' AND si.status != 'sold'
);

-- Step 3: Verify the fix
SELECT 
  t.id as transaction_id,
  t.status as transaction_status,
  si.id as item_id,
  si.status as item_status,
  si.title
FROM transactions t
JOIN scrap_items si ON t.scrap_item_id = si.id
WHERE t.status = 'completed'
ORDER BY t.transaction_date DESC
LIMIT 10;
