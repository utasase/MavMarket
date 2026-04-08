-- Allow any authenticated user to insert notifications for any target user.
-- This is needed because notification creators (e.g. message senders) are not
-- the notification recipient.
CREATE POLICY notifications_insert
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
