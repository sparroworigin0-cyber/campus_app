-- Sparrow: delivery tracker + delivery charge. Safe to run once on top of schema.sql.
alter table orders
  add column if not exists track_step smallint not null default 0 check (track_step between 0 and 7),
  add column if not exists delivery_fee_original numeric(10,2) not null default 30 check (delivery_fee_original >= 0),
  add column if not exists delivery_fee numeric(10,2) not null default 30 check (delivery_fee >= 0);
insert into app_settings values ('default_delivery_fee', '30') on conflict do nothing;

-- New orders copy the default charge (change it with: update app_settings set value='25' where key='default_delivery_fee';)
create or replace function create_order(p_name text, p_desc text, p_image text, p_price numeric, p_address_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare a addresses; oid uuid; fee numeric;
begin
  if auth_role() <> 'customer' then raise exception 'FORBIDDEN'; end if;
  select * into a from addresses where id = p_address_id and user_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'ADDRESS_NOT_FOUND'; end if;
  select coalesce((select value::numeric from app_settings where key = 'default_delivery_fee'), 30) into fee;
  insert into orders (public_code, customer_id, item_name, item_description, item_image_url, proposed_price, hostel, expires_at, delivery_fee, delivery_fee_original)
  values ('ORD-' || upper(substr(md5(random()::text), 1, 5)), auth.uid(), p_name, p_desc, p_image, p_price, a.hostel, now() + interval '45 minutes', fee, fee)
  returning id into oid;
  insert into order_delivery_details values (oid, a.receiver_name, a.primary_phone, a.alternate_phone, a.room_number, a.call_instructions);
  insert into order_status_history (order_id, to_status, actor_id, actor_role) values (oid, 'PENDING_ACCEPTANCE', auth.uid(), 'customer');
  return oid;
end $$;

-- Assigned agent moves the tracker. Step 1+ flips status to OUT_FOR_DELIVERY; going back to 0 reverts it.
create function set_track_step(p_order uuid, p_step int) returns void language plpgsql security definer set search_path = public as $$
declare o orders; new_s order_status;
begin
  if p_step < 0 or p_step > 7 then raise exception 'INVALID_STEP'; end if;
  select * into o from orders
   where id = p_order and agent_id = auth.uid() and is_approved_agent() and status in ('PAYMENT_VERIFIED','OUT_FOR_DELIVERY') for update;
  if not found then raise exception 'FORBIDDEN'; end if;
  new_s := (case when p_step >= 1 then 'OUT_FOR_DELIVERY' else 'PAYMENT_VERIFIED' end)::order_status;
  update orders set track_step = p_step, status = new_s where id = p_order;
  if new_s <> o.status then
    insert into order_status_history (order_id, from_status, to_status, actor_id, actor_role) values (p_order, o.status, new_s, auth.uid(), 'agent');
  end if;
end $$;

-- Offers only: the charge can go down to 0, never above the original. Raising it would need customer consent.
create function set_delivery_fee(p_order uuid, p_fee numeric) returns void language plpgsql security definer set search_path = public as $$
begin
  update orders set delivery_fee = p_fee
   where id = p_order and agent_id = auth.uid() and is_approved_agent()
     and status in ('AWAITING_PAYMENT','PAYMENT_VERIFIED','OUT_FOR_DELIVERY')
     and p_fee >= 0 and p_fee <= delivery_fee_original;
  if not found then raise exception 'FEE_NOT_ALLOWED'; end if;
end $$;

revoke all on function set_track_step, set_delivery_fee from public, anon;
grant execute on function set_track_step, set_delivery_fee to authenticated;
