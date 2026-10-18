import React, { createContext, useContext, useState, useEffect } from "react";
import { NotificationItem } from "../types";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (title: string, message: string, type?: "order" | "promo" | "wallet") => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    title: "⚡ Order Out for Delivery!",
    message: "Ramesh is 4 mins away with your fresh dairy & snacks order SC-98214.",
    timestamp: "Just now",
    read: false,
    type: "order",
  },
  {
    id: "notif_2",
    title: "🎉 ₹50 Cashback Credited",
    message: "SuperCart Wallet received ₹50 cashback on your last order.",
    timestamp: "2 hours ago",
    read: false,
    type: "wallet",
  },
  {
    id: "notif_3",
    title: "🔥 Flash Sale: Amul Butter & Ghee",
    message: "Up to 15% off on Amul and Aashirvaad staples today only.",
    timestamp: "Yesterday",
    read: true,
    type: "promo",
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem("supercart_notifications");
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sync from Supabase on login + Realtime
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    const client = supabase;
    let isMounted = true;

    client
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0 && isMounted) {
          const mapped: NotificationItem[] = data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            read: n.is_read,
            type: n.type || "order",
          }));
          setNotifications(mapped);
        }
      });

    const channel = client
      .channel("public:notifications_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => {
          if (payload.new && payload.new.user_id === user.id) {
            const newItem: NotificationItem = {
              id: payload.new.id,
              title: payload.new.title,
              message: payload.new.message,
              timestamp: "Just now",
              read: false,
              type: payload.new.type || "order",
            };
            setNotifications((prev) => [newItem, ...prev]);
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
    localStorage.setItem("supercart_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (user && isSupabaseConfigured && supabase) {
      supabase.from("notifications").update({ is_read: true }).eq("id", id).then();
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user && isSupabaseConfigured && supabase) {
      supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).then();
    }
  };

  const addNotification = (title: string, message: string, type: "order" | "promo" | "wallet" = "order") => {
    const newNotif: NotificationItem = {
      id: "notif_" + Date.now(),
      title,
      message,
      timestamp: "Just now",
      read: false,
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (user && isSupabaseConfigured && supabase) {
      supabase.from("notifications").insert({
        user_id: user.id,
        title,
        message,
        type,
        is_read: false,
      }).then();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isNotificationOpen,
        setIsNotificationOpen,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
