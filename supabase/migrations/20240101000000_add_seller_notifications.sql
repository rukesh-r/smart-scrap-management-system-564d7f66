-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Create notification function for sellers
CREATE OR REPLACE FUNCTION notify_seller_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Notification is handled by realtime subscription in the app
  -- This trigger ensures the transaction is properly logged
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new purchases
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_on_purchase();

-- Create trigger for payment completion
CREATE TRIGGER on_transaction_completed
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION notify_seller_on_purchase();
