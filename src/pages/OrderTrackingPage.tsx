import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Phone,
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  Package,
  Bike,
  Star,
  RefreshCw,
  FileText,
  Play,
} from "lucide-react";
import L from "leaflet";
import { useOrders } from "../context/OrderContext";
import { formatINR, APP_NAME } from "../config";
import { ProductImage } from "../components/common/ProductImage";

interface OrderTrackingPageProps {
  orderId: string;
  onBack: () => void;
  onViewInvoice: (orderId: string) => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  orderId,
  onBack,
  onViewInvoice,
}) => {
  const { getOrderById, simulateDeliveryStep } = useOrders();
  const order = getOrderById(orderId);

  const [etaSeconds, setEtaSeconds] = useState(480); // 8 minutes
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const partnerMarkerRef = useRef<L.Marker | null>(null);

  // Countdown timer
  useEffect(() => {
    if (order?.status === "delivered") {
      setEtaSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setEtaSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.status]);

  // Leaflet Map with Store, Partner & Customer markers
  useEffect(() => {
    if (!order || !mapContainerRef.current) return;

    const storeLat = order.store_location.lat;
    const storeLng = order.store_location.lng;
    const custLat = order.delivery_address.lat;
    const custLng = order.delivery_address.lng;
    const partnerLat = order.delivery_partner?.current_lat || storeLat;
    const partnerLng = order.delivery_partner?.current_lng || storeLng;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([partnerLat, partnerLng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Store Marker
      const storeIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background:#0f172a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);font-size:14px;">🏪</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      L.marker([storeLat, storeLng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${order.store_location.name}</b>`);

      // Customer Marker
      const custIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background:#dc2626;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);font-size:14px;">🏠</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      L.marker([custLat, custLng], { icon: custIcon })
        .addTo(map)
        .bindPopup(`<b>Your Address:</b> ${order.delivery_address.house_no}`);

      // Delivery Partner Marker
      const partnerIcon = L.divIcon({
        className: "partner-pin",
        html: `<div style="background:#16a34a;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;border:3px solid white;box-shadow:0 4px 12px rgba(22,163,74,0.5);font-size:16px;">🛵</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      const pMarker = L.marker([partnerLat, partnerLng], { icon: partnerIcon })
        .addTo(map)
        .bindPopup(`<b>${order.delivery_partner?.name || "Delivery Hero"}</b>`);

      partnerMarkerRef.current = pMarker;

      // Draw polyline route connecting store to customer
      const latlngs = [
        [storeLat, storeLng],
        [partnerLat, partnerLng],
        [custLat, custLng],
      ];
      L.polyline(latlngs as any, { color: "#16a34a", weight: 4, dashArray: "6, 8" }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      // Update partner marker position
      if (partnerMarkerRef.current) {
        partnerMarkerRef.current.setLatLng([partnerLat, partnerLng]);
      }
    }
  }, [order?.delivery_partner?.current_lat, order?.delivery_partner?.current_lng]);

  // Clean map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!order) return null;

  const minutes = Math.floor(etaSeconds / 60);
  const seconds = etaSeconds % 60;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Live Order Tracking
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500">Order #{order.order_number}</p>
          </div>
        </div>

        <button
          onClick={() => onViewInvoice(order.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>GST Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Map & Status Timeline */}
        <div className="md:col-span-2 space-y-4">
          {/* Map Container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            <div ref={mapContainerRef} className="w-full h-72 sm:h-80" />

            {/* Floating ETA Card on Map */}
            <div className="absolute top-3 left-3 z-1000 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Estimated Arrival
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {order.status === "delivered"
                    ? "Delivered 🎉"
                    : `${minutes}:${seconds < 10 ? "0" : ""}${seconds} MINS`}
                </span>
              </div>
            </div>

            {/* Quick Demo: Simulate Delivery Step Button */}
            {order.status !== "delivered" && (
              <button
                onClick={() => simulateDeliveryStep(order.id)}
                className="absolute bottom-3 right-3 z-1000 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-md shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Simulate Scooter Movement</span>
              </button>
            )}
          </div>

          {/* Realtime Timeline */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Order Progress
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {order.timeline.map((step, idx) => (
                <div key={idx} className="relative flex items-start justify-between text-xs">
                  {/* Dot icon */}
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-4 ring-white dark:ring-slate-900 ${
                      step.completed
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {step.completed ? "✓" : idx + 1}
                  </span>

                  <div>
                    <h4
                      className={`font-bold ${
                        step.completed
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {step.label}
                    </h4>
                    {step.details && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {step.details}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {step.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Partner, OTP & Item Statuses */}
        <div className="space-y-4">
          {/* Delivery OTP Card */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-1">
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Share OTP with Delivery Partner
            </span>
            <div className="font-mono text-3xl font-black text-amber-800 dark:text-amber-300 tracking-widest">
              {order.delivery_otp}
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              Verify your parcel before sharing OTP.
            </p>
          </div>

          {/* Delivery Partner Profile Card */}
          {order.delivery_partner && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Delivery Partner
              </span>

              <div className="flex items-center gap-3">
                <img
                  src={order.delivery_partner.avatar_url}
                  alt={order.delivery_partner.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {order.delivery_partner.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {order.delivery_partner.rating}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{order.delivery_partner.vehicle_no}</span>
                  </div>
                </div>

                <a
                  href={`tel:${order.delivery_partner.phone}`}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  aria-label="Call partner"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Item-level status breakdown */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Items In Bag ({order.items.length})
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">All Checked</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 p-0.5 shrink-0">
                      <ProductImage
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Qty: {item.quantity} · {item.weight}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0">
                    {item.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold">
              <span>Paid via {order.payment_method.toUpperCase()}</span>
              <span className="tabular-nums text-emerald-600">{formatINR(order.grand_total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
