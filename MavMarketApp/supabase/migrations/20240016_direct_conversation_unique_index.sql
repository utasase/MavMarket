-- Remove any duplicate direct conversations (listing_id IS NULL) before
-- adding the unique index. Keep the oldest row for each (buyer_id, seller_id) pair.
DELETE FROM public.conversations
WHERE listing_id IS NULL
  AND id NOT IN (
    SELECT DISTINCT ON (buyer_id, seller_id) id
    FROM public.conversations
    WHERE listing_id IS NULL
    ORDER BY buyer_id, seller_id, created_at ASC
  );

-- Prevent future duplicate DM threads where there is no associated listing.
CREATE UNIQUE INDEX conversations_direct_unique
  ON public.conversations (buyer_id, seller_id)
  WHERE listing_id IS NULL;
