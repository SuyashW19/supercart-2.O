import React, { useState } from "react";
import { ArrowLeft, Filter, ArrowUpDown, Check } from "lucide-react";
import { Product, CategoryInfo } from "../../types";
import { CATEGORIES } from "../../data/categories";
import { ProductCard } from "./ProductCard";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface CategoryViewProps {
  categoryId: string;
  onBack: () => void;
  products: Product[];
  categories: CategoryInfo[];
  onOpenDetail?: (product: Product) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categoryId,
  onBack,
  products,
  categories,
  onOpenDetail,
}) => {
  const { language } = useThemeLanguage();
  const category = categories.find((c) => c.id === categoryId) || {
    id: categoryId,
    name: categoryId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    name_hi: categoryId,
    subcategories: [],
  };

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "discount">("featured");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  // Get brands in this category
  const categoryProducts = products.filter((p) => p.category === categoryId);
  const brands = Array.from(new Set(categoryProducts.map((p) => p.brand)));

  let filtered = categoryProducts;
  if (selectedSubcategory !== "all") {
    filtered = filtered.filter((p) => p.subcategory === selectedSubcategory);
  }
  if (selectedBrand !== "all") {
    filtered = filtered.filter((p) => p.brand === selectedBrand);
  }

  // Sorting
  if (sortBy === "price-asc") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (sortBy === "discount") {
    filtered = [...filtered].sort((a, b) => b.discount_pct - a.discount_pct);
  }

  return (
    <div className="w-full space-y-4">
      {/* Category Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {language === "hi" ? category.name_hi : category.name}
            </h1>
            <span className="text-xs text-slate-400">
              {filtered.length} products available in 10 mins
            </span>
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
          >
            <option value="featured">Featured / Best Match</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Discount: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Subcategories & Filters Sidebar on Desktop / Horizontal bar on Mobile */}
        <div className="w-full md:w-56 shrink-0 space-y-4">
          {/* Subcategories */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Subcategories
            </span>
            <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <button
                onClick={() => setSelectedSubcategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left whitespace-nowrap transition-colors ${
                  selectedSubcategory === "all"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                All Subcategories
              </button>
              {(category.subcategories && category.subcategories.length > 0
                ? category.subcategories
                : Array.from(new Set(categoryProducts.map((p) => p.subcategory).filter(Boolean)))
              ).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left whitespace-nowrap transition-colors ${
                    selectedSubcategory === sub
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          {brands.length > 1 && (
            <div className="hidden md:block pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Brands
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedBrand("all")}
                  className={`w-full px-3 py-1 text-xs text-left rounded-md ${
                    selectedBrand === "all" ? "font-bold text-emerald-600" : "text-slate-600"
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`w-full px-3 py-1 text-xs text-left rounded-md ${
                      selectedBrand === b ? "font-bold text-emerald-600" : "text-slate-600"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">No products match current filters.</p>
              <button
                onClick={() => {
                  setSelectedSubcategory("all");
                  setSelectedBrand("all");
                }}
                className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((prod) => (
                <ProductCard key={prod.id} product={prod} onOpenDetail={onOpenDetail} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
