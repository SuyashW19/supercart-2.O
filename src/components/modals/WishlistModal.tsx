import React from "react";
import { X, Bookmark, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Product } from "../../types";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { formatINR } from "../../config";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  onExploreProducts?: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onExploreProducts,
}) => {
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const { addToCart, cart, updateQuantity } = useCart();

  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist"
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Wishlist</h2>
              <p className="text-[11px] text-slate-500">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
          {wishlistedProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bookmark className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Tap the bookmark or heart icon on any grocery item to save it for quick re-ordering!
                </p>
              </div>
              {onExploreProducts && (
                <button
                  onClick={() => {
                    onClose();
                    onExploreProducts();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Explore Catalog
                </button>
              )}
            </div>
          ) : (
            wishlistedProducts.map((prod) => {
              const inCart = cart.find((item) => item.product.id === prod.id);

              return (
                <div key={prod.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div
                    onClick={() => {
                      onSelectProduct?.(prod);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{prod.weight}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {formatINR(prod.price)}
                        </span>
                        {prod.mrp > prod.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatINR(prod.mrp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inCart ? (
                      <div className="flex items-center bg-emerald-600 text-white rounded-xl overflow-hidden shadow-xs">
                        <button
                          onClick={() => updateQuantity(prod.id, inCart.quantity - 1)}
                          className="px-2.5 py-1 text-xs font-black hover:bg-emerald-700"
                        >
                          -
                        </button>
                        <span className="px-1 text-xs font-black tabular-nums">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(prod.id, inCart.quantity + 1)}
                          className="px-2.5 py-1 text-xs font-black hover:bg-emerald-700"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}

                    <button
                      onClick={() => removeFromWishlist(prod.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
