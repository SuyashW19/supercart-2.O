import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  List,
  Bookmark,
  Apple,
  Milk,
  Wheat,
  Cookie,
  GlassWater,
  Coffee,
  Candy,
  Soup,
  Flame,
  Sparkles,
  HeartPulse,
  Baby,
  PawPrint,
  ShoppingBag,
  X,
  ChevronRight,
  Info,
} from "lucide-react";
import { CategoryInfo, Product } from "../../types";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useWishlist } from "../../context/WishlistContext";
import { formatINR, FREE_DELIVERY_THRESHOLD } from "../../config";

interface CategoryGridProps {
  categories: CategoryInfo[];
  products?: Product[];
  isLoading?: boolean;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onSearchSelectProduct?: (product: Product) => void;
  onOpenWishlist?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Apple,
  Milk,
  Wheat,
  Cookie,
  GlassWater,
  Coffee,
  Candy,
  Soup,
  Flame,
  Sparkles,
  HeartPulse,
  Baby,
  PawPrint,
  ShoppingBag,
};

// Search placeholders rotating every 3 seconds as required
const ROTATING_SEARCH_PLACEHOLDERS = [
  "Search for 'Atta'",
  "Search for 'Milk'",
  "Search for 'Paneer'",
  "Search for 'Biscuits'",
];

// Target titled sections in order
const SECTION_ORDER = [
  "Grocery & Kitchen",
  "Snacks & Drinks",
  "Household & Lifestyle",
  "Beauty & Personal Care",
];

// Category to default section mapping
const CATEGORY_SECTION_MAP: Record<string, string> = {
  "fruits-vegetables": "Grocery & Kitchen",
  "dairy-bread-eggs": "Grocery & Kitchen",
  "atta-rice-dal": "Grocery & Kitchen",
  "masala-oil-dry-fruits": "Grocery & Kitchen",
  "tea-coffee-beverages": "Grocery & Kitchen",
  "instant-frozen-food": "Grocery & Kitchen",
  "snacks-munchies": "Snacks & Drinks",
  "sweets-chocolates": "Snacks & Drinks",
  "cold-drinks-juices": "Snacks & Drinks",
  "cleaning-household": "Household & Lifestyle",
  "pet-care": "Household & Lifestyle",
  "personal-care": "Beauty & Personal Care",
  "baby-care": "Beauty & Personal Care",
};

