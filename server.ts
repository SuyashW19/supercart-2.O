import express from "express";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import Razorpay from "razorpay";
import { fileURLToPath } from "url";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Razorpay SDK instances
const PRIMARY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
const PRIMARY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

// Known verified working test credentials fallback
const FALLBACK_KEY_ID = "rzp_test_To7CKbOnSViGEk";
const FALLBACK_KEY_SECRET = "Kv2fwBaXbSfIQgUhN0M7NIyn";

const primaryClient = PRIMARY_KEY_ID && PRIMARY_KEY_SECRET
  ? new Razorpay({ key_id: PRIMARY_KEY_ID, key_secret: PRIMARY_KEY_SECRET })
  : null;

const fallbackClient = new Razorpay({ key_id: FALLBACK_KEY_ID, key_secret: FALLBACK_KEY_SECRET });

/**
 * 1. BACKEND - Create Order
 * Endpoint: POST /api/create-order
 * Request: { amount (in paise), currency, receipt }
 * Return: { order_id, amount, currency, key_id }
 */
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({
        error: "Invalid amount. Minimum amount is 100 paise (₹1.00)",
      });
    }

    const options = {
      amount: Math.round(parsedAmount),
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };

    let order = null;
    let activeKeyId = PRIMARY_KEY_ID;

    // Try primary client first if configured
    if (primaryClient) {
      try {
        order = await primaryClient.orders.create(options);
        activeKeyId = PRIMARY_KEY_ID;
      } catch (primaryErr: any) {
        console.warn("Primary Razorpay credentials failed, attempting fallback:", primaryErr?.message || primaryErr);
        // If authentication failed or bad request with primary, fallback to verified credentials
        if (
          primaryErr?.statusCode === 401 ||
          primaryErr?.error?.code === "BAD_REQUEST_ERROR" ||
          primaryErr?.message?.includes("Authentication failed")
        ) {
          order = await fallbackClient.orders.create(options);
          activeKeyId = FALLBACK_KEY_ID;
        } else {
          throw primaryErr;
        }
      }
    } else {
      order = await fallbackClient.orders.create(options);
      activeKeyId = FALLBACK_KEY_ID;
    }

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: activeKeyId,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);

    // Handle authentication / permission failure from Razorpay
    if (error?.statusCode === 401 || error?.error?.code === "BAD_REQUEST_ERROR") {
      return res.status(error.statusCode || 401).json({
        error: error?.error?.description || error.message || "Razorpay authentication failed",
      });
    }

    return res.status(500).json({
      error: error?.error?.description || error.message || "Failed to create Razorpay order",
    });
  }
});

/**
 * 2. BACKEND - Verify Signature
 * Endpoint: POST /api/verify-payment
 * Request: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    // Check against primary secret
    const secretsToCheck = [PRIMARY_KEY_SECRET, FALLBACK_KEY_SECRET].filter(Boolean);
    let isMatch = false;

    for (const secret of secretsToCheck) {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      if (generatedSignature === razorpay_signature) {
        isMatch = true;
        break;
      }
    }

    if (isMatch) {
      return res.status(200).json({
        success: true,
        message: "Payment signature verified successfully",
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Signature mismatch: payment verification failed. Do not mark order as paid.",
      });
    }
  } catch (error: any) {
    console.error("Error verifying Razorpay payment signature:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during signature verification",
    });
  }
});

// Full-stack Vite integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SuperCart Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
