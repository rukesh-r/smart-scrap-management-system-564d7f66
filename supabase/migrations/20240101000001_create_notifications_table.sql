-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create function to notify seller on purchase
CREATE OR REPLACE FUNCTION create_purchase_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.seller_id,
    'New Purchase!',
    'A buyer has purchased your scrap item.',
    'purchase'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to notify seller on payment completion
CREATE OR REPLACE FUNCTION create_payment_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.seller_id,
      'Payment Completed!',
      'Payment has been received for your scrap sale.',
      'payment'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS on_transaction_created ON transactions;
DROP TRIGGER IF EXISTS on_transaction_completed ON transactions;

-- Create new triggers
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_purchase_notification();

CREATE TRIGGER on_transaction_completed
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_notification();
