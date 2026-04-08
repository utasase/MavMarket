-- Allow sellers to also initiate conversations, not just buyers.
DROP POLICY conversations_insert ON public.conversations;

CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );
