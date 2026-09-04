-- Keep browser roles limited to the operations exposed by the product UI.
-- The Worker uses service_role for order creation/fulfilment and is not
-- affected by these grants; RLS still limits authenticated reads to own rows.
begin;

revoke all on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;

commit;
