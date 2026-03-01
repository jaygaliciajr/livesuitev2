-- Sample seed data for local testing

insert into suppliers (name, notes)
values
  ('Korean Finds', 'Fast moving apparel'),
  ('Urban Deals', 'Mix of accessories and basics')
on conflict do nothing;

insert into customers (full_name, phone)
values
  ('Anna Marie Santos', '09171234567'),
  ('Jessa Lim', '09179876543'),
  ('Mark Villanueva', null)
on conflict do nothing;

with s as (
  select id, name from suppliers
)
insert into products (supplier_id, product_code, category, size, price, stock, is_active)
select
  s.id,
  case when s.name = 'Korean Finds' then 'KF-001' else 'UD-001' end,
  'Top',
  'M',
  case when s.name = 'Korean Finds' then 199 else 149 end,
  8,
  false
from s
on conflict (supplier_id, product_code) do nothing;

with s as (
  select id from suppliers where name = 'Korean Finds' limit 1
),
live as (
  insert into live_sessions (supplier_id, status, started_at)
  select id, 'active', now() - interval '1 hour' from s
  returning id
),
c as (
  select id, full_name from customers where full_name in ('Anna Marie Santos', 'Jessa Lim')
),
o as (
  insert into session_orders (session_id, customer_id)
  select live.id, c.id from live cross join c
  on conflict (session_id, customer_id) do nothing
  returning id, customer_id
),
p as (
  select id, price from products where product_code = 'KF-001' limit 1
)
insert into session_order_lines (session_order_id, product_id, qty, price_snapshot)
select o.id, p.id, 1, p.price
from o cross join p
on conflict do nothing;
