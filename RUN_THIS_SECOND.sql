-- STEP 2: Improve the complete_payment function to prevent future issues
-- Run this after Step 1

CREATE OR REPLACE FUNCTION complete_payment(
  p_transaction_id UUID,
  p_buyer_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_scrap_item_id UUID;
  v_transaction_status TEXT;
BEGIN
  -- Get transaction details
  SELECT scrap_item_id, status INTO v_scrap_item_id, v_transaction_status
  FROM transactions
  WHERE id = p_transaction_id AND buyer_id = p_buyer_id;

  IF v_scrap_item_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  IF v_transaction_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already processed');
  END IF;

  -- Update transaction to completed
  UPDATE transactions
  SET status = 'completed'
  WHERE id = p_transaction_id AND buyer_id = p_buyer_id;

  -- Update item to sold
  UPDATE scrap_items
  SET status = 'sold'
  WHERE id = v_scrap_item_id;

  RETURN jsonb_build_object('success', true, 'scrap_item_id', v_scrap_item_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
