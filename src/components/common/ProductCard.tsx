import React from "react";
import { Plus, Minus, Heart, Clock } from "lucide-react";
import { Product } from "../../types";
import { formatINR } from "../../config";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: Product;
  onOpenDetail?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs hover:shadow-md transition-all duration-200">
      {/* Top row: 10 mins chip & Wishlist */}
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold tracking-wide">
          <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{product.eta_minutes || 10} MINS</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isWishlisted ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Image container */}
      <div
        onClick={() => onOpenDetail?.(product)}
        className="relative cursor-pointer aspect-square w-full mb-2.5 rounded-lg overflow-hidden p-2 bg-slate-50/50 dark:bg-slate-800/40"
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount badge */}
        {product.discount_pct > 0 && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold tracking-tight shadow-xs">
            {product.discount_pct}% OFF
          </div>
        )}
      </div>

      {/* Product metadata */}
      <div className="flex flex-col flex-grow justify-between cursor-pointer" onClick={() => onOpenDetail?.(product)}>
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mb-0.5">
            {product.brand}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug mb-1">
            {product.name}
          </h3>
          <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mb-2">
            {product.weight}
          </div>
        </div>

        {/* Price & Add Stepper Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 line-through tabular-nums">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Stepper / Add Button */}
          {quantity === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="px-3 py-1.5 rounded-lg border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold shadow-xs active:scale-95"
            >
              ADD
            </button>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-2 py-1 shadow-xs"
            >
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="p-0.5 hover:opacity-80 active:scale-90 transition-transform"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-xs font-bold min-w-3 text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="p-0.5 hover:opacity-80 active:scale-90 transition-transform"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
