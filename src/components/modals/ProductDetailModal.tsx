import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Clock,
  Heart,
  Star,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  ZoomIn,
  MessageSquare,
  Send,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Product } from "../../types";
import { formatINR } from "../../config";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { supabase, isSupabaseConfigured } from "../../services/supabase";
import { ProductImage } from "../common/ProductImage";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  allProducts: Product[];
  onSelectSimilar: (p: Product) => void;
}

interface ReviewItem {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  allProducts,
  onSelectSimilar,
}) => {
  const { user } = useAuth();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!product) return;
    setActiveImageIndex(0);
    setIsZoomOpen(false);

    // Initial mock reviews
    const fallbackReviews: ReviewItem[] = [
      {
        id: "rev-1",
        user_name: "Pooja Sharma",
        rating: 5,
        comment: "Always fresh and delivered in under 8 minutes in Baner! High quality packaging.",
        created_at: "Yesterday",
      },
      {
        id: "rev-2",
        user_name: "Anand Kulkarni",
        rating: 4,
        comment: "Genuine product with fresh batch date. SuperCart is faster than going to the local store.",
        created_at: "3 days ago",
      },
    ];

    setReviews(fallbackReviews);

    // Fetch from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setReviews(data as ReviewItem[]);
          }
        });
    }
  }, [product?.id]);

  if (!product) return null;

  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = isInWishlist(product.id);

  // Alternate gallery images
  const galleryImages = [
    product.image_url,
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=500&auto=format&fit=crop&q=80",
  ];

  // Frequently bought bundle
  const frequentlyBought = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 2);

  const variants = [
    { label: product.weight, price: product.price, mrp: product.mrp },
    { label: "Economy Pack (x2)", price: Math.round(product.price * 1.9), mrp: Math.round(product.mrp * 2) },
  ];

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);

    const newRev: ReviewItem = {
      id: "rev-" + Date.now(),
      user_name: user?.name || "SuperCart Shopper",
      rating: newRating,
      comment: newComment.trim(),
      created_at: "Just now",
    };

    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("reviews").insert({
          product_id: product.id,
          user_id: user.id,
          user_name: user.name || "SuperCart Shopper",
          rating: newRating,
          comment: newComment.trim(),
        });
      } catch (err) {
        console.warn("Review insert error:", err);
      }
    }

    setReviews([newRev, ...reviews]);
    setNewComment("");
    setIsSubmittingReview(false);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close product details"
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 backdrop-blur-xs shadow-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gallery Left with Zoom & Thumbnails */}
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden p-6 flex items-center justify-center border border-slate-100 dark:border-slate-800 group">
                <ProductImage
                  src={galleryImages[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-300"
                />

                {/* Zoom Trigger Button */}
                <button
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md hover:bg-white flex items-center gap-1 text-[11px] font-bold"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom</span>
                </button>

                {product.discount_pct > 0 && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-xs">
                    {product.discount_pct}% OFF
                  </div>
                )}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white dark:bg-slate-800 shadow-md text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>

              {/* Thumbnail strip */}
              <div className="flex items-center gap-2 mt-3 w-full justify-center">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-12 rounded-xl border p-1 bg-white dark:bg-slate-800 overflow-hidden transition-all ${
                      activeImageIndex === idx
                        ? "border-emerald-600 ring-2 ring-emerald-600/30"
                        : "border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>

              {/* Delivery ETA guarantee */}
              <div className="mt-3 w-full p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 flex items-center justify-between text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>10-Minute Delivery</span>
                </div>
                <span>SuperCart Dark Store</span>
              </div>
            </div>

            {/* Product Meta & Purchase Module Right */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {product.brand}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug mb-2">
                  {product.name}
                </h1>

                {/* Rating badge & shelf life */}
                <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{product.rating}</span>
                    <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
                  </div>
                  <span className="text-slate-400">·</span>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Shelf Life: {product.shelf_life || "Fresh Dispatch"}</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {formatINR(variants[selectedVariant].price)}
                  </span>
                  {variants[selectedVariant].mrp > variants[selectedVariant].price && (
                    <span className="text-sm text-slate-400 line-through tabular-nums">
                      {formatINR(variants[selectedVariant].mrp)}
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-600">
                    Inclusive of all taxes
                  </span>
                </div>

                {/* Pack Size Variants */}
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Select Pack Size:
                  </label>
                  <div className="flex gap-2">
                    {variants.map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(idx)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all text-left ${
                          selectedVariant === idx
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="font-semibold">{v.label}</div>
                        <div className="text-slate-500 tabular-nums">{formatINR(v.price)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {product.description}
                </p>
              </div>

              {/* Contiguous Buy / Stepper CTA */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Price</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatINR(variants[selectedVariant].price * (quantity || 1))}
                  </span>
                </div>

                {quantity === 0 ? (
                  <button
                    onClick={() => addToCart(product)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO CART</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-emerald-600 text-white rounded-xl px-3 py-1.5 shadow-md">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="p-1 hover:opacity-80 active:scale-90"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold min-w-5 text-center tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="p-1 hover:opacity-80 active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nutrition Facts Table */}
          {product.nutrition && Object.keys(product.nutrition).length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Nutritional Values (Approx. per serve)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(product.nutrition).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">{key}</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews & Feedback Section */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Customer Ratings & Reviews ({reviews.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {product.rating} out of 5
              </span>
            </div>

            {/* Write a review form */}
            <form onSubmit={handlePostReview} className="mb-5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                Rate this grocery item:
              </span>
              <div className="flex items-center gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= newRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-500 ml-2">
                  {newRating} / 5 Stars
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your feedback (e.g. fresh quality, great packaging)..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-emerald-600"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>Post</span>
                </button>
              </div>

              {reviewSuccess && (
                <div className="text-[11px] text-emerald-600 font-semibold mt-2">
                  ✓ Review submitted successfully!
                </div>
              )}
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {rev.user_name}
                    </span>
                    <span className="text-[10px] text-slate-400">{rev.created_at}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Bought Together Bundle */}
          {frequentlyBought.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Frequently Bought Together
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold">Smart Cart Bundle</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 object-contain bg-white rounded-lg p-1 border"
                  />
                  <span className="font-bold text-slate-400 text-lg">+</span>
                  {frequentlyBought.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectSimilar(item)}
                      className="cursor-pointer flex items-center gap-2 hover:opacity-80"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 object-contain bg-white rounded-lg p-1 border"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    addToCart(product);
                    frequentlyBought.forEach((p) => addToCart(p));
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all shrink-0"
                >
                  Add Bundle to Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Zoom Lightbox Modal */}
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={galleryImages[activeImageIndex]}
            alt={product.name}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
