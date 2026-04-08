-- ============================================================
-- Migration 20240014: Atomic message send RPC
-- Wraps rate limiting, message insert, rate-limit logging, and
-- conversation metadata updates in one transactional boundary.
-- ============================================================

create or replace function public.send_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_buyer_id uuid;
  v_seller_id uuid;
  v_now timestamptz := now();
begin
  v_caller_id := auth.uid();

  if v_caller_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_sender_id is distinct from v_caller_id then
    raise exception 'Not authorized to send as this user';
  end if;

  -- Serialize sends per user so the rate-limit check and log insert stay coherent.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_caller_id::text),
    pg_catalog.hashtext('send_message')
  );

  select buyer_id, seller_id
  into v_buyer_id, v_seller_id
  from public.conversations
  where id = p_conversation_id
  for update;

  if not found then
    raise exception 'Conversation not found';
  end if;

  if v_buyer_id <> v_caller_id and v_seller_id <> v_caller_id then
    raise exception 'Not authorized to send in this conversation';
  end if;

  if public.is_rate_limited(v_caller_id, 'send_message', 30, 60) then
    raise exception 'You''re sending messages too fast. Please slow down.';
  end if;

  insert into public.messages (conversation_id, sender_id, text, created_at)
  values (p_conversation_id, v_caller_id, p_text, v_now);

  insert into public.rate_limit_log (user_id, action, created_at)
  values (v_caller_id, 'send_message', v_now);

  update public.conversations
  set last_message = p_text,
      last_message_time = v_now
  where id = p_conversation_id;
end;
$$;

revoke all on function public.send_message(uuid, uuid, text) from public;
grant execute on function public.send_message(uuid, uuid, text) to authenticated;
