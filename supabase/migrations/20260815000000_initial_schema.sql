-- OnlinePDFPro: Initial reproducible database schema
-- Reproduces tables, constraints, RLS enablement, policies, and indexes.

-- `orders.id` uses gen_random_uuid(). Keep the extension in the migration
-- history so a clean recovery database does not depend on a dashboard-only
-- default. Supabase exposes pgcrypto in the normal extensions schema; the
-- unqualified form remains portable to local Postgres as well.
create extension if not exists pgcrypto;

-- 1. Products table
create table if not exists public.products (
    id text primary key,
    title text not null,
    description text,
    price_inr integer not null check (price_inr > 0),
    preview_url text,
    r2_key text not null,
    status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
    created_at timestamptz not null default now()
);

-- 2. Orders table
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id text not null references public.products(id) on delete restrict,
    razorpay_order_id text not null unique,
    razorpay_payment_id text,
    razorpay_signature text,
    amount_inr integer not null check (amount_inr > 0),
    status text not null default 'created' check (status in ('created', 'paid', 'refunded', 'disputed', 'failed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- 4. RLS Policies
-- Products: readable by everyone if active
create policy "Allow active products read"
    on public.products for select
    to anon, authenticated
    using (status = 'active');

-- Orders: users can only view their own orders
create policy "Users can select own orders"
    on public.orders for select
    to authenticated
    using ((select auth.uid()) = user_id);

-- 5. Indexes
create index if not exists orders_user_id_idx on public.orders using btree (user_id);
create index if not exists orders_status_idx on public.orders using btree (status);
create index if not exists orders_razorpay_order_id_idx on public.orders using btree (razorpay_order_id);
