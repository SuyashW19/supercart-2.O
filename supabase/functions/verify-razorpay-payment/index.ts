// ==============================================================================
// SuperCart Supabase Edge Function: verify-razorpay-payment
// Runtime: Deno / TypeScript
// Cryptographic HMAC SHA256 Signature verification using Web Crypto API
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cryptographic HMAC SHA-256 signature computation using native Web Crypto API
async function generateHmacSha256(secret: string, text: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing RAZORPAY_KEY_SECRET environment secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required payment parameters for verification." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Razorpay signature formula: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const expectedSignature = await generateHmacSha256(
      RAZORPAY_KEY_SECRET,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return new Response(
        JSON.stringify({ verified: false, error: "Invalid payment signature. Payment verification failed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: If service role key is present, update order payment status in Supabase database
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && order_id) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Record payment in payments table
      await supabaseAdmin.from("payments").insert({
        order_id,
        method: "razorpay",
        status: "successful",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      // Update order status to confirmed
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
        })
        .eq("id", order_id);

      // Create tracking event
      await supabaseAdmin.from("order_tracking_events").insert({
        order_id,
        status: "confirmed",
        title: "Payment Verified & Order Confirmed",
        description: `Payment ID ${razorpay_payment_id} verified. Dark store notified for picking.`,
      });
    }

    return new Response(
      JSON.stringify({
        verified: true,
        message: "Payment successfully verified by SuperCart backend.",
        payment_id: razorpay_payment_id,
        order_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to verify payment." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
