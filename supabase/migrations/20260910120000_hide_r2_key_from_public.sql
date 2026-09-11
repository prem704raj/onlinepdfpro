-- P2-3: Hide r2_key from anonymous and authenticated catalogue queries
-- Restrict column-level SELECT privileges so storage object keys remain server-side only.
-- The Cloudflare Worker uses service_role key which retains full access.
begin;

revoke select on table public.products from anon, authenticated;
grant select (id, title, description, price_inr, preview_url, status, created_at) on table public.products to anon, authenticated;

commit;
