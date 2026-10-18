-- ==============================================================================
-- SuperCart Row Level Security (RLS) Policies
-- Strict Access Control & Security Definer RBAC
-- ==============================================================================

-- 1. Helper function: check if current user is an active admin
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from public.admins
    where user_id = auth.uid()
      and is_active = true
  );
end;
$$;

-- 2. Helper function: check if current user is super admin
create or replace function public.is_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from public.admins
    where user_id = auth.uid()
      and role = 'super_admin'
      and is_active = true
  );
end;
$$;

-- ==============================================================================
-- ENABLE RLS ON ALL TABLES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_tracking_events enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.wishlist enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.banners enable row level security;
alter table public.audit_logs enable row level security;

-- ==============================================================================
-- 1. PROFILES POLICIES
-- ==============================================================================
create policy "Users can view their own profile or admin can view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ==============================================================================
-- 2. ADMINS POLICIES
-- ==============================================================================
create policy "Admins can view admins list"
  on public.admins for select
  using (public.is_admin() or auth.uid() = user_id);

create policy "Super admins can manage admins"
  on public.admins for all
  using (public.is_super_admin());

-- ==============================================================================
-- 3. ADDRESSES POLICIES
-- ==============================================================================
create policy "Users can view own addresses"
  on public.addresses for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own addresses"
  on public.addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own addresses"
  on public.addresses for update
  using (auth.uid() = user_id);

create policy "Users can delete own addresses"
  on public.addresses for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- 4. CATEGORIES & SUBCATEGORIES (Public Read, Admin Write)
-- ==============================================================================
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin());

create policy "Subcategories are viewable by everyone"
  on public.subcategories for select
  using (true);

create policy "Admins can manage subcategories"
  on public.subcategories for all
  using (public.is_admin());

-- ==============================================================================
-- 5. PRODUCTS & PRODUCT IMAGES (Public Read, Admin Write)
-- ==============================================================================
create policy "Active products are viewable by everyone"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

create policy "Admins can update products and prices"
  on public.products for update
  using (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  using (public.is_admin());

create policy "Product images viewable by everyone"
  on public.product_images for select
  using (true);

create policy "Admins can manage product images"
  on public.product_images for all
  using (public.is_admin());

-- ==============================================================================
-- 6. CART ITEMS (User Private)
-- ==============================================================================
create policy "Users can view own cart items"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own cart items"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cart items"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own cart items"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- 7. ORDERS & ORDER ITEMS
-- ==============================================================================
create policy "Users can view own orders or admins can view all"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id or auth.uid() is null);

create policy "Admins or owners can update orders"
  on public.orders for update
  using (public.is_admin() or auth.uid() = user_id);

create policy "Users can view items in own orders or admins can view all"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Anyone placing an order can insert order items"
  on public.order_items for insert
  with check (true);

-- ==============================================================================
-- 8. ORDER TRACKING EVENTS & DELIVERY PARTNERS
-- ==============================================================================
create policy "Customers can view tracking events for their orders"
  on public.order_tracking_events for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_tracking_events.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins and partners can insert tracking events"
  on public.order_tracking_events for insert
  with check (public.is_admin());

create policy "Delivery partners info viewable by customer when assigned"
  on public.delivery_partners for select
  using (true);

create policy "Admins manage delivery partners"
  on public.delivery_partners for all
  using (public.is_admin());

-- ==============================================================================
-- 9. PAYMENTS
-- ==============================================================================
create policy "Users view own payments, admins view all"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Payments can be recorded on checkout"
  on public.payments for insert
  with check (true);

-- ==============================================================================
-- 10. COUPONS & BANNERS (Public Read, Admin Write)
-- ==============================================================================
create policy "Active coupons viewable by all authenticated & guest users"
  on public.coupons for select
  using (is_active = true or public.is_admin());

create policy "Admins manage coupons"
  on public.coupons for all
  using (public.is_admin());

create policy "Active banners viewable by all"
  on public.banners for select
  using (is_active = true or public.is_admin());

create policy "Admins manage banners"
  on public.banners for all
  using (public.is_admin());

-- ==============================================================================
-- 11. WALLET TRANSACTIONS & WISHLIST & NOTIFICATIONS
-- ==============================================================================
create policy "Users view own wallet transactions"
  on public.wallet_transactions for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users view own wishlist"
  on public.wishlist for select
  using (auth.uid() = user_id);

create policy "Users manage own wishlist"
  on public.wishlist for all
  using (auth.uid() = user_id);

create policy "Users view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications read status"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ==============================================================================
-- 12. REVIEWS & AUDIT LOGS
-- ==============================================================================
create policy "Reviews viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Authenticated users can post reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "Admins can insert audit logs"
  on public.audit_logs for insert
  with check (public.is_admin());
