-- Live Selling Fast Encoding schema (Supabase/Postgres)

create extension if not exists "pgcrypto";

create type live_session_status as enum ('active', 'ended');
create type invoice_status as enum ('UNPAID', 'PARTIAL', 'PAID');

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  product_code text not null,
  category text,
  size text,
  price numeric(12,2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  photo_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (supplier_id, product_code)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status live_session_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists session_orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (session_id, customer_id)
);

create table if not exists session_order_lines (
  id uuid primary key default gen_random_uuid(),
  session_order_id uuid not null references session_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  qty integer not null check (qty > 0),
  note text,
  price_snapshot numeric(12,2) not null,
  line_total numeric(12,2) generated always as (qty * price_snapshot) stored,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  status invoice_status not null default 'UNPAID',
  created_at timestamptz not null default now(),
  unique (session_id, customer_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_supplier_id on products(supplier_id);
create index if not exists idx_products_supplier_code on products(supplier_id, product_code);
create index if not exists idx_live_sessions_supplier_id on live_sessions(supplier_id);
create index if not exists idx_session_orders_session_id on session_orders(session_id);
create index if not exists idx_session_orders_customer_id on session_orders(customer_id);
create index if not exists idx_lines_session_order_id on session_order_lines(session_order_id);
create index if not exists idx_lines_product_id on session_order_lines(product_id);
create index if not exists idx_invoices_session_id on invoices(session_id);
create index if not exists idx_invoices_customer_id on invoices(customer_id);
create index if not exists idx_payments_invoice_id on payments(invoice_id);

create or replace function sync_invoice_status(p_invoice_id uuid)
returns void
language plpgsql
as $$
declare
  v_total numeric(12,2);
  v_paid numeric(12,2);
  v_status invoice_status;
begin
  select total_amount, paid_amount into v_total, v_paid
  from invoices
  where id = p_invoice_id;

  if not found then
    return;
  end if;

  v_paid := greatest(0, least(v_paid, v_total));

  v_status := case
    when v_paid = 0 then 'UNPAID'
    when v_paid >= v_total then 'PAID'
    else 'PARTIAL'
  end;

  update invoices
  set paid_amount = v_paid,
      status = v_status
  where id = p_invoice_id;
end;
$$;

create or replace function apply_payment_to_invoice()
returns trigger
language plpgsql
as $$
begin
  update invoices
  set paid_amount = paid_amount + new.amount
  where id = new.invoice_id;

  perform sync_invoice_status(new.invoice_id);
  return new;
end;
$$;

drop trigger if exists trg_apply_payment on payments;
create trigger trg_apply_payment
after insert on payments
for each row execute procedure apply_payment_to_invoice();

create or replace function add_miner_line(
  p_session_id uuid,
  p_customer_id uuid,
  p_product_id uuid,
  p_qty integer,
  p_note text default null
)
returns table(line_id uuid, remaining_stock integer)
language plpgsql
as $$
declare
  v_order_id uuid;
  v_stock integer;
  v_price numeric(12,2);
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select stock, price into v_stock, v_price
  from products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found';
  end if;

  if v_stock < p_qty then
    raise exception 'Insufficient stock';
  end if;

  insert into session_orders (session_id, customer_id)
  values (p_session_id, p_customer_id)
  on conflict (session_id, customer_id)
  do update set customer_id = excluded.customer_id
  returning id into v_order_id;

  insert into session_order_lines (session_order_id, product_id, qty, note, price_snapshot)
  values (v_order_id, p_product_id, p_qty, p_note, v_price)
  returning id into line_id;

  update products
  set stock = stock - p_qty,
      is_active = case when stock - p_qty > 0 then is_active else false end
  where id = p_product_id
  returning stock into remaining_stock;

  return next;
end;
$$;

create or replace function update_miner_line_qty(
  p_line_id uuid,
  p_new_qty integer
)
returns table(line_id uuid, remaining_stock integer)
language plpgsql
as $$
declare
  v_old_qty integer;
  v_product_id uuid;
  v_delta integer;
  v_stock integer;
begin
  if p_new_qty is null or p_new_qty <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select qty, product_id into v_old_qty, v_product_id
  from session_order_lines
  where id = p_line_id
  for update;

  if not found then
    raise exception 'Order line not found';
  end if;

  v_delta := p_new_qty - v_old_qty;

  select stock into v_stock
  from products
  where id = v_product_id
  for update;

  if v_delta > 0 and v_stock < v_delta then
    raise exception 'Insufficient stock';
  end if;

  update session_order_lines
  set qty = p_new_qty
  where id = p_line_id;

  update products
  set stock = stock - v_delta,
      is_active = case when stock - v_delta > 0 then is_active else false end
  where id = v_product_id
  returning stock into remaining_stock;

  line_id := p_line_id;
  return next;
end;
$$;

create or replace function delete_miner_line(p_line_id uuid)
returns void
language plpgsql
as $$
declare
  v_product_id uuid;
  v_qty integer;
begin
  select product_id, qty into v_product_id, v_qty
  from session_order_lines
  where id = p_line_id
  for update;

  if not found then
    raise exception 'Order line not found';
  end if;

  delete from session_order_lines where id = p_line_id;

  update products
  set stock = stock + v_qty
  where id = v_product_id;
end;
$$;

create or replace function generate_draft_invoices(p_session_id uuid)
returns setof invoices
language plpgsql
as $$
begin
  insert into invoices (session_id, customer_id, total_amount, paid_amount, status)
  select
    so.session_id,
    so.customer_id,
    coalesce(sum(sol.line_total), 0) as total_amount,
    0 as paid_amount,
    'UNPAID'::invoice_status as status
  from session_orders so
  join session_order_lines sol on sol.session_order_id = so.id
  where so.session_id = p_session_id
  group by so.session_id, so.customer_id
  on conflict (session_id, customer_id)
  do update set
    total_amount = excluded.total_amount,
    paid_amount = 0,
    status = 'UNPAID';

  return query
  select * from invoices where session_id = p_session_id order by created_at desc;
end;
$$;
