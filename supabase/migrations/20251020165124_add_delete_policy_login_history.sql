-- Add policy to allow users to delete their own login history
CREATE POLICY "Users can delete their own login history" ON login_history
  FOR DELETE USING (auth.uid() = user_id);
