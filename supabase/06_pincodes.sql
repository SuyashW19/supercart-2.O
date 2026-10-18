-- 06_pincodes.sql
-- SuperCart Nationwide Pincode & Serviceability Tables
-- Safe to re-run (idempotent)

-- 1. Create serviceable_pincodes table for custom ETA overrides
CREATE TABLE IF NOT EXISTS serviceable_pincodes (
  pincode text PRIMARY KEY,
  city text,
  state text,
  is_active boolean DEFAULT true,
  eta_minutes int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create blocked_pincodes table for emergency / maintenance outages
CREATE TABLE IF NOT EXISTS blocked_pincodes (
  pincode text PRIMARY KEY,
  reason text,
  blocked_at timestamptz DEFAULT now()
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_serviceable_pincodes_active ON serviceable_pincodes(is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_pincodes_pincode ON blocked_pincodes(pincode);

-- 4. Auto-update updated_at trigger for serviceable_pincodes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_serviceable_pincodes_modtime ON serviceable_pincodes;
CREATE TRIGGER update_serviceable_pincodes_modtime
  BEFORE UPDATE ON serviceable_pincodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE serviceable_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_pincodes ENABLE ROW LEVEL SECURITY;

-- 6. Helper Security Definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Policies for serviceable_pincodes (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read serviceable_pincodes" ON serviceable_pincodes;
CREATE POLICY "Public read serviceable_pincodes" ON serviceable_pincodes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write serviceable_pincodes" ON serviceable_pincodes;
CREATE POLICY "Admin write serviceable_pincodes" ON serviceable_pincodes
  FOR ALL USING (public.is_admin());

-- 8. Policies for blocked_pincodes (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public read blocked_pincodes" ON blocked_pincodes;
CREATE POLICY "Public read blocked_pincodes" ON blocked_pincodes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write blocked_pincodes" ON blocked_pincodes;
CREATE POLICY "Admin write blocked_pincodes" ON blocked_pincodes
  FOR ALL USING (public.is_admin());

-- 9. Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE serviceable_pincodes, blocked_pincodes;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- 10. Optional Initial Seed for Flagship Dark Stores
INSERT INTO serviceable_pincodes (pincode, city, state, is_active, eta_minutes)
VALUES
  ('411045', 'Pune (Baner)', 'Maharashtra', true, 8),
  ('411014', 'Pune (Viman Nagar)', 'Maharashtra', true, 9),
  ('411001', 'Pune (Camp)', 'Maharashtra', true, 10),
  ('416001', 'Kolhapur (Shahupuri)', 'Maharashtra', true, 10),
  ('416003', 'Kolhapur (City)', 'Maharashtra', true, 10),
  ('400050', 'Mumbai (Bandra)', 'Maharashtra', true, 9),
  ('560034', 'Bengaluru (Koramangala)', 'Karnataka', true, 8),
  ('110001', 'Delhi (Connaught Place)', 'Delhi', true, 9),
  ('781001', 'Guwahati (Fancy Bazar)', 'Assam', true, 10)
ON CONFLICT (pincode) DO UPDATE
SET eta_minutes = EXCLUDED.eta_minutes,
    city = EXCLUDED.city,
    state = EXCLUDED.state;
