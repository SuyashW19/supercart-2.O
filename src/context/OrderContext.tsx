import React, { createContext, useContext, useState, useEffect } from "react";
import { Order, OrderStatus, Product } from "../types";
import { useAuth } from "./AuthContext";
import { useLocation } from "./LocationContext";
import { useCart } from "./CartContext";

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  createOrder: (paymentMethod: Order["payment_method"]) => Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  simulateDeliveryStep: (orderId: string) => void;
  reorder: (order: Order) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const STORAGE_ORDERS_KEY = "supercart_orders";

// Store location configuration
const DEMO_STORE_LOCATION = {
  name: "SuperCart Dark Store #14 (Baner Hub)",
  lat: 18.562,
  lng: 73.782,
  address: "Plot 42, Sector 5, Baner High Street, Pune 411045",
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

import { supabase, isSupabaseConfigured } from "../services/supabase";

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentAddress } = useLocation();
  const {
    cart,
    itemTotal,
    deliveryFee,
    handlingFee,
    couponDiscount,
    deliveryTip,
    gstAmount,
    grandTotal,
    deliveryInstructions,
    substitutionPreference,
    deliverySlot,
    scheduledTime,
    clearCart,
    addToCart,
  } = useCart();

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeOrder, setActiveOrder] = useState<Order | null>(orders[0] || null);

  // Sync / Fetch user orders from Supabase on login
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    const client = supabase;

    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const { data, error } = await client
          .from("orders")
          .select("*, order_items(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0 && isMounted) {
          const mappedOrders: Order[] = data.map((o: any) => ({
            id: o.id,
            order_number: o.order_number,
            user_id: o.user_id,
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            created_at: o.created_at,
            status: o.status,
            items: (o.order_items || []).map((it: any) => ({
              product_id: it.product_id,
              name: it.name,
              weight: it.weight,
              price: Number(it.price),
              mrp: Number(it.mrp),
              quantity: it.quantity,
              image_url: it.image_url,
              status: it.status,
            })),
            delivery_address: o.delivery_address,
            delivery_slot: o.delivery_slot,
            scheduled_time: o.scheduled_time,
            delivery_otp: o.delivery_otp,
            payment_method: o.payment_method,
            payment_status: o.payment_status,
            item_total: Number(o.item_total),
            delivery_fee: Number(o.delivery_fee),
            handling_fee: Number(o.handling_fee),
            discount: Number(o.discount),
            delivery_tip: Number(o.delivery_tip),
            gst: Number(o.gst),
            grand_total: Number(o.grand_total),
            delivery_instructions: o.delivery_instructions || [],
            substitution_preference: o.substitution_preference || "replace",
            delivery_partner: {
              name: "Vikram Jadhav",
              phone: "+91 98221 44552",
              rating: 4.95,
              vehicle_no: "MH 12 TS 3409",
              avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
              current_lat: DEMO_STORE_LOCATION.lat,
              current_lng: DEMO_STORE_LOCATION.lng,
            },
            store_location: o.store_location || DEMO_STORE_LOCATION,
            timeline: [
              { status: "placed", label: "Order Placed", time: "Confirmed", completed: true },
              { status: "confirmed", label: "Order Confirmed", time: "Ready", completed: ["confirmed", "packing", "out_for_delivery", "delivered"].includes(o.status) },
              { status: "packing", label: "Packing at Dark Store", time: "Packed", completed: ["packing", "out_for_delivery", "delivered"].includes(o.status) },
              { status: "out_for_delivery", label: "Out for Delivery", time: "On the way", completed: ["out_for_delivery", "delivered"].includes(o.status) },
              { status: "delivered", label: "Delivered", time: "Doorstep", completed: o.status === "delivered" },
            ],
          }));

          setOrders(mappedOrders);
          if (mappedOrders.length > 0) setActiveOrder(mappedOrders[0]);
        }
      } catch (err) {
        console.warn("Orders fetch failed:", err);
      }
    };

    fetchOrders();

    // Subscribe to Supabase Realtime channel for orders and tracking events
    const channel = client
      .channel("public:orders_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload: any) => {
          if (payload.new) {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, status: payload.new.status } : o))
            );
            setActiveOrder((current) =>
              current && current.id === payload.new.id
                ? { ...current, status: payload.new.status }
                : current
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_tracking_events" },
        (payload: any) => {
          if (payload.new?.current_lat && payload.new?.current_lng) {
            setOrders((prev) =>
              prev.map((o) => {
                if (o.id === payload.new.order_id && o.delivery_partner) {
                  return {
                    ...o,
                    delivery_partner: {
                      ...o.delivery_partner,
                      current_lat: payload.new.current_lat,
                      current_lng: payload.new.current_lng,
                    },
                  };
                }
                return o;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      client.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  const createOrder = async (paymentMethod: Order["payment_method"]) => {
    if (!user) {
      return { success: false, error: "Please log in to place an order" };
    }

    if (cart.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    const orderNumber = "SC-" + Math.floor(10000 + Math.random() * 90000);
    let newOrderId = "ord_" + Date.now();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const customerPhone = user.phone || currentAddress.receiver_phone || "";

    // Insert to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbOrder, error: orderErr } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            user_id: user.id,
            customer_name: user.name || currentAddress.receiver_name || "SuperCart Customer",
            customer_phone: customerPhone,
            delivery_address: currentAddress,
            delivery_slot: deliverySlot,
            scheduled_time: deliverySlot === "scheduled" ? scheduledTime : null,
            delivery_otp: otp,
            payment_method: paymentMethod,
            payment_status: paymentMethod === "cod" ? "pending" : "paid",
            item_total: itemTotal,
            delivery_fee: deliveryFee,
            handling_fee: handlingFee,
            discount: couponDiscount,
            delivery_tip: deliveryTip,
            gst: gstAmount,
            grand_total: grandTotal,
            delivery_instructions: deliveryInstructions,
            substitution_preference: substitutionPreference,
            status: "placed",
            store_location: DEMO_STORE_LOCATION,
          })
          .select("id")
          .single();

        if (!orderErr && dbOrder?.id) {
          newOrderId = dbOrder.id;

          // Insert order items
          await supabase.from("order_items").insert(
            cart.map((item) => ({
              order_id: dbOrder.id,
              product_id: item.product.id,
              name: item.product.name,
              weight: item.product.weight,
              price: item.product.price,
              mrp: item.product.mrp,
              quantity: item.quantity,
              image_url: item.product.image_url,
              status: "packed",
            }))
          );

          // Insert initial tracking event
          await supabase.from("order_tracking_events").insert({
            order_id: dbOrder.id,
            status: "placed",
            label: "Order Placed",
            details: "Order placed and sent to Baner Dark Store",
            current_lat: DEMO_STORE_LOCATION.lat,
            current_lng: DEMO_STORE_LOCATION.lng,
          });
        }
      } catch (e) {
        console.warn("Supabase order insert error:", e);
      }
    }

    const newOrder: Order = {
      id: newOrderId,
      order_number: orderNumber,
      user_id: user.id,
      customer_name: user.name || currentAddress.receiver_name || "SuperCart Customer",
      customer_phone: customerPhone,
      created_at: now.toISOString(),
      status: "placed",
      items: cart.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        weight: item.product.weight,
        price: item.product.price,
        mrp: item.product.mrp,
        quantity: item.quantity,
        image_url: item.product.image_url,
        status: "packed",
      })),
      delivery_address: currentAddress,
      delivery_slot: deliverySlot,
      scheduled_time: deliverySlot === "scheduled" ? scheduledTime : undefined,
      delivery_otp: otp,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "cod" ? "pending" : "paid",
      item_total: itemTotal,
      delivery_fee: deliveryFee,
      handling_fee: handlingFee,
      discount: couponDiscount,
      delivery_tip: deliveryTip,
      gst: gstAmount,
      grand_total: grandTotal,
      delivery_instructions: deliveryInstructions,
      substitution_preference: substitutionPreference,
      delivery_partner: {
        name: "Vikram Jadhav",
        phone: "+91 98221 44552",
        rating: 4.95,
        vehicle_no: "MH 12 TS 3409",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        current_lat: DEMO_STORE_LOCATION.lat,
        current_lng: DEMO_STORE_LOCATION.lng,
      },
      store_location: DEMO_STORE_LOCATION,
      timeline: [
        { status: "placed", label: "Order Placed", time: timeString, completed: true, details: "Order received by SuperCart" },
        { status: "confirmed", label: "Order Confirmed", time: "In 1 min", completed: false },
        { status: "packing", label: "Packing at Dark Store", time: "In 3 mins", completed: false },
        { status: "out_for_delivery", label: "Out for Delivery", time: "In 6 mins", completed: false },
        { status: "delivered", label: "Delivered", time: "In 10 mins", completed: false },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    clearCart();

    return { success: true, orderId: newOrderId, orderNumber };
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
        await supabase.from("order_tracking_events").insert({
          order_id: orderId,
          status: newStatus,
          label: `Status: ${newStatus}`,
          details: `Order updated to ${newStatus} by SuperCart dispatch`,
        });
      } catch (e) {
        console.warn("Supabase status update error:", e);
      }
    }

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const updatedTimeline = ord.timeline.map((step) => {
          if (step.status === newStatus) {
            return { ...step, completed: true, time: now };
          }
          const statusOrder: OrderStatus[] = ["placed", "confirmed", "packing", "out_for_delivery", "delivered"];
          const currIdx = statusOrder.indexOf(step.status);
          const targetIdx = statusOrder.indexOf(newStatus);
          if (currIdx !== -1 && targetIdx !== -1 && currIdx < targetIdx) {
            return { ...step, completed: true };
          }
          return step;
        });

        const mod: Order = {
          ...ord,
          status: newStatus,
          timeline: updatedTimeline,
        };
        if (activeOrder?.id === orderId) {
          setActiveOrder(mod);
        }
        return mod;
      })
    );
  };

  /**
   * "simulate delivery" button in the admin order view that pushes live location updates
   * so tracking can be dynamically demoed on the Leaflet map!
   */
  const simulateDeliveryStep = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        if (!ord.delivery_partner) return ord;

        const customerLat = ord.delivery_address.lat;
        const customerLng = ord.delivery_address.lng;
        const currentLat = ord.delivery_partner.current_lat;
        const currentLng = ord.delivery_partner.current_lng;

        // Move 25% closer towards customer
        const nextLat = currentLat + (customerLat - currentLat) * 0.35;
        const nextLng = currentLng + (customerLng - currentLng) * 0.35;

        const isClose = Math.abs(nextLat - customerLat) < 0.001 && Math.abs(nextLng - customerLng) < 0.001;
        const newStatus = isClose ? "delivered" : "out_for_delivery";

        const updatedPartner = {
          ...ord.delivery_partner,
          current_lat: nextLat,
          current_lng: nextLng,
        };

        const updatedTimeline = ord.timeline.map((step) => {
          if (isClose && step.status === "delivered") {
            return { ...step, completed: true, time: "Just now", details: "Handed over with OTP verification" };
          }
          if (step.status === "out_for_delivery") {
            return { ...step, completed: true, time: "On the way" };
          }
          return step;
        });

        const mod: Order = {
          ...ord,
          status: newStatus,
          delivery_partner: updatedPartner,
          timeline: updatedTimeline,
        };

        if (isSupabaseConfigured && supabase) {
          supabase
            .from("order_tracking_events")
            .insert({
              order_id: orderId,
              status: newStatus,
              label: isClose ? "Order Delivered" : "Partner on the way",
              details: isClose ? "Delivered at doorstep" : "Moving towards customer location",
              current_lat: nextLat,
              current_lng: nextLng,
            })
            .then();

          if (isClose) {
            supabase.from("orders").update({ status: "delivered" }).eq("id", orderId).then();
          }
        }

        if (activeOrder?.id === orderId) {
          setActiveOrder(mod);
        }
        return mod;
      })
    );
  };

  const reorder = (order: Order) => {
    // Re-add items to cart
    order.items.forEach((item) => {
      addToCart({
        id: item.product_id,
        name: item.name,
        brand: "SuperCart",
        category: "staple",
        subcategory: "Essential",
        price: item.price,
        mrp: item.mrp,
        weight: item.weight,
        discount_pct: Math.round(((item.mrp - item.price) / item.mrp) * 100),
        image_url: item.image_url,
        stock: 50,
        rating: 4.8,
        reviews_count: 100,
        eta_minutes: 10,
        is_active: true,
        description: item.name,
        nutrition: {},
        shelf_life: "Fresh",
        tags: ["reorder"],
      }, item.quantity);
    });
  };

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        setActiveOrder,
        createOrder,
        updateOrderStatus,
        simulateDeliveryStep,
        reorder,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};
