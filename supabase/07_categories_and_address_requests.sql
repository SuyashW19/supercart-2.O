-- ==============================================================================
-- SuperCart Categories & Address Requests Migration
-- ==============================================================================

-- 1. Add columns to categories table if they don't already exist
ALTER TABLE IF EXISTS public.categories
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update initial sections and sort orders for standard categories
UPDATE public.categories SET section = 'Grocery & Kitchen', sort_order = 1 WHERE id = 'fruits-vegetables';
UPDATE public.categories SET section = 'Grocery & Kitchen', sort_order = 2 WHERE id = 'dairy-bread-eggs';
UPDATE public.categories SET section = 'Grocery & Kitchen', sort_order = 3 WHERE id = 'atta-rice-dal';
UPDATE public.categories SET section = 'Grocery & Kitchen', sort_order = 4 WHERE id = 'masala-oil-dry-fruits';
UPDATE public.categories SET section = 'Grocery & Kitchen', sort_order = 5 WHERE id = 'tea-coffee-beverages';
UPDATE public.categories SET section = 'Grocery & Kitchen', sort_order = 6 WHERE id = 'instant-frozen-food';

UPDATE public.categories SET section = 'Snacks & Drinks', sort_order = 7 WHERE id = 'snacks-munchies';
UPDATE public.categories SET section = 'Snacks & Drinks', sort_order = 8 WHERE id = 'sweets-chocolates';
UPDATE public.categories SET section = 'Snacks & Drinks', sort_order = 9 WHERE id = 'cold-drinks-juices';

UPDATE public.categories SET section = 'Household & Lifestyle', sort_order = 10 WHERE id = 'cleaning-household';
UPDATE public.categories SET section = 'Household & Lifestyle', sort_order = 11 WHERE id = 'pet-care';

UPDATE public.categories SET section = 'Beauty & Personal Care', sort_order = 12 WHERE id = 'personal-care';
UPDATE public.categories SET section = 'Beauty & Personal Care', sort_order = 13 WHERE id = 'baby-care';

-- 2. Create address_requests table
CREATE TABLE IF NOT EXISTS public.address_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_name TEXT,
  receiver_phone TEXT,
  pincode TEXT NOT NULL,
  city TEXT,
  area TEXT,
  landmark TEXT,
  full_address TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'serviced', 'rejected'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on address_requests
ALTER TABLE public.address_requests ENABLE ROW LEVEL SECURITY;

-- Policies for address_requests:
-- Public & users can submit address / pincode requests
CREATE POLICY "Public and users can insert address requests"
  ON public.address_requests
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own address requests; Admins can view all
CREATE POLICY "Users view own or admins view all address requests"
  ON public.address_requests
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('admin', 'super_admin')
    ) OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Admins can update address requests (e.g. change status to reviewed/serviced)
CREATE POLICY "Admins can update address requests"
  ON public.address_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('admin', 'super_admin')
    ) OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 3. Storage bucket setup for category-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for category-images
-- Public read access: Anyone can read category tile images
CREATE POLICY "Public read category images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'category-images');

-- Admin-only upload/write: Only admins can upload/modify category images
CREATE POLICY "Admin upload category images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'category-images' AND
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('admin', 'super_admin')
      ) OR
      auth.jwt() ->> 'role' = 'service_role'
    )
  );

CREATE POLICY "Admin update category images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'category-images' AND
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('admin', 'super_admin')
      ) OR
      auth.jwt() ->> 'role' = 'service_role'
    )
  );

CREATE POLICY "Admin delete category images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'category-images' AND
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('admin', 'super_admin')
      ) OR
      auth.jwt() ->> 'role' = 'service_role'
    )
  );
