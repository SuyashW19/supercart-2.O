import React, { useState } from "react";
import {
  ArrowLeft,
  RotateCcw,
  FileText,
  Clock,
  Star,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrderContext";
import { useCart } from "../context/CartContext";
import { formatINR } from "../config";
import { ProductImage } from "../components/common/ProductImage";
import { Order } from "../types";
import { supabase, isSupabaseConfigured } from "../services/supabase";

interface OrdersPageProps {
  onBack: () => void;
  onTrackOrder: (orderId: string) => void;
  onViewInvoice: (orderId: string) => void;
  onHelp: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onBack,
  onTrackOrder,
  onViewInvoice,
  onHelp,
}) => {
  const { user, logout } = useAuth();
  const { orders, reorder } = useOrders();
  const { setIsCartDrawerOpen } = useCart();
  const [filter, setFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");
  const [ratedOrders, setRatedOrders] = useState<Record<string, number>>({});

  const handleReorder = (order: Order) => {
    reorder(order);
    setIsCartDrawerOpen(true);
  };

  const handleRate = (orderId: string, rating: number) => {
    setRatedOrders((prev) => ({ ...prev, [orderId]: rating }));
    if (user && isSupabaseConfigured && supabase) {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder && targetOrder.items.length > 0) {
        supabase
          .from("reviews")
          .insert(
            targetOrder.items.map((item) => ({
              product_id: item.product_id,
              user_name: user.name || "SuperCart Shopper",
              rating,
              comment: `Verified Order #${targetOrder.order_number} rating: ${rating} Stars`,
            }))
          )
          .then();
      }
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return ["placed", "confirmed", "packing", "out_for_delivery"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return ["cancelled", "refunded"].includes(o.status);
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              My Orders
            </h1>
            <p className="text-xs text-slate-500">
              View order history, live tracking, and invoices
            </p>
          </div>
        </div>

        {user && (
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All Orders" },
          { id: "active", label: "Active Orders" },
          { id: "delivered", label: "Delivered" },
          { id: "cancelled", label: "Cancelled / Refunded" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab.id
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            No orders found in this section
          </h3>
          <p className="text-xs text-slate-400">Order your groceries to get them in 10 minutes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isActive = ["placed", "confirmed", "packing", "out_for_delivery"].includes(order.status);
            const userRating = ratedOrders[order.id];

            return (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                {/* Header row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                      #{order.order_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : order.status === "delivered"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          : "bg-rose-50 dark:bg-rose-950/50 text-rose-600"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-[140px] shrink-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 p-0.5 shrink-0">
                        <ProductImage
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.quantity} × {formatINR(item.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer details & actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs">
                    <span className="text-slate-400">Total: </span>
                    <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatINR(order.grand_total)}
                    </span>
                    <span className="text-slate-400 text-[11px]"> · {order.items.length} items</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isActive ? (
                      <button
                        onClick={() => onTrackOrder(order.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Track Live Delivery</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleReorder(order)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>

                        <button
                          onClick={() => onViewInvoice(order.id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Invoice</span>
                        </button>
                      </>
                    )}

                    {/* Rate order */}
                    {order.status === "delivered" && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 mr-1">Rate:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(order.id, star)}
                            className="p-0.5"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                star <= (userRating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={onHelp}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Need Help?"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
