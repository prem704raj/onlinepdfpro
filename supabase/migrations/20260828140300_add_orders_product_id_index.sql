-- Cover the orders -> products foreign key for updates/deletes and joins.
create index if not exists orders_product_id_idx
    on public.orders using btree (product_id);
