import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "../types";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { useAuth } from "./AuthContext";

interface WishlistContextType {
  wishlistIds: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("supercart_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync wishlist from Supabase on login
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    let isMounted = true;
    supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0 && isMounted) {
          const ids = data.map((d: any) => d.product_id);
          setWishlistIds(ids);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem("supercart_wishlist", JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = (product: Product) => {
    const isAdding = !wishlistIds.includes(product.id);
    setWishlistIds((prev) =>
      isAdding ? [...prev, product.id] : prev.filter((id) => id !== product.id)
    );

    // Sync to Supabase
    if (user && isSupabaseConfigured && supabase) {
      if (isAdding) {
        supabase.from("wishlist").upsert({ user_id: user.id, product_id: product.id }).then();
      } else {
        supabase
          .from("wishlist")
          .delete()
          .match({ user_id: user.id, product_id: product.id })
          .then();
      }
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
    if (user && isSupabaseConfigured && supabase) {
      supabase
        .from("wishlist")
        .delete()
        .match({ user_id: user.id, product_id: productId })
        .then();
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
