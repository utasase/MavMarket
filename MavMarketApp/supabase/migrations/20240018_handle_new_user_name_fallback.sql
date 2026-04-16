create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'name'), ''),
      nullif(split_part(new.email, '@', 1), '')
    )
  );
  return new;
end;
$$ language plpgsql security definer;
