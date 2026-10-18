// ==============================================================================
// SuperCart Supabase Edge Function: razorpay-webhook
// Runtime: Deno / TypeScript
// Handles asynchronous webhook callbacks from Razorpay for captured, failed & refunded payments
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

async function verifyWebhookSignature(secret: string, rawBody: string, expectedSignature: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const computedSignature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedSignature === expectedSignature;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const signature = req.headers.get("x-razorpay-signature");
    const rawBody = await req.text();

    if (WEBHOOK_SECRET && signature) {
      const isValid = await verifyWebhookSignature(WEBHOOK_SECRET, rawBody, signature);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      switch (event) {
        case "payment.captured":
        case "order.paid": {
          const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
          if (razorpayOrderId) {
            // Find internal order
            const { data: order } = await supabaseAdmin
              .from("orders")
              .select("id")
              .eq("razorpay_order_id", razorpayOrderId)
              .maybeSingle();

            if (order) {
              await supabaseAdmin
                .from("orders")
                .update({ payment_status: "paid", status: "confirmed" })
                .eq("id", order.id);

              await supabaseAdmin.from("payments").upsert({
                order_id: order.id,
                method: paymentEntity?.method || "razorpay",
                status: "successful",
                razorpay_payment_id: paymentEntity?.id,
                razorpay_order_id: razorpayOrderId,
                amount: (paymentEntity?.amount || 0) / 100,
              });
            }
          }
          break;
        }

        case "payment.failed": {
          const razorpayOrderId = paymentEntity?.order_id;
          if (razorpayOrderId) {
            const { data: order } = await supabaseAdmin
              .from("orders")
              .select("id")
              .eq("razorpay_order_id", razorpayOrderId)
              .maybeSingle();

            if (order) {
              await supabaseAdmin
                .from("orders")
                .update({ payment_status: "failed" })
                .eq("id", order.id);
            }
          }
          break;
        }

        case "refund.processed": {
          const refundEntity = payload.payload?.refund?.entity;
          const paymentId = refundEntity?.payment_id;
          if (paymentId) {
            await supabaseAdmin
              .from("payments")
              .update({ status: "refunded" })
              .eq("razorpay_payment_id", paymentId);
          }
          break;
        }
      }
    }

    return new Response(JSON.stringify({ status: "ok", received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
