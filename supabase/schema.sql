-- ==============================================================================
-- SuperCart Supabase Database Schema
-- Production-grade 10-Minute Grocery Delivery Backend
-- ==============================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- 2. Profiles (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  phone text,
  name text,
  wallet_balance numeric(10, 2) not null default 100.00 check (wallet_balance >= 0),
  referral_code text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Admins table for Role-Based Access Control
create table if not exists public.admins (
  id uuid default gen_random_uuid() primary key,
  admin_id text unique not null, -- e.g. ADM-1001
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'editor')),
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. User Addresses
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null default 'Home' check (label in ('Home', 'Work', 'Other')),
  receiver_name text not null,
  receiver_phone text not null,
  house_no text not null,
  street text not null,
  landmark text,
  area text not null,
  city text not null default 'Pune',
  pincode text not null,
  lat double precision not null,
  lng double precision not null,
  is_default boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Categories
create table if not exists public.categories (
  id text primary key, -- slug like 'fruits-vegetables', 'dairy-bread-eggs'
  name text not null,
  name_hi text,
  icon_name text,
  color text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Subcategories
create table if not exists public.subcategories (
  id uuid default gen_random_uuid() primary key,
  category_id text references public.categories(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Products Catalog
create table if not exists public.products (
  id text primary key, -- e.g. 'fv-001', 'dbe-001'
  name text not null,
  name_hi text,
  brand text not null,
  category_id text references public.categories(id) on delete restrict not null,
  subcategory text not null,
  price numeric(10, 2) not null check (price >= 0),
  mrp numeric(10, 2) not null check (mrp >= price),
  weight text not null,
  discount_pct int not null default 0 check (discount_pct between 0 and 100),
  image_url text not null,
  stock int not null default 0 check (stock >= 0),
  rating numeric(3, 2) default 4.80 check (rating between 1.00 and 5.00),
  reviews_count int default 0,
  eta_minutes int default 10,
  is_active boolean default true,
  description text,
  nutrition jsonb default '{}'::jsonb,
  shelf_life text default 'Fresh',
  tags text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Additional Product Images (Gallery)
create table if not exists public.product_images (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products(id) on delete cascade not null,
  image_url text not null,
  is_primary boolean default false,
  sort_order int default 0
);

-- 9. Cart Items (Persistent for logged in users)
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 10. Delivery Partners (EV Fleet)
create table if not exists public.delivery_partners (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  rating numeric(3, 2) default 4.90,
  vehicle_no text not null,
  avatar_url text,
  current_lat double precision not null,
  current_lng double precision not null,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Orders
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  delivery_address jsonb not null,
  delivery_slot text not null default 'instant' check (delivery_slot in ('instant', 'scheduled')),
  scheduled_time text,
  delivery_otp text not null,
  payment_method text not null check (payment_method in ('upi', 'card', 'netbanking', 'wallet', 'cod')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  item_total numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null default 0,
  handling_fee numeric(10, 2) not null default 5.00,
  discount numeric(10, 2) not null default 0,
  delivery_tip numeric(10, 2) not null default 0,
  gst numeric(10, 2) not null default 0,
  grand_total numeric(10, 2) not null check (grand_total >= 0),
  delivery_instructions text[],
  substitution_preference text not null default 'replace' check (substitution_preference in ('replace', 'refund')),
  status text not null default 'placed' check (status in ('placed', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')),
  delivery_partner_id uuid references public.delivery_partners(id) on delete set null,
  store_location jsonb not null default '{"name": "Baner Dark Store #14", "lat": 18.562, "lng": 73.782, "address": "Baner High Street, Pune"}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Order Items
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id text references public.products(id) on delete set null,
  name text not null,
  weight text not null,
  price numeric(10, 2) not null,
  mrp numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  image_url text,
  status text not null default 'packed' check (status in ('packed', 'substituted', 'unavailable')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Order Tracking Events (Live Realtime timeline & coordinates)
create table if not exists public.order_tracking_events (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null,
  label text not null,
  details text,
  current_lat double precision,
  current_lng double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. Payments (Razorpay Transaction logs)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'authorized', 'captured', 'failed', 'refunded')),
  method text,
  error_code text,
  error_description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. Coupons
create table if not exists public.coupons (
  code text primary key,
  title text not null,
  description text,
  discount_pct int default 0 check (discount_pct between 0 and 100),
  max_discount numeric(10, 2) not null,
  min_order numeric(10, 2) not null default 0,
  expiry timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. Wallet Transactions
create table if not exists public.wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  type text not null check (type in ('credit', 'debit')),
  description text not null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. Wishlist
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 18. Reviews & Ratings
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  photos text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 19. In-App Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'order' check (type in ('order', 'promo', 'wallet')),
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 20. Banners (Carousel)
create table if not exists public.banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  image_url text not null,
  cta_text text default 'Shop Now',
  category_id text references public.categories(id) on delete set null,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 21. Audit Logs
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  entity text not null, -- e.g. 'products', 'orders', 'prices'
  entity_id text not null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null, -- 'price_update', 'stock_adjustment', 'status_change'
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXES & TRIGRAM SEARCH
-- ==============================================================================

-- Trigram indexes for typo-tolerant product search
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists idx_products_brand_trgm on public.products using gin (brand gin_trgm_ops);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_subcategory on public.products(subcategory);
create index if not exists idx_products_price on public.products(price);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_tracking_events_order on public.order_tracking_events(order_id);
create index if not exists idx_cart_items_user on public.cart_items(user_id);

-- ==============================================================================
-- FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 1. Automatic Profile Creation on Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_code text;
begin
  ref_code := 'SC' || upper(substring(md5(random()::text) from 1 for 6));
  insert into public.profiles (id, email, phone, name, wallet_balance, referral_code)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Valued Shopper'),
    100.00,
    ref_code
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Updated_at Auto-Updater Trigger Function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger set_addresses_updated_at before update on public.addresses for each row execute function public.handle_updated_at();
create trigger set_products_updated_at before update on public.products for each row execute function public.handle_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute function public.handle_updated_at();
create trigger set_cart_items_updated_at before update on public.cart_items for each row execute function public.handle_updated_at();
create trigger set_payments_updated_at before update on public.payments for each row execute function public.handle_updated_at();
create trigger set_admins_updated_at before update on public.admins for each row execute function public.handle_updated_at();

-- 3. Stock Decrement on Order Creation
create or replace function public.decrement_product_stock_on_order()
returns trigger
language plpgsql
as $$
begin
  update public.products
  set stock = greatest(0, stock - new.quantity)
  where id = new.product_id;
  return new;
end;
$$;

drop trigger if exists trigger_decrement_stock on public.order_items;
create trigger trigger_decrement_stock
  after insert on public.order_items
  for each row execute function public.decrement_product_stock_on_order();

-- 4. Audit Log Trigger on Product Price / Stock Changes
create or replace function public.log_product_price_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (old.price is distinct from new.price) or (old.stock is distinct from new.stock) then
    insert into public.audit_logs (
      entity,
      entity_id,
      actor_id,
      action,
      old_values,
      new_values
    )
    values (
      'products',
      new.id,
      auth.uid(),
      case
        when old.price is distinct from new.price then 'price_update'
        else 'stock_adjustment'
      end,
      jsonb_build_object('price', old.price, 'mrp', old.mrp, 'stock', old.stock),
      jsonb_build_object('price', new.price, 'mrp', new.mrp, 'stock', new.stock)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_audit_product_changes on public.products;
create trigger trigger_audit_product_changes
  after update on public.products
  for each row execute function public.log_product_price_change();

-- ==============================================================================
-- ENABLE SUPABASE REALTIME
-- ==============================================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_tracking_events;
alter publication supabase_realtime add table public.notifications;
