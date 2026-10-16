-- Campus delivery: Phase 1 schema (no payments). Run in Supabase SQL editor.
create type user_role as enum ('customer', 'agent', 'admin');
create type agent_status as enum ('pending', 'approved', 'suspended');
create type order_status as enum ('PENDING_ACCEPTANCE','AWAITING_PAYMENT','PAYMENT_VERIFIED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','EXPIRED','DISPUTED');

create table app_settings (key text primary key, value text not null);
insert into app_settings values ('payments_enabled', 'false');

create table users (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'customer',
  email text not null,
  full_name text not null default '',
  phone text, enrollment_id text unique, hostel text, room_number text,
  agent_status agent_status,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint agent_status_only_for_agents check (role = 'agent' or agent_status is null)
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label text not null, receiver_name text not null, primary_phone text not null, alternate_phone text,
  hostel text not null, room_number text not null, call_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(), deleted_at timestamptz
);
create index idx_addresses_user on addresses(user_id) where deleted_at is null;
create unique index uq_one_default_address on addresses(user_id) where is_default and deleted_at is null;

-- Public part of an order (agents can browse it). Private part lives in order_delivery_details.
create table orders (
  id uuid primary key default gen_random_uuid(),
  public_code text unique not null,
  customer_id uuid not null references users(id),
  agent_id uuid references users(id),
  item_name text not null, item_description text, item_image_url text not null,
  proposed_price numeric(10,2) not null check (proposed_price > 0),
  final_price numeric(10,2) check (final_price > 0),
  price_change_reason text,
  hostel text not null,
  status order_status not null default 'PENDING_ACCEPTANCE',
  claimed_at timestamptz, delivered_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint agent_required_after_claim check (status in ('PENDING_ACCEPTANCE','CANCELLED','EXPIRED') or agent_id is not null)
);
create index idx_orders_customer on orders(customer_id, status, created_at desc);
create index idx_orders_agent on orders(agent_id, status, created_at desc);
create index idx_orders_open_feed on orders(created_at desc) where status = 'PENDING_ACCEPTANCE';

create table order_delivery_details (
  order_id uuid primary key references orders(id) on delete cascade,
  receiver_name text not null, primary_phone text not null, alternate_phone text,
  room_number text not null, call_instructions text
);

create table order_status_history (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status, to_status order_status not null,
  actor_id uuid references users(id), actor_role text not null, note text,
  created_at timestamptz not null default now()
);
create index idx_osh_order on order_status_history(order_id, created_at);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  message text not null, created_at timestamptz not null default now()
);

-- Signup: role is NEVER read from client metadata.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Helpers used by RLS and RPCs
create function auth_role() returns user_role language sql stable security definer set search_path = public as
$$ select role from users where id = auth.uid() and is_active $$;
create function is_approved_agent() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from users where id = auth.uid() and is_active and role = 'agent' and agent_status = 'approved') $$;

-- RLS
alter table app_settings enable row level security;
alter table users enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_delivery_details enable row level security;
alter table order_status_history enable row level security;
alter table feedback enable row level security;

create policy settings_read on app_settings for select to authenticated using (true);
create policy users_self_read on users for select using (id = auth.uid());
create policy users_self_update on users for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on users from authenticated, anon;
grant update (full_name, phone, enrollment_id, hostel, room_number) on users to authenticated;
create policy addr_own on addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_customer_read on orders for select using (customer_id = auth.uid());
create policy orders_agent_read on orders for select using (is_approved_agent() and (status = 'PENDING_ACCEPTANCE' or agent_id = auth.uid()));
create policy details_read on order_delivery_details for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or o.agent_id = auth.uid())));
create policy history_read on order_status_history for select using (exists (select 1 from orders o where o.id = order_id));
create policy feedback_insert on feedback for insert to authenticated with check (user_id = auth.uid());
-- No insert/update/delete policies on orders: every write goes through the functions below.

