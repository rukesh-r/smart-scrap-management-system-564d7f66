-- Improved complete_payment function with better error handling
CREATE OR REPLACE FUNCTION complete_payment(
  p_transaction_id UUID,
  p_buyer_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_scrap_item_id UUID;
  v_transaction_status TEXT;
  v_item_status TEXT;
BEGIN
  -- Get transaction details
  SELECT scrap_item_id, status INTO v_scrap_item_id, v_transaction_status
  FROM transactions
  WHERE id = p_transaction_id
  AND buyer_id = p_buyer_id;

  -- Check if transaction exists
  IF v_scrap_item_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Transaction not found or you are not the buyer'
    );
  END IF;

  -- Check if already completed
  IF v_transaction_status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Transaction already completed'
    );
  END IF;

  -- Check if transaction is pending
  IF v_transaction_status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Transaction is not in pending status'
    );
  END IF;

  -- Update transaction status to completed
  UPDATE transactions
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_transaction_id
  AND buyer_id = p_buyer_id;

  -- Update scrap item status to sold
  UPDATE scrap_items
  SET 
    status = 'sold',
    updated_at = NOW()
  WHERE id = v_scrap_item_id;

  -- Verify the updates
  SELECT status INTO v_item_status
  FROM scrap_items
  WHERE id = v_scrap_item_id;

  IF v_item_status != 'sold' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Failed to update item status'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'scrap_item_id', v_scrap_item_id,
    'message', 'Payment completed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_payment(UUID, UUID) TO authenticated;
