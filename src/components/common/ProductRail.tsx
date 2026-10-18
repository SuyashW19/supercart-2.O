import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "../../types";
import { ProductCard } from "./ProductCard";

interface ProductRailProps {
  title: string;
  subtitle?: string;
  tag?: string;
  products: Product[];
  isLoading?: boolean;
  onOpenDetail?: (product: Product) => void;
  onViewAll?: () => void;
}

export const ProductRail: React.FC<ProductRailProps> = ({
  title,
  subtitle,
  tag,
  products,
  isLoading = false,
  onOpenDetail,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <section className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-1">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            <div className="h-3 w-60 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-44 sm:w-48 shrink-0 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4 animate-pulse" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2 animate-pulse" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-12 animate-pulse" />
                <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-16 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            {tag && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                {tag}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 mr-2"
            >
              See all
            </button>
          )}
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Rail */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[170px] sm:min-w-[200px] max-w-[200px] shrink-0">
            <ProductCard product={product} onOpenDetail={onOpenDetail} />
          </div>
        ))}
      </div>
    </section>
  );
};
