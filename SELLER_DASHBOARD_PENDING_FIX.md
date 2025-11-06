# Fix: Transactions Showing as Pending in Seller Dashboard

## Problem
When a buyer completes a transaction, the item still shows as "pending" in the seller dashboard instead of moving to "sold" status.

## Root Cause
The issue occurs when the `complete_payment()` database function fails to properly update both:
1. Transaction status (should be 'completed')
2. Scrap item status (should be 'sold')

## How the System Should Work

### Transaction Flow:
1. **Buyer initiates purchase** → Transaction: `pending`, Item: `pending`
2. **Buyer completes payment** → Transaction: `completed`, Item: `sold`
3. **Seller sees item in "Sold Items" tab** ✅

### Seller Dashboard Logic:
- The seller dashboard (CustomerDashboard.tsx) filters items by `scrap_items.status`
- **Available tab**: Shows items with status = 'available'
- **Pending tab**: Shows items with status = 'pending'
- **Sold tab**: Shows items with status = 'sold'

## Solution

### Step 1: Run the Diagnostic Query
Execute this in your Supabase SQL Editor to identify problematic transactions:

```sql
-- Find transactions that are completed but items are not marked as sold
SELECT 
  t.id as transaction_id,
  t.status as transaction_status,
  t.transaction_date,
  si.id as item_id,
  si.status as item_status,
  si.title,
  p_buyer.full_name as buyer_name,
  p_seller.full_name as seller_name
FROM transactions t
JOIN scrap_items si ON t.scrap_item_id = si.id
LEFT JOIN profiles p_buyer ON t.buyer_id = p_buyer.user_id
LEFT JOIN profiles p_seller ON si.customer_id = p_seller.user_id
WHERE t.status = 'completed' AND si.status != 'sold'
ORDER BY t.transaction_date DESC;
```

### Step 2: Fix Existing Data
Run the fix script to update all completed transactions:

```sql
-- Fix completed transactions where items are not marked as sold
UPDATE scrap_items
SET status = 'sold', updated_at = NOW()
WHERE id IN (
  SELECT si.id
  FROM scrap_items si
  JOIN transactions t ON t.scrap_item_id = si.id
  WHERE t.status = 'completed' AND si.status != 'sold'
);
```

### Step 3: Apply the Improved Function
Run the migration file to improve the `complete_payment()` function:

```bash
# Apply the new migration
supabase db push
```

Or manually execute: `supabase/migrations/20250127000000_improve_complete_payment.sql`

### Step 4: Verify the Fix
After applying the fixes, verify everything is working:

```sql
-- Check that all completed transactions have sold items
SELECT 
  COUNT(*) as mismatched_count
FROM transactions t
JOIN scrap_items si ON t.scrap_item_id = si.id
WHERE t.status = 'completed' AND si.status != 'sold';
-- Should return 0
```

## Prevention

The improved `complete_payment()` function now includes:
- ✅ Better error handling
- ✅ Transaction validation
- ✅ Status verification after updates
- ✅ Detailed error messages
- ✅ Atomic updates with proper exception handling

## Testing

After applying the fix, test the complete flow:

1. **As Buyer:**
   - Purchase an item
   - Complete the payment
   - Verify transaction shows as "completed" in buyer dashboard

2. **As Seller:**
   - Check that the item moved from "Pending" to "Sold Items" tab
   - Verify you received a notification about payment completion

3. **Database Check:**
   ```sql
   SELECT t.status as txn_status, si.status as item_status
   FROM transactions t
   JOIN scrap_items si ON t.scrap_item_id = si.id
   WHERE t.id = '<transaction_id>';
   ```
   Both should show: txn_status = 'completed', item_status = 'sold'

## Additional Notes

### Why Items Get Stuck in Pending:
1. **Database function failure** - The `complete_payment()` function encounters an error
2. **Permission issues** - User doesn't have proper permissions
3. **Race conditions** - Multiple updates happening simultaneously
4. **Network issues** - Request fails before completion

### Monitoring:
To monitor for this issue in the future, set up a periodic check:

```sql
-- Alert query: Run daily to find mismatched statuses
SELECT 
  COUNT(*) as pending_items_with_completed_transactions
FROM transactions t
JOIN scrap_items si ON t.scrap_item_id = si.id
WHERE t.status = 'completed' AND si.status = 'pending';
```

If this returns > 0, investigate immediately.
