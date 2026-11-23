-- ============================================================================
-- Floral & Co  ·  Supabase schema  (run this whole file once in the SQL Editor)
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

-- ---------- Admins ----------------------------------------------------------
-- Only emails listed here can change anything. Add yours in step 2 of SETUP.md.
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------- Collections -----------------------------------------------------
create table if not exists public.collections (
  id          text primary key,
  slug        text not null unique,
  title       text not null,
  description text not null default '',
  cover_url   text,
  theme       jsonb not null default '{"pattern":"botanical","from":"#1B2B23","to":"#496B52","accent":"#82977A"}'::jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- Products --------------------------------------------------------
create table if not exists public.products (
  id                    text primary key,
  slug                  text not null unique,
  name                  text not null,
  description           text not null default '',
  price                 numeric(10,2) not null check (price >= 0),
  category              text not null default 'other-crafts',
  collection_slug       text references public.collections(slug) on update cascade on delete set null,
  images                jsonb not null default '[]'::jsonb,
  featured              boolean not null default false,
  trending              boolean not null default false,
  is_available          boolean not null default true,
  keywords              text[] not null default '{}',
  customisation_options jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists products_collection_idx on public.products (collection_slug);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------- Orders ----------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  status          text not null default 'waiting'
                  check (status in ('waiting','approved','crafting','packed','shipped','delivered','dismissed')),
  dismiss_reason  text check (dismiss_reason in ('expired','rejected')),
  customer_name   text,
  phone           text,
  phone_last4     text not null,
  address         text,
  notes           text,
  items           jsonb not null default '[]'::jsonb,
  subtotal        numeric(10,2) not null default 0,
  image_url       text,
  image_file_id   text,
  attach_token    text not null,
  admin_note      text,
  status_history  jsonb not null default '[]'::jsonb,
  expires_at      timestamptz default (now() + interval '24 hours'),
  purge_at        timestamptz,
  pii_erased      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_status_idx   on public.orders (status, created_at desc);
create index if not exists orders_expires_idx  on public.orders (expires_at) where status = 'waiting';
create index if not exists orders_cleanup_idx  on public.orders (pii_erased) where image_file_id is not null;

-- Keeps the status history, clears the 24h timer on approval, and schedules the erase for rejected orders.
create or replace function public.orders_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.status is distinct from old.status then
    new.status_history = coalesce(old.status_history, '[]'::jsonb)
      || jsonb_build_object('status', new.status, 'at', now());
    if new.status <> 'waiting' and new.status <> 'dismissed' then
      new.expires_at = null;           -- approved orders never expire
    end if;
    if new.status = 'dismissed' then
      if new.dismiss_reason is null then new.dismiss_reason = 'rejected'; end if;
      if new.dismiss_reason = 'rejected' and new.purge_at is null then
        new.purge_at = now() + interval '24 hours';  -- gives you a day to message the customer first
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

-- First history entry on creation
create or replace function public.orders_before_insert()
returns trigger language plpgsql as $$
begin
  if new.status_history = '[]'::jsonb then
    new.status_history = jsonb_build_array(jsonb_build_object('status', new.status, 'at', now()));
  end if;
  return new;
end $$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

-- ---------- Rate limiting (used by the /api functions) ----------------------
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        integer not null default 0
);
alter table public.rate_limits enable row level security;   -- no policies = nobody but the service key

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning r.count into v_count;
  return v_count <= p_limit;
end $$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- ---------- The 24-hour rule ------------------------------------------------
-- 1. Unapproved orders past their deadline become "dismissed".
-- 2. Dismissed orders lose name, phone, address, notes and items. Only the order number (and status) stays.
--    Expired orders are erased at once; rejected ones one day after rejection.
-- The ImageKit picture is deleted afterwards by /api/cron-cleanup (image_file_id is kept until then).
create or replace function public.expire_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_erased integer;
begin
  update public.orders
     set status = 'dismissed', dismiss_reason = 'expired'
   where status = 'waiting' and expires_at is not null and expires_at <= now();

  update public.orders
     set customer_name = null, phone = null, address = null, notes = null,
         items = '[]'::jsonb, image_url = null, pii_erased = true
   where status = 'dismissed'
     and pii_erased = false
     and (dismiss_reason = 'expired' or (purge_at is not null and purge_at <= now()));
  get diagnostics v_erased = row_count;

  delete from public.rate_limits where window_start < now() - interval '2 days';
  return v_erased;
end $$;

revoke all on function public.expire_orders() from public, anon, authenticated;
grant execute on function public.expire_orders() to service_role;

-- Hourly job (pg_cron). If this line errors, enable "pg_cron" under Database > Extensions and run the file again.
create extension if not exists pg_cron;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'floral-expire-orders') then
    perform cron.unschedule('floral-expire-orders');
  end if;
  perform cron.schedule('floral-expire-orders', '0 * * * *', 'select public.expire_orders();');
end $$;

-- ---------- Row-level security ----------------------------------------------
alter table public.products    enable row level security;
alter table public.collections enable row level security;
alter table public.orders      enable row level security;

-- Public visitors: read products and collections only
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select to anon, authenticated using (true);
drop policy if exists "public read collections" on public.collections;
create policy "public read collections" on public.collections for select to anon, authenticated using (true);

-- Admin: everything
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write collections" on public.collections;
create policy "admin write collections" on public.collections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Orders: admin only. The website never reads this table directly; /api functions use the service key.
drop policy if exists "admin orders" on public.orders;
create policy "admin orders" on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.orders from anon;
revoke all on public.rate_limits from anon, authenticated;
revoke all on public.admins from anon;
