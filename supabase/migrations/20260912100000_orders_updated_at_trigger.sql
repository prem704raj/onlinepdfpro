-- Keep the order audit timestamp correct for webhook, callback, and refund
-- transitions. The Worker updates orders through the service role, but the
-- invariant belongs in the database so every writer gets the same behavior.
begin;

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_orders_updated_at();

commit;
