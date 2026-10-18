-- 04_realtime.sql
-- Enable Supabase Realtime replication on products, orders, tracking, notifications and pincodes

ALTER PUBLICATION supabase_realtime ADD TABLE products, orders, order_tracking_events, notifications, serviceable_pincodes, blocked_pincodes;

