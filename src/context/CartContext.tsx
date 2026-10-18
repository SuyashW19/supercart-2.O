import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Product, Coupon } from "../types";
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE_RATE, STANDARD_DELIVERY_FEE, HANDLING_FEE, GST_RATE } from "../config";
import { AVAILABLE_COUPONS } from "../data/coupons";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: CartItem[];
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (couponCode: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  autoApplyBestCoupon: () => { applied: boolean; message?: string };
  deliveryTip: number;
  setDeliveryTip: (tip: number) => void;
  deliveryInstructions: string[];
  toggleDeliveryInstruction: (instruction: string) => void;
  substitutionPreference: "replace" | "refund";
  setSubstitutionPreference: (pref: "replace" | "refund") => void;
  deliverySlot: "instant" | "scheduled";
  setDeliverySlot: (slot: "instant" | "scheduled") => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  // Computed values
  itemTotal: number;
  mrpTotal: number;
  totalDiscount: number;
  couponDiscount: number;
  deliveryFee: number;
  handlingFee: number;
  gstAmount: number;
  grandTotal: number;
  totalSavings: number;
  amountNeededForFreeDelivery: number;
  freeDeliveryPercentage: number;
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY_CART = "supercart_cart";
const STORAGE_KEY_COUPON = "supercart_applied_coupon";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUPON);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [deliveryTip, setDeliveryTip] = useState<number>(20);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string[]>(["Leave at door"]);
  const [substitutionPreference, setSubstitutionPreference] = useState<"replace" | "refund">("replace");
  const [deliverySlot, setDeliverySlot] = useState<"instant" | "scheduled">("instant");
  const [scheduledTime, setScheduledTime] = useState<string>("Today, 7:00 PM - 8:00 PM");

  // Sync / Merge cart with Supabase on login
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    const client = supabase;

    let isMounted = true;
    const syncCartWithSupabase = async () => {
      try {
        const { data: remoteItems, error } = await client
          .from("cart_items")
          .select("product_id, quantity, products(*)")
          .eq("user_id", user.id);

        if (error) {
          console.warn("Could not fetch remote cart:", error.message);
          return;
        }

        if (!isMounted) return;

        // Merge guest cart with remote cart
        const mergedMap = new Map<string, CartItem>();

        // 1. Add remote items
        if (remoteItems && remoteItems.length > 0) {
          for (const item of remoteItems) {
            const rawProduct: any = item.products;
            const product: Product | undefined = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;
            if (product && product.id) {
              mergedMap.set(item.product_id, {
                product,
                quantity: item.quantity,
              });
            }
          }
        }

        // 2. Merge local items from guest session
        for (const localItem of cart) {
          const existing = mergedMap.get(localItem.product.id);
          if (existing) {
            mergedMap.set(localItem.product.id, {
              product: localItem.product,
              quantity: Math.max(existing.quantity, localItem.quantity),
            });
          } else {
            mergedMap.set(localItem.product.id, localItem);
          }
        }

        const mergedCart = Array.from(mergedMap.values());
        setCart(mergedCart);
        localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(mergedCart));

        // Push merged cart back to Supabase
        if (mergedCart.length > 0) {
          const payload = mergedCart.map((item) => ({
            user_id: user.id,
            product_id: item.product.id,
            quantity: item.quantity,
          }));
          await client.from("cart_items").upsert(payload, { onConflict: "user_id,product_id" });
        }
      } catch (e) {
        console.warn("Cart sync exception:", e);
      }
    };

    syncCartWithSupabase();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(STORAGE_KEY_COUPON, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(STORAGE_KEY_COUPON);
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        updated = [...prev, { product, quantity }];
      }

      // Sync to Supabase if logged in
      if (user && isSupabaseConfigured && supabase) {
        const itemToUpsert = updated.find((it) => it.product.id === product.id);
        if (itemToUpsert) {
          supabase
            .from("cart_items")
            .upsert(
              { user_id: user.id, product_id: product.id, quantity: itemToUpsert.quantity },
              { onConflict: "user_id,product_id" }
            )
            .then();
        }
      }

      return updated;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );

      // Sync to Supabase
      if (user && isSupabaseConfigured && supabase) {
        supabase
          .from("cart_items")
          .upsert(
            { user_id: user.id, product_id: productId, quantity },
            { onConflict: "user_id,product_id" }
          )
          .then();
      }

      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);

      // Delete from Supabase
      if (user && isSupabaseConfigured && supabase) {
        supabase
          .from("cart_items")
          .delete()
          .match({ user_id: user.id, product_id: productId })
          .then();
      }

      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem(STORAGE_KEY_CART);
    localStorage.removeItem(STORAGE_KEY_COUPON);

    // Clear remote cart for logged-in user
    if (user && isSupabaseConfigured && supabase) {
      supabase.from("cart_items").delete().eq("user_id", user.id).then();
    }
  };

  // Calculations
  const itemTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const mrpTotal = cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
  const productDiscount = Math.max(0, mrpTotal - itemTotal);

  // Delivery fee logic (decreased to 0.5% of order item total)
  const isFreeDelivery = itemTotal >= FREE_DELIVERY_THRESHOLD || itemTotal === 0 || appliedCoupon?.code === "FREEDEL";
  const standardDeliveryFee = Math.round(itemTotal * DELIVERY_FEE_RATE * 100) / 100;
  const deliveryFee = itemTotal === 0 ? 0 : isFreeDelivery ? 0 : standardDeliveryFee;
  const handlingFee = itemTotal === 0 ? 0 : HANDLING_FEE;

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon && itemTotal >= appliedCoupon.min_order) {
    if (appliedCoupon.discount_pct > 0) {
      const pctDiscount = (itemTotal * appliedCoupon.discount_pct) / 100;
      couponDiscount = Math.min(pctDiscount, appliedCoupon.max_discount);
    } else {
      couponDiscount = Math.min(appliedCoupon.max_discount, itemTotal);
    }
  }

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = AVAILABLE_COUPONS.find((c) => c.code === cleanCode);
    if (!found) {
      return { success: false, message: "Invalid coupon code" };
    }
    if (itemTotal < found.min_order) {
      return {
        success: false,
        message: `Add ₹${found.min_order - itemTotal} more to apply ${found.code}`,
      };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const autoApplyBestCoupon = () => {
    const eligible = AVAILABLE_COUPONS.filter((c) => itemTotal >= c.min_order);
    if (eligible.length === 0) {
      return { applied: false, message: "No eligible coupon for current order value." };
    }

    // Calculate maximum discount for each
    let bestCoupon: Coupon | null = null;
    let maxSaving = 0;

    for (const c of eligible) {
      let saving = 0;
      if (c.code === "FREEDEL") {
        saving = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : standardDeliveryFee;
      } else if (c.discount_pct > 0) {
        saving = Math.min((itemTotal * c.discount_pct) / 100, c.max_discount);
      } else {
        saving = c.max_discount;
      }

      if (saving > maxSaving) {
        maxSaving = saving;
        bestCoupon = c;
      }
    }

    if (bestCoupon && maxSaving > 0) {
      setAppliedCoupon(bestCoupon);
      return { applied: true, message: `Applied ${bestCoupon.code} - saved ₹${maxSaving}!` };
    }

    return { applied: false, message: "Best coupon already applied." };
  };

  const toggleDeliveryInstruction = (inst: string) => {
    setDeliveryInstructions((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const gstAmount = Math.round(itemTotal * GST_RATE);
  const grandTotal = Math.max(
    0,
    itemTotal - couponDiscount + deliveryFee + handlingFee + deliveryTip + gstAmount
  );
  const totalSavings = productDiscount + couponDiscount + (itemTotal >= FREE_DELIVERY_THRESHOLD ? standardDeliveryFee : 0);

  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - itemTotal);
  const freeDeliveryPercentage = Math.min(100, Math.round((itemTotal / FREE_DELIVERY_THRESHOLD) * 100));
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        autoApplyBestCoupon,
        deliveryTip,
        setDeliveryTip,
        deliveryInstructions,
        toggleDeliveryInstruction,
        substitutionPreference,
        setSubstitutionPreference,
        deliverySlot,
        setDeliverySlot,
        scheduledTime,
        setScheduledTime,
        itemTotal,
        mrpTotal,
        totalDiscount: productDiscount,
        couponDiscount,
        deliveryFee,
        handlingFee,
        gstAmount,
        grandTotal,
        totalSavings,
        amountNeededForFreeDelivery,
        freeDeliveryPercentage,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
