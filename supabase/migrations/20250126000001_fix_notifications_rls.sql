-- Drop existing triggers
DROP TRIGGER IF EXISTS on_transaction_created ON transactions;
DROP TRIGGER IF EXISTS on_transaction_completed ON transactions;

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION create_purchase_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  seller_user_id UUID;
BEGIN
  SELECT customer_id INTO seller_user_id
  FROM scrap_items
  WHERE id = NEW.scrap_item_id;
  
  IF seller_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      seller_user_id,
      'New Purchase!',
      'A buyer has purchased your scrap item.',
      'purchase'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION create_payment_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  seller_user_id UUID;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT customer_id INTO seller_user_id
    FROM scrap_items
    WHERE id = NEW.scrap_item_id;
    
    IF seller_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        seller_user_id,
        'Payment Completed!',
        'Payment has been received for your scrap sale.',
        'payment'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_purchase_notification();

CREATE TRIGGER on_transaction_completed
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_notification();