create function create_order(p_name text, p_desc text, p_image text, p_price numeric, p_address_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare a addresses; oid uuid;
begin
  if auth_role() <> 'customer' then raise exception 'FORBIDDEN'; end if;
  select * into a from addresses where id = p_address_id and user_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'ADDRESS_NOT_FOUND'; end if;
  insert into orders (public_code, customer_id, item_name, item_description, item_image_url, proposed_price, hostel, expires_at)
  values ('ORD-' || upper(substr(md5(random()::text), 1, 5)), auth.uid(), p_name, p_desc, p_image, p_price, a.hostel, now() + interval '45 minutes')
  returning id into oid;
  insert into order_delivery_details values (oid, a.receiver_name, a.primary_phone, a.alternate_phone, a.room_number, a.call_instructions);
  insert into order_status_history (order_id, to_status, actor_id, actor_role) values (oid, 'PENDING_ACCEPTANCE', auth.uid(), 'customer');
  return oid;
end $$;

create function cancel_order(p_order uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update orders set status = 'CANCELLED' where id = p_order and customer_id = auth.uid() and status = 'PENDING_ACCEPTANCE';
  if not found then raise exception 'ORDER_LOCKED'; end if;
  insert into order_status_history (order_id, from_status, to_status, actor_id, actor_role) values (p_order, 'PENDING_ACCEPTANCE', 'CANCELLED', auth.uid(), 'customer');
end $$;

-- Atomic claim: the WHERE clause is the race guard, exactly one agent wins.
create function claim_order(p_order uuid, p_final numeric default null, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o orders; pay boolean; to_s order_status; fp numeric;
begin
  if not is_approved_agent() then raise exception 'FORBIDDEN'; end if;
  select * into o from orders where id = p_order;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  fp := coalesce(p_final, o.proposed_price);
  if fp <> o.proposed_price then
    if coalesce(trim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    if fp < o.proposed_price * 0.7 or fp > o.proposed_price * 1.3 then raise exception 'PRICE_OUT_OF_BOUNDS'; end if;
  end if;
  select value = 'true' into pay from app_settings where key = 'payments_enabled';
  to_s := case when pay then 'AWAITING_PAYMENT' else 'PAYMENT_VERIFIED' end;  -- payments off: skip straight to accepted
  update orders set agent_id = auth.uid(), status = to_s, final_price = fp, price_change_reason = nullif(trim(p_reason), ''), claimed_at = now()
   where id = p_order and status = 'PENDING_ACCEPTANCE' and expires_at > now();
  if not found then raise exception 'ORDER_ALREADY_CLAIMED'; end if;
  insert into order_status_history (order_id, from_status, to_status, actor_id, actor_role, note)
  values (p_order, 'PENDING_ACCEPTANCE', to_s, auth.uid(), 'agent', p_reason);
end $$;

create function advance_order(p_order uuid, p_to order_status) returns void language plpgsql security definer set search_path = public as $$
declare from_s order_status;
begin
  from_s := case p_to when 'OUT_FOR_DELIVERY' then 'PAYMENT_VERIFIED' when 'DELIVERED' then 'OUT_FOR_DELIVERY' end;
  if from_s is null then raise exception 'INVALID_TRANSITION'; end if;
  update orders set status = p_to, delivered_at = case when p_to = 'DELIVERED' then now() end
   where id = p_order and agent_id = auth.uid() and status = from_s and is_approved_agent();
  if not found then raise exception 'INVALID_TRANSITION'; end if;
  insert into order_status_history (order_id, from_status, to_status, actor_id, actor_role) values (p_order, from_s, p_to, auth.uid(), 'agent');
end $$;

revoke all on function create_order, cancel_order, claim_order, advance_order from public, anon;
grant execute on function create_order, cancel_order, claim_order, advance_order to authenticated;

-- Realtime + image bucket (public bucket, unguessable paths; move to signed URLs before launch)
alter publication supabase_realtime add table orders;
insert into storage.buckets (id, name, public) values ('order-images', 'order-images', true) on conflict do nothing;
create policy order_images_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'order-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Approve an agent (v1 has no admin UI):
--   update users set role = 'agent', agent_status = 'approved' where email = 'agent@example.com';
