import React, { useState } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Truck,
  HeartHandshake,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { formatINR, FREE_DELIVERY_THRESHOLD } from "../../config";
import { ProductImage } from "../common/ProductImage";

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onOpenAuth: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    itemTotal,
    mrpTotal,
    totalDiscount,
    couponDiscount,
    deliveryFee,
    handlingFee,
    deliveryTip,
    setDeliveryTip,
    gstAmount,
    grandTotal,
    totalSavings,
    amountNeededForFreeDelivery,
    freeDeliveryPercentage,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    autoApplyBestCoupon,
    deliveryInstructions,
    toggleDeliveryInstruction,
    substitutionPreference,
    setSubstitutionPreference,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isCartDrawerOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    if (res.success) setCouponInput("");
  };

  const handleAutoApply = () => {
    const res = autoApplyBestCoupon();
    if (res.applied && res.message) {
      setCouponFeedback({ success: true, message: res.message });
    } else if (res.message) {
      setCouponFeedback({ success: false, message: res.message });
    }
  };

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    if (!user) {
      // Guest tapping checkout goes to login, cart stays completely intact!
      onOpenAuth();
    } else {
      onProceedToCheckout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              My Cart
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              ({cart.length} {cart.length === 1 ? "item" : "items"})
            </span>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4">
              <Truck className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              Your cart is empty
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6">
              Add dairy, fresh vegetables, snacks, or beverages to enjoy 10-minute instant delivery!
            </p>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Cart Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Free delivery progress bar */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60">
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-emerald-900 dark:text-emerald-300">
                    {amountNeededForFreeDelivery > 0
                      ? `Add ₹${amountNeededForFreeDelivery} more for FREE Delivery`
                      : "🎉 Congratulations! FREE Delivery unlocked"}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {freeDeliveryPercentage}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                    style={{ width: `${freeDeliveryPercentage}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40"
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-50 dark:bg-slate-800 p-1 shrink-0">
                      <ProductImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-1">{item.product.weight}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatINR(item.product.price * item.quantity)}
                        </span>
                        {item.product.mrp > item.product.price && (
                          <span className="text-[10px] text-slate-400 line-through tabular-nums">
                            {formatINR(item.product.mrp * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg px-2 py-1 shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-0.5 hover:opacity-80 active:scale-90"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-bold min-w-3 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-0.5 hover:opacity-80 active:scale-90"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupons & Offers */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Apply Coupon</span>
                  </div>
                  <button
                    onClick={handleAutoApply}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    Auto-apply best
                  </button>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-900 dark:text-emerald-300">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[11px] text-emerald-700 block">
                          Savings: {formatINR(couponDiscount)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter code (e.g. SUPERCART50)"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs uppercase"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponFeedback && (
                  <p
                    className={`text-[11px] font-medium ${
                      couponFeedback.success ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Delivery Tip */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Partner Tip</span>
                </span>
                <div className="flex gap-2">
                  {[0, 20, 30, 50].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => setDeliveryTip(tip)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        deliveryTip === tip
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {tip === 0 ? "No tip" : `₹${tip}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Delivery Instructions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Leave at door",
                    "Avoid calling",
                    "Don't ring bell",
                    "Contactless delivery",
                  ].map((inst) => {
                    const active = deliveryInstructions.includes(inst);
                    return (
                      <button
                        key={inst}
                        onClick={() => toggleDeliveryInstruction(inst)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                          active
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {inst}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Substitution Preference */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  If an item is out of stock:
                </span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sub_pref"
                      checked={substitutionPreference === "replace"}
                      onChange={() => setSubstitutionPreference("replace")}
                      className="accent-emerald-600"
                    />
                    <span>Replace with best match</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sub_pref"
                      checked={substitutionPreference === "refund"}
                      onChange={() => setSubstitutionPreference("refund")}
                      className="accent-emerald-600"
                    />
                    <span>Instant refund</span>
                  </label>
                </div>
              </div>

              {/* Full Bill Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                  Bill Details
                </span>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Item Total</span>
                  <span className="tabular-nums font-medium">{formatINR(itemTotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Delivery Fee {deliveryFee > 0 ? "(0.5%)" : ""}</span>
                  <span className="tabular-nums font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase">FREE</span>
                    ) : (
                      formatINR(deliveryFee)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Handling Fee</span>
                  <span className="tabular-nums font-medium">{formatINR(handlingFee)}</span>
                </div>

                {deliveryTip > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delivery Tip</span>
                    <span className="tabular-nums font-medium">{formatINR(deliveryTip)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span className="tabular-nums font-bold">-{formatINR(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Govt. Taxes & GST (5%)</span>
                  <span className="tabular-nums font-medium">{formatINR(gstAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>To Pay</span>
                  <span className="tabular-nums text-emerald-600">{formatINR(grandTotal)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-center mt-2">
                    🎉 You saved {formatINR(totalSavings)} on this order!
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Checkout CTA Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-between active:scale-98 transition-all"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
                    Grand Total
                  </span>
                  <span className="tabular-nums text-base">{formatINR(grandTotal)}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{user ? "Proceed to Checkout" : "Login to Checkout"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
