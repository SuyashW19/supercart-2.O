import React from "react";
import { CheckCircle2, Clock, MapPin, ArrowRight, ShoppingBag } from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { formatINR, APP_NAME } from "../config";

interface OrderSuccessPageProps {
  orderId: string;
  onTrackOrder: (orderId: string) => void;
  onContinueShopping: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  orderId,
  onTrackOrder,
  onContinueShopping,
}) => {
  const { getOrderById } = useOrders();
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <h2 className="text-lg font-bold">Order Confirmed!</h2>
        <button
          onClick={onContinueShopping}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center animate-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-2">
        Order #{order.order_number} Confirmed
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
        Arriving in 10 Minutes!
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
        Dark Store Baner Hub has accepted your order and our picker is packing your items now.
      </p>

      {/* Quick Summary Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left mb-6 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Delivery To:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {order.delivery_address.area}, {order.delivery_address.city}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Total Amount:</span>
            <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatINR(order.grand_total)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Estimated Delivery:
            </span>
          </div>
          <span className="font-extrabold text-emerald-600">8 - 10 Minutes</span>
        </div>

        {/* Security OTP */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">
            Delivery Verification OTP:
          </span>
          <span className="font-mono text-base font-black tracking-widest text-amber-700 dark:text-amber-400">
            {order.delivery_otp}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onTrackOrder(order.id)}
          className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Track Live Delivery</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onContinueShopping}
          className="px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
