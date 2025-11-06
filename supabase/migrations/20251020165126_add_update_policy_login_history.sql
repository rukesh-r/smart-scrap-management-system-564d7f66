-- Add policy to allow users to update their own login history (for logout timestamp)
CREATE POLICY "Users can update their own login history" ON login_history
  FOR UPDATE USING (auth.uid() = user_id);
