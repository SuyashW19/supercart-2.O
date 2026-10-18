-- 02_rls.sql
-- SuperCart Row Level Security (RLS) Policies
-- Idempotent and safe to re-run

-- 1. Helper Security Definer function to verify Admin privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENABLE RLS ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "Public can view basic profiles" ON profiles;
CREATE POLICY "Public can view basic profiles" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. CATEGORIES, SUBCATEGORIES, BANNERS, COUPONS, PRODUCT_IMAGES (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write categories" ON categories;
CREATE POLICY "Admin write categories" ON categories
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read subcategories" ON subcategories;
CREATE POLICY "Public read subcategories" ON subcategories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write subcategories" ON subcategories;
CREATE POLICY "Admin write subcategories" ON subcategories
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read banners" ON banners;
CREATE POLICY "Public read banners" ON banners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write banners" ON banners;
CREATE POLICY "Admin write banners" ON banners
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read coupons" ON coupons;
CREATE POLICY "Public read coupons" ON coupons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write coupons" ON coupons;
CREATE POLICY "Admin write coupons" ON coupons
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read product_images" ON product_images;
CREATE POLICY "Public read product_images" ON product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write product_images" ON product_images;
CREATE POLICY "Admin write product_images" ON product_images
  FOR ALL USING (public.is_admin());

-- 5. PRODUCTS (Public Read, Admin Full Write)
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert products" ON products;
CREATE POLICY "Admin insert products" ON products
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin update products" ON products;
CREATE POLICY "Admin update products" ON products
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admin delete products" ON products;
CREATE POLICY "Admin delete products" ON products
  FOR DELETE USING (public.is_admin());

-- 6. CART_ITEMS (User specific or Admin)
DROP POLICY IF EXISTS "Users manage own cart" ON cart_items;
CREATE POLICY "Users manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 7. ADDRESSES (User specific or Admin)
DROP POLICY IF EXISTS "Users manage own addresses" ON addresses;
CREATE POLICY "Users manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 8. ORDERS & ORDER_ITEMS (User read own orders, Admin all, Anyone can insert new orders)
DROP POLICY IF EXISTS "Users view own orders" ON orders;
CREATE POLICY "Users view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users and guests can insert orders" ON orders;
CREATE POLICY "Users and guests can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update orders" ON orders;
CREATE POLICY "Admin can update orders" ON orders
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Users view own order items" ON order_items;
CREATE POLICY "Users view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin() OR orders.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- 9. ORDER_TRACKING_EVENTS
DROP POLICY IF EXISTS "Public can view tracking for order" ON order_tracking_events;
CREATE POLICY "Public can view tracking for order" ON order_tracking_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin or system can insert tracking" ON order_tracking_events;
CREATE POLICY "Admin or system can insert tracking" ON order_tracking_events
  FOR ALL USING (true);

-- 10. WISHLIST
DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlist;
CREATE POLICY "Users manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 11. REVIEWS
DROP POLICY IF EXISTS "Public view reviews" ON reviews;
CREATE POLICY "Public view reviews" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users create reviews" ON reviews;
CREATE POLICY "Authenticated users create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users or admins delete reviews" ON reviews;
CREATE POLICY "Users or admins delete reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 12. NOTIFICATIONS
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- 13. WALLET_TRANSACTIONS & PAYMENTS
DROP POLICY IF EXISTS "Users view own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users view own wallet transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users view own payments" ON payments;
CREATE POLICY "Users view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 14. AUDIT_LOGS (Admin only)
DROP POLICY IF EXISTS "Admin view audit logs" ON audit_logs;
CREATE POLICY "Admin view audit logs" ON audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 15. ADMINS TABLE
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
CREATE POLICY "Admins can view admins" ON admins
  FOR SELECT USING (public.is_admin());

-- 16. STORAGE BUCKET FOR PRODUCT IMAGES (Optional but recommended)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access product images" ON storage.objects;
CREATE POLICY "Public access product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- 17. SERVICEABLE_PINCODES POLICIES
ALTER TABLE serviceable_pincodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read serviceable_pincodes" ON serviceable_pincodes;
CREATE POLICY "Public read serviceable_pincodes" ON serviceable_pincodes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write serviceable_pincodes" ON serviceable_pincodes;
CREATE POLICY "Admin write serviceable_pincodes" ON serviceable_pincodes
  FOR ALL USING (public.is_admin());

-- 18. BLOCKED_PINCODES POLICIES
ALTER TABLE blocked_pincodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read blocked_pincodes" ON blocked_pincodes;
CREATE POLICY "Public read blocked_pincodes" ON blocked_pincodes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write blocked_pincodes" ON blocked_pincodes;
CREATE POLICY "Admin write blocked_pincodes" ON blocked_pincodes
  FOR ALL USING (public.is_admin());