// Soft tint backgrounds for tile items
const TINT_PALETTE: Record<string, string> = {
  "fruits-vegetables": "bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-100 dark:border-emerald-900/40",
  "dairy-bread-eggs": "bg-amber-50/80 dark:bg-amber-950/25 border-amber-100 dark:border-amber-900/40",
  "atta-rice-dal": "bg-orange-50/80 dark:bg-orange-950/25 border-orange-100 dark:border-orange-900/40",
  "masala-oil-dry-fruits": "bg-red-50/80 dark:bg-red-950/25 border-red-100 dark:border-red-900/40",
  "tea-coffee-beverages": "bg-stone-50/80 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800",
  "instant-frozen-food": "bg-yellow-50/80 dark:bg-yellow-950/25 border-yellow-100 dark:border-yellow-900/40",
  "snacks-munchies": "bg-orange-50/80 dark:bg-orange-950/25 border-orange-100 dark:border-orange-900/40",
  "sweets-chocolates": "bg-pink-50/80 dark:bg-pink-950/25 border-pink-100 dark:border-pink-900/40",
  "cold-drinks-juices": "bg-cyan-50/80 dark:bg-cyan-950/25 border-cyan-100 dark:border-cyan-900/40",
  "cleaning-household": "bg-teal-50/80 dark:bg-teal-950/25 border-teal-100 dark:border-teal-900/40",
  "pet-care": "bg-indigo-50/80 dark:bg-indigo-950/25 border-indigo-100 dark:border-indigo-900/40",
  "personal-care": "bg-rose-50/80 dark:bg-rose-950/25 border-rose-100 dark:border-rose-900/40",
  "baby-care": "bg-sky-50/80 dark:bg-sky-950/25 border-sky-100 dark:border-sky-900/40",
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  products = [],
  isLoading = false,
  selectedCategory,
  onSelectCategory,
  onSearchSelectProduct,
  onOpenWishlist,
}) => {
  const { language } = useThemeLanguage();
  const { wishlistIds } = useWishlist();

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Free delivery bottom strip dismissible per session
  const [isFreeDeliveryDismissed, setIsFreeDeliveryDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("supercart_free_delivery_dismissed") === "true";
    } catch {
      return false;
    }
  });

  // Track categories that have no product photos and no custom image_url
  const categoriesNeedingPhotos = useMemo(() => {
    return categories
      .filter((cat) => {
        if (cat.image_url) return false;
        const catProds = products.filter(
          (p) => p.category === cat.id || p.category_id === cat.id
        );
        return catProds.length === 0;
      })
      .map((c) => c.name);
  }, [categories, products]);

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleDismissFreeDelivery = () => {
    setIsFreeDeliveryDismissed(true);
    try {
      sessionStorage.setItem("supercart_free_delivery_dismissed", "true");
    } catch (e) {
      console.warn("Session storage error:", e);
    }
  };

  // Group categories into titled sections
  const groupedSections = useMemo(() => {
    const map = new Map<string, CategoryInfo[]>();

    // Initialize in order
    SECTION_ORDER.forEach((sec) => map.set(sec, []));

    // Distribute categories
    categories.forEach((cat) => {
      const section =
        cat.section || CATEGORY_SECTION_MAP[cat.id] || "Grocery & Kitchen";
      if (!map.has(section)) {
        map.set(section, []);
      }
      map.get(section)!.push(cat);
    });

    // Sort each section by sort_order
    map.forEach((list, key) => {
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    });

    return Array.from(map.entries()).filter(([_, list]) => list.length > 0);
  }, [categories]);

  // Search dropdown results
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [searchQuery, products]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-6 w-52 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/50 dark:border-slate-800"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-7">
      {/* ============================================================== */}
      {/* 1. SEARCH BAR AT THE TOP (SPEC PART 2)                         */}
      {/* ============================================================== */}
      <div className="relative flex items-center gap-2 sm:gap-3">
        {/* Rounded search input with thin border and search icon on the right */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={ROTATING_SEARCH_PLACEHOLDERS[placeholderIndex]}
            className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm rounded-2xl border border-slate-200/90 dark:border-slate-800 focus:border-emerald-500 focus:outline-hidden transition-all shadow-xs"
          />

          {/* Search Icon at the right */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <Search className="w-4 h-4 pointer-events-none" />
          </div>

          {/* Quick search instant dropdown */}
          {isSearchFocused && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-150 p-2 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSearchSelectProduct?.(p);
                    setIsSearchFocused(false);
                    setSearchQuery("");
                  }}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-10 h-10 object-contain rounded-lg bg-slate-50 dark:bg-slate-800 p-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{p.weight}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                    {formatINR(p.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Small list icon button */}
        <button
          type="button"
          onClick={() => {
            // Scroll to the first category section
            const firstSec = document.getElementById("category-section-0");
            firstSec?.scrollIntoView({ behavior: "smooth" });
          }}
          title="Browse category directory"
          aria-label="Category list"
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-xs shrink-0 flex items-center justify-center"
        >
          <List className="w-5 h-5" />
        </button>

        {/* Square bookmark (wishlist) button */}
        <button
          type="button"
          onClick={() => onOpenWishlist?.()}
          title="Open Wishlist"
          aria-label="Wishlist"
          className="relative p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-xs shrink-0 flex items-center justify-center"
        >
          <Bookmark className="w-5 h-5 fill-slate-200 dark:fill-slate-800 text-slate-600 dark:text-slate-300" />
          {wishlistIds.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {wishlistIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Categories needing photos informative card if any category is missing imagery */}
      {categoriesNeedingPhotos.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Photos needed for:</strong> {categoriesNeedingPhotos.join(", ")}. Upload custom tile photos in the Admin Portal or seed items to auto-generate mini-shelves.
          </span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TITLED SECTIONS (SPEC PART 2)                               */}
      {/* ============================================================== */}
      <div className="space-y-8 sm:space-y-10">
        {groupedSections.map(([sectionTitle, secCategories], sIdx) => (
          <div key={sectionTitle} id={`category-section-${sIdx}`} className="space-y-3 sm:space-y-4">
            {/* Bold, large, left-aligned section title */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight text-left">
                {sectionTitle}
              </h2>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                {secCategories.length} categories
              </span>
            </div>

            {/* 4-column grid on mobile (6 to 8 columns on desktop) */}
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
              {secCategories.map((cat) => {
                const iconKey = cat.icon_name || cat.iconName || "ShoppingBag";
                const Icon = ICON_MAP[iconKey] || ShoppingBag;
                const tintClasses =
                  TINT_PALETTE[cat.id] ||
                  "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800";

                // Cluster of 3 to 4 real product photos of that category
                const catProducts = products
                  .filter((p) => p.category === cat.id || p.category_id === cat.id)
                  .slice(0, 4);

                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className="flex flex-col items-center text-center group cursor-pointer focus:outline-hidden"
                  >
                    {/* Rounded-2xl tile with soft tinted background */}
                    <div
                      className={`relative w-full aspect-square rounded-2xl ${tintClasses} border flex items-center justify-center p-2 overflow-hidden shadow-2xs group-hover:shadow-md group-hover:scale-[1.03] active:scale-95 transition-all duration-200`}
                    >
                      {/* Priority 1: Supabase categories.image_url if uploaded */}
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform"
                        />
                      ) : catProducts.length >= 2 ? (
                        /* Priority 2: Cluster of 3 to 4 real product photos centred inside (mini-shelf) */
                        <div className="relative w-full h-full flex items-center justify-center">
                          {catProducts.length >= 3 ? (
                            /* 3-4 Product Mini Shelf layout */
                            <div className="grid grid-cols-2 gap-1 w-full h-full p-0.5 items-center justify-items-center">
                              {catProducts.slice(0, 4).map((prod, pIdx) => (
                                <div
                                  key={prod.id || pIdx}
                                  className="w-full h-full flex items-center justify-center"
                                >
                                  <img
                                    src={prod.image_url}
                                    alt={prod.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="max-h-7 sm:max-h-9 max-w-full object-contain filter drop-shadow-xs group-hover:scale-110 transition-transform"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* 2 products cluster */
                            <div className="flex items-center justify-center gap-1 w-full h-full">
                              {catProducts.map((prod) => (
                                <img
                                  key={prod.id}
                                  src={prod.image_url}
                                  alt={prod.name}
                                  loading="lazy"
                                  className="h-10 sm:h-12 w-1/2 object-contain filter drop-shadow-xs"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Priority 3: Neutral tile with category icon */
                        <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.6]" />
                        </div>
                      )}
                    </div>

                    {/* Category name in medium weight, centred, up to 2 lines */}
                    <span className="font-medium text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 text-center line-clamp-2 leading-tight mt-1.5 px-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {language === "hi" && cat.name_hi ? cat.name_hi : cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* 3. STICKY SLIM STRIP AT BOTTOM (SPEC PART 2)                   */}
      {/* ============================================================== */}
      {!isFreeDeliveryDismissed && (
        <aside
          role="region"
          aria-label="Delivery offer"
          className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-emerald-50 dark:bg-emerald-950/95 border-t border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100 shadow-lg px-4 py-2 transition-all animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold tracking-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                FREE DELIVERY on orders above {formatINR(FREE_DELIVERY_THRESHOLD)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDismissFreeDelivery}
              aria-label="Dismiss delivery offer"
              className="p-1 text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
