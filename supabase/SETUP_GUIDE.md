# SuperCart - Supabase Backend Setup Guide

This guide details how to configure your Supabase project (`cyxxldgxksnzuhczkwav`) for SuperCart.

---

## 1. Run SQL Scripts in Supabase SQL Editor

In your Supabase Dashboard: Go to **SQL Editor** -> **New query**.

Execute the scripts in this strict order:
1. Copy and run contents of `supabase/schema.sql` (Creates extensions, tables, constraints, updated_at triggers, stock decrement trigger, audit log trigger, and registers Realtime channels).
2. Copy and run contents of `supabase/rls.sql` (Enforces Row Level Security and security definer functions).
3. Copy and run contents of `supabase/seed.sql` (Populates 13 grocery categories, subcategories, coupons, and 150+ realistic Indian grocery products).

---

## 2. Insert the First Super Admin

Run this SQL snippet in the Supabase SQL Editor. Replace `suyashwale19@gmail.com` with your exact email if different:

```sql
-- Insert primary Super Admin account into admins table
insert into public.admins (admin_id, email, role, is_active)
values ('ADM-1001', 'suyashwale19@gmail.com', 'super_admin', true)
on conflict (admin_id) do update set
  role = 'super_admin',
  is_active = true;

-- If you have already signed up via Auth, link your auth.users uuid:
update public.admins
set user_id = auth_user.id
from auth.users as auth_user
where public.admins.email = auth_user.email
  and public.admins.admin_id = 'ADM-1001';
```

---

## 3. Enable Authentication Providers

In your Supabase Dashboard: Go to **Authentication** -> **Providers**.

### A. Google OAuth Provider:
1. Expand **Google**.
2. Toggle **Enable Sign in with Google**.
3. Add your Google Cloud OAuth Client ID & Secret.
4. Set the Authorized Redirect URI in Google Cloud Console to:
   `https://cyxxldgxksnzuhczkwav.supabase.co/auth/v1/callback`

### B. Phone (SMS OTP) Provider:
1. Expand **Phone**.
2. Toggle **Enable Phone Provider**.
3. Choose your SMS Provider (Twilio, MessageBird, or Supabase default test mode).
4. Default country code: `+91` (India).

---

## 4. Create Storage Bucket for Product Images

In your Supabase Dashboard: Go to **Storage** -> **Create new bucket**.

1. **Bucket Name**: `product-images`
2. **Public Bucket**: Check **Yes** (Public)
3. Under Storage Policies:
   - Allow public SELECT (read) for everyone:
     ```sql
     create policy "Public Access" on storage.objects for select using (bucket_id = 'product-images');
     ```
   - Allow active admins to INSERT/UPDATE/DELETE images:
     ```sql
     create policy "Admin Upload" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
     ```

---

## 5. Configure Supabase Secrets for Razorpay

If deploying Supabase Edge Functions using Supabase CLI:

```bash
# Set Razorpay test credentials as Supabase secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_test_yourKeyId
supabase secrets set RAZORPAY_KEY_SECRET=yourKeySecret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=yourWebhookSecret

# Deploy Edge Functions
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
supabase functions deploy razorpay-webhook
```

---

## 6. Frontend Environment Configuration

In your `.env` file (already configured for your project):

```env
VITE_SUPABASE_URL="https://cyxxldgxksnzuhczkwav.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eHhsZGd4a3NuenVoY3prd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MjgyODQsImV4cCI6MjEwNzIwNDI4NH0.dr2twEue9X9hfn9q-V03HGa7nIPm_aE0F1k5bvClnfM"
```
