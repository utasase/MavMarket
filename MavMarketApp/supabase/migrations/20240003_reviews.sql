-- Reviews: buyers can leave a rating + comment for a seller after a transaction
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

-- Anyone authenticated can read reviews (trust signals are public)
create policy "reviews_select" on public.reviews
  for select to authenticated using (true);

-- Only the reviewer can insert; cannot review yourself
create policy "reviews_insert" on public.reviews
  for insert to authenticated
  with check (reviewer_id = auth.uid() and reviewer_id <> seller_id);

create index reviews_seller_id_idx on public.reviews(seller_id);
create index reviews_reviewer_id_idx on public.reviews(reviewer_id);

-- Keep users.rating and review_count in sync automatically
create or replace function public.update_user_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.users
  set
    rating = (select avg(rating)::numeric(3,2) from public.reviews where seller_id = new.seller_id),
    review_count = (select count(*) from public.reviews where seller_id = new.seller_id)
  where id = new.seller_id;
  return new;
end;
$$;

create trigger on_review_insert
  after insert on public.reviews
  for each row execute procedure public.update_user_rating();
