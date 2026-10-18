-- 05_admin.sql
-- Insert your user as Super Admin in the admins table
-- Replace '<MY-USER-UUID>' with your actual Supabase auth user UUID (found under Authentication -> Users)

INSERT INTO admins (admin_id, user_id, role, is_active)
VALUES ('ADM-1001', '<MY-USER-UUID>', 'super_admin', true)
ON CONFLICT (admin_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
