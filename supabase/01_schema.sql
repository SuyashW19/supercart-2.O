-- 01_schema.sql
-- SuperCart PostgreSQL Database Schema
-- Idempotent and safe to re-run

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  full_name text,
  email text,
  avatar_url text,
  wallet_balance numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ADMINS TABLE (For RBAC & Admin Portal Access)
CREATE TABLE IF NOT EXISTS admins (
  admin_id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'editor')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  label text DEFAULT 'Home' CHECK (label IN ('Home', 'Work', 'Other')),
  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  house_no text NOT NULL,
  street text NOT NULL,
  landmark text,
  area text NOT NULL,
  city text NOT NULL,
  state text DEFAULT 'Maharashtra',
  pincode text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure backwards compatibility if table was already created
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS state text DEFAULT 'Maharashtra';

-- 4. CATEGORIES TABLE (Text ID matching frontend, e.g. 'fruits-veg', 'dairy-bread')
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_hi text,
  slug text NOT NULL,
  icon text DEFAULT 'ShoppingBag',
  icon_name text DEFAULT 'ShoppingBag',
  image_url text,
  color text DEFAULT '#10B981',
  sort_order integer DEFAULT 0,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_name text DEFAULT 'ShoppingBag';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color text DEFAULT '#10B981';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 5. SUBCATEGORIES TABLE
CREATE TABLE IF NOT EXISTS subcategories (
  id text PRIMARY KEY,
  category_id text REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer DEFAULT 0,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 6. PRODUCTS TABLE (Text ID matching frontend 'p001'...'p152' or 'fv-001')
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_hi text,
  brand text NOT NULL,
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id text REFERENCES subcategories(id) ON DELETE SET NULL,
  subcategory text,
  weight text NOT NULL,
  price numeric(10,2) NOT NULL,
  mrp numeric(10,2) NOT NULL,
  discount_pct integer DEFAULT 0,
  discount_percentage integer DEFAULT 0,
  image_url text NOT NULL,
  description text DEFAULT '',
  badge text,
  in_stock boolean DEFAULT true,
  stock integer DEFAULT 50,
  rating numeric(3,2) DEFAULT 4.8,
  rating_count integer DEFAULT 120,
  reviews_count integer DEFAULT 120,
  eta_minutes integer DEFAULT 10,
  is_active boolean DEFAULT true,
  nutrition jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  is_organic boolean DEFAULT false,
  shelf_life text DEFAULT '3-5 days',
  storage_instructions text DEFAULT 'Store in a cool dry place',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Backward-compatibility & idempotency for existing installations:
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_pct integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 120;
ALTER TABLE products ADD COLUMN IF NOT EXISTS eta_minutes integer DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS nutrition jsonb DEFAULT '{}'::jsonb;


-- 7. PRODUCT_IMAGES TABLE (Extra gallery views)
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 8. CART_ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 9. DELIVERY_PARTNERS TABLE
CREATE TABLE IF NOT EXISTS delivery_partners (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  vehicle_no text,
  rating numeric(3,2) DEFAULT 4.9,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 10. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled')),
  total numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  delivery_fee numeric(10,2) DEFAULT 0,
  tip numeric(10,2) DEFAULT 0,
  coupon_code text,
  payment_method text NOT NULL DEFAULT 'online' CHECK (payment_method IN ('upi', 'card', 'wallet', 'cod', 'online')),
  payment_status text NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  address jsonb NOT NULL,
  eta_minutes integer DEFAULT 10,
  delivery_partner jsonb,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text REFERENCES orders(id) ON DELETE CASCADE,
  product_id text REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,
  weight text NOT NULL,
  price numeric(10,2) NOT NULL,
  mrp numeric(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 12. ORDER_TRACKING_EVENTS TABLE
CREATE TABLE IF NOT EXISTS order_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  title text NOT NULL,
  description text,
  partner_lat double precision,
  partner_lng double precision,
  created_at timestamptz DEFAULT now()
);

-- 13. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  transaction_ref text,
  created_at timestamptz DEFAULT now()
);

-- 14. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  code text PRIMARY KEY,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value numeric(10,2) NOT NULL,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_discount_amount numeric(10,2),
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz DEFAULT (now() + interval '1 year'),
  created_at timestamptz DEFAULT now()
);

-- 15. WALLET_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  description text NOT NULL,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

-- 16. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 17. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- 18. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'order' CHECK (type IN ('order', 'promo', 'delivery', 'system')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 19. BANNERS TABLE
CREATE TABLE IF NOT EXISTS banners (
  id text PRIMARY KEY,
  title text NOT NULL,
  subtitle text NOT NULL,
  image_url text NOT NULL,
  bg_color text NOT NULL,
  cta_text text DEFAULT 'Shop Now',
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  link_category_id text,
  badge_text text,
  sort_order integer DEFAULT 0,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ADD COLUMN IF NOT EXISTS cta_text text DEFAULT 'Shop Now';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS category_id text;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 20. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_user ON admins(user_id);

-- Trigram Search Index for fast ILIKE product name & brand searching
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);

-- ==============================================================================
-- TRIGGERS & FUNCTIONS
-- ==============================================================================

-- 1. Automatic Profile Creation on auth.users Signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Valued Customer'),
    new.email,
    new.phone,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Generic updated_at Timestamp updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_modtime ON products;
CREATE TRIGGER update_products_modtime
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_modtime ON cart_items;
CREATE TRIGGER update_cart_items_modtime
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_modtime ON orders;
CREATE TRIGGER update_orders_modtime
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_modtime ON addresses;
CREATE TRIGGER update_addresses_modtime
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Stock Decrement Trigger on Order Item Insertion
CREATE OR REPLACE FUNCTION decrement_product_stock_on_order()
RETURNS trigger AS $$
BEGIN
  UPDATE products
  SET 
    stock = GREATEST(0, stock - new.quantity),
    in_stock = CASE WHEN (stock - new.quantity) > 0 THEN true ELSE false END
  WHERE id = new.product_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_item_stock_decrement ON order_items;
CREATE TRIGGER on_order_item_stock_decrement
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION decrement_product_stock_on_order();

-- 4. Price Change Audit Trigger on products Table
CREATE OR REPLACE FUNCTION audit_product_price_change()
RETURNS trigger AS $$
BEGIN
  IF (old.price <> new.price OR old.mrp <> new.mrp) THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (
      'products',
      new.id,
      'PRICE_UPDATE',
      jsonb_build_object('price', old.price, 'mrp', old.mrp),
      jsonb_build_object('price', new.price, 'mrp', new.mrp),
      auth.uid()
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_price_audit ON products;
CREATE TRIGGER on_product_price_audit
  AFTER UPDATE OF price, mrp ON products
  FOR EACH ROW EXECUTE FUNCTION audit_product_price_change();

-- 21. SERVICEABLE PINCODES TABLE (Custom ETA Overrides & Express Hubs)
CREATE TABLE IF NOT EXISTS serviceable_pincodes (
  pincode text PRIMARY KEY,
  city text,
  state text,
  is_active boolean DEFAULT true,
  eta_minutes int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 22. BLOCKED PINCODES TABLE (Outage Suspensions)
CREATE TABLE IF NOT EXISTS blocked_pincodes (
  pincode text PRIMARY KEY,
  reason text,
  blocked_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS update_serviceable_pincodes_modtime ON serviceable_pincodes;
CREATE TRIGGER update_serviceable_pincodes_modtime
  BEFORE UPDATE ON serviceable_pincodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

