import React, { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  Lock,
  LogIn,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrderContext";
import { formatINR, APP_NAME } from "../config";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { RazorpayOptions, RazorpayResponse } from "../types";

interface CheckoutPageProps {
  onBack: () => void;
  onOrderSuccess: (orderId: string) => void;
  onOpenAuth?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onOrderSuccess, onOpenAuth }) => {
  const { user } = useAuth();
  const { currentAddress, setIsLocationModalOpen } = useLocation();
  const {
    cart,
    itemTotal,
    deliveryFee,
    handlingFee,
    couponDiscount,
    deliveryTip,
    gstAmount,
    grandTotal,
    deliverySlot,
    setDeliverySlot,
    scheduledTime,
    setScheduledTime,
    clearCart,
  } = useCart();
  const { createOrder } = useOrders();

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking" | "wallet" | "cod">("upi");
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      setPaymentError("Please log in to your account before placing an order.");
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Cash on Delivery flow
      if (paymentMethod === "cod") {
        await new Promise((r) => setTimeout(r, 600));
        const res = await createOrder("cod");
        if (res.success && res.orderId) {
          triggerConfetti();
          onOrderSuccess(res.orderId);
        } else {
          setPaymentError(res.error || "Could not place COD order. Please try again.");
        }
        return;
      }

      // 2. Razorpay Standard Web Checkout Flow
      // Step A: Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Razorpay SDK could not be loaded. Please check your internet connection.");
      }

      // Step B: Call Backend to Create Order (POST /api/create-order)
      const amountInPaise = Math.max(100, Math.round(grandTotal * 100));
      const createOrderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
      });

      if (!createOrderRes.ok) {
        const errorData = await createOrderRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create order on server (Status ${createOrderRes.status})`);
      }

      const orderData = await createOrderRes.json();
      if (!orderData?.order_id) {
        throw new Error("Invalid order response from server");
      }

      const customerContact = user?.phone || currentAddress.receiver_phone || undefined;

      // Step C: Open Razorpay Standard Checkout Modal
      const options: RazorpayOptions = {
        key: orderData.key_id || (import.meta.env.VITE_RAZORPAY_KEY_ID as string),
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: APP_NAME,
        description: "SuperCart 10-Minute Rapid Delivery",
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || currentAddress.receiver_name || "SuperCart Customer",
          email: user?.email || undefined,
          ...(customerContact ? { contact: customerContact } : {}),
        },
        notes: {
          address: `${currentAddress.house_no}, ${currentAddress.street}, ${currentAddress.area}, ${currentAddress.city}`,
          pincode: currentAddress.pincode,
        },
        theme: {
          color: "#059669",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentError("Payment modal dismissed. You can retry anytime.");
          },
        },
        handler: async (response: RazorpayResponse) => {
          try {
            setIsProcessing(true);
            setPaymentError(null);

            // Step D: Call Backend to Verify Payment Signature (POST /api/verify-payment)
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              // Signature verified! Complete order placement
              const res = await createOrder(paymentMethod);
              if (res.success && res.orderId) {
                triggerConfetti();
                onOrderSuccess(res.orderId);
              } else {
                setPaymentError(
                  `Payment verified (${response.razorpay_payment_id}), but order could not be registered. Please contact support.`
                );
              }
            } else {
              setPaymentError(verifyData.message || "Payment signature verification failed. Order not marked as paid.");
            }
          } catch (verifyErr: any) {
            console.error("Verification error:", verifyErr);
            setPaymentError(verifyErr?.message || "Payment signature verification request failed.");
          } finally {
            setIsProcessing(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on("payment.failed", (failedRes: any) => {
        setIsProcessing(false);
        const desc = failedRes?.error?.description || failedRes?.error?.reason || "Payment authorization failed.";
        setPaymentError(`Payment Failed: ${desc}`);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("Checkout process error:", err);
      setPaymentError(err?.message || "Payment authorization failed. Please retry.");
      setIsProcessing(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Back button & page title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Checkout
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {APP_NAME} 10-Minute Rapid Delivery
          </p>
        </div>
      </div>

      {/* Unauthenticated Login Prompt Banner */}
      {!user && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Account Login Required</span>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold uppercase">Required to Order</span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Please log in or sign up before placing an order. Your cart and selected options will be preserved!
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-all shadow-sm active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>Login / Register</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Address, Slot & Payment */}
        <div className="md:col-span-2 space-y-5">
          {/* 1. Delivery Address Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delivery Address
                </h2>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Change
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px]">
                  {currentAddress.label}
                </span>
                <span>{currentAddress.receiver_name}</span>
                {currentAddress.receiver_phone ? (
                  <span className="text-slate-400 font-normal">({currentAddress.receiver_phone})</span>
                ) : null}
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentAddress.house_no}, {currentAddress.street}, {currentAddress.area},{" "}
                {currentAddress.city} - {currentAddress.pincode}
              </p>
            </div>
          </div>

          {/* 2. Delivery Slot Choice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Delivery Speed & Slot
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeliverySlot("instant")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliverySlot === "instant"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    ⚡ Instant
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  In 10 Minutes
                </div>
                <span className="text-[11px] text-slate-500">From Baner Dark Store</span>
              </button>

              <button
                onClick={() => setDeliverySlot("scheduled")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliverySlot === "scheduled"
                    ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  📅 Scheduled
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Later Today
                </div>
                <span className="text-[11px] text-slate-500">Pick preferred time slot</span>
              </button>
            </div>

            {deliverySlot === "scheduled" && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Select Delivery Slot:
                </label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="Today, 6:00 PM - 7:00 PM">Today, 6:00 PM - 7:00 PM</option>
                  <option value="Today, 7:00 PM - 8:00 PM">Today, 7:00 PM - 8:00 PM</option>
                  <option value="Today, 8:00 PM - 9:00 PM">Today, 8:00 PM - 9:00 PM</option>
                  <option value="Tomorrow Morning, 7:00 AM - 8:00 AM">Tomorrow Morning, 7:00 AM - 8:00 AM</option>
                </select>
              </div>
            )}
          </div>

          {/* 3. Payment Method */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Payment Method
                </h2>
                <p className="text-[11px] text-slate-400">
                  Razorpay Secured (128-bit SSL Encryption)
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* UPI */}
              <label
                onClick={() => setPaymentMethod("upi")}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "upi"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      UPI (Google Pay, PhonePe, Paytm, CRED)
                    </span>
                    <span className="text-[11px] text-slate-400">Zero transaction charges</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                  className="accent-emerald-600"
                />
              </label>

              {paymentMethod === "upi" && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    {["@okaxis", "@oksbi", "@paytm", "@ybl"].map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => setUpiId("user" + handle)}
                        className="px-2 py-1 text-[11px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md font-medium text-slate-700 dark:text-slate-200"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter UPI ID (e.g. mobile@upi)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Credit / Debit Cards */}
              <label
                onClick={() => setPaymentMethod("card")}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "card"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Credit / Debit Cards
                    </span>
                    <span className="text-[11px] text-slate-400">Visa, Mastercard, RuPay</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="accent-emerald-600"
                />
              </label>

              {/* Netbanking */}
              <label
                onClick={() => setPaymentMethod("netbanking")}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "netbanking"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Net Banking
                    </span>
                    <span className="text-[11px] text-slate-400">All major Indian banks</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "netbanking"}
                  onChange={() => setPaymentMethod("netbanking")}
                  className="accent-emerald-600"
                />
              </label>

              {/* Cash On Delivery */}
              <label
                onClick={() => setPaymentMethod("cod")}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "cod"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-slate-400">Pay cash or UPI on delivery</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-emerald-600"
                />
              </label>
            </div>

            {paymentError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Order Items ({cart.length})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-2 first:pt-0 flex justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.product.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {item.product.weight} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums">
                    {formatINR(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Item Total</span>
                <span className="tabular-nums">{formatINR(itemTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee {deliveryFee > 0 ? "(0.5%)" : ""}</span>
                <span className="tabular-nums font-bold text-emerald-600">
                  {deliveryFee === 0 ? "FREE" : formatINR(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Handling Fee</span>
                <span className="tabular-nums">{formatINR(handlingFee)}</span>
              </div>
              {deliveryTip > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Tip</span>
                  <span className="tabular-nums">{formatINR(deliveryTip)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span className="tabular-nums">-{formatINR(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>GST (5%)</span>
                <span className="tabular-nums">{formatINR(gstAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="text-emerald-600 tabular-nums">{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full mt-3 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing {paymentMethod.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <span>
                    {user
                      ? paymentMethod === "cod"
                        ? "Place COD Order"
                        : "Pay with Razorpay"
                      : "Login to Place Order"}
                  </span>
                  <span className="tabular-nums">({formatINR(grandTotal)})</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Guaranteed doorstep delivery in 10 minutes or full refund.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
