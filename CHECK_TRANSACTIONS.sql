-- Check transactions and their scrap item status
SELECT 
  t.id,
  t.amount,
  t.status as payment_status,
  si.status as item_status,
  si.title
FROM transactions t
LEFT JOIN scrap_items si ON t.scrap_item_id = si.id
ORDER BY t.transaction_date DESC
LIMIT 20;
