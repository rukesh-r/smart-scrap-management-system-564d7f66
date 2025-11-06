-- Function to complete payment and update item status
CREATE OR REPLACE FUNCTION complete_payment(
  p_transaction_id UUID,
  p_buyer_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_scrap_item_id UUID;
  v_result JSONB;
BEGIN
  -- Get the scrap item ID from transaction
  SELECT scrap_item_id INTO v_scrap_item_id
  FROM transactions
  WHERE id = p_transaction_id
  AND buyer_id = p_buyer_id
  AND status = 'pending';

  IF v_scrap_item_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found or already completed');
  END IF;

  -- Update transaction status
  UPDATE transactions
  SET status = 'completed'
  WHERE id = p_transaction_id
  AND buyer_id = p_buyer_id;

  -- Update scrap item status
  UPDATE scrap_items
  SET status = 'sold'
  WHERE id = v_scrap_item_id;

  RETURN jsonb_build_object('success', true, 'scrap_item_id', v_scrap_item_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
