/**
 * SuperCart - 10-Minute Grocery Delivery App
 * Production-ready quick-commerce web app for India
 */

import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LocationProvider, useLocation } from "./context/LocationContext";
import { CartProvider, useCart } from "./context/CartContext";
import { OrderProvider, useOrders } from "./context/OrderContext";
import { ThemeLanguageProvider, useThemeLanguage } from "./context/ThemeLanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { WishlistProvider } from "./context/WishlistContext";

import { APP_NAME, GSTIN } from "./config";
import { Product, Order, CategoryInfo, BannerInfo } from "./types";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { autoSeedSupabase } from "./lib/seedData";

// Components
import { Header } from "./components/common/Header";
import { MobileBottomNav } from "./components/common/MobileBottomNav";
import { PromoCarousel } from "./components/common/PromoCarousel";
import { CategoryGrid } from "./components/common/CategoryGrid";
import { ProductRail } from "./components/common/ProductRail";
import { CategoryView } from "./components/common/CategoryView";
import { CartDrawer } from "./components/cart/CartDrawer";
import { LocationModal } from "./components/modals/LocationModal";
import { ProductDetailModal } from "./components/modals/ProductDetailModal";
import { WishlistModal } from "./components/modals/WishlistModal";

// Pages
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import { OrdersPage } from "./pages/OrdersPage";
import { InvoiceModal } from "./pages/InvoiceModal";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { WalletPage } from "./pages/WalletPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { ProfilePage } from "./pages/ProfilePage";

import {
  Sparkles,
  Zap,
  RotateCcw,
  ShoppingBag,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function mapDbProduct(row: any): Product {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    name_hi: row.name_hi || undefined,
    brand: String(row.brand || ""),
    category: String(row.category_id || row.category || "fruits-vegetables"),
    category_id: String(row.category_id || row.category || "fruits-vegetables"),
    subcategory: String(row.subcategory || "General"),
    price: Number(row.price || 0),
    mrp: Number(row.mrp || row.price || 0),
    weight: String(row.weight || "1 unit"),
    discount_pct: Number(row.discount_pct || 0),
    image_url: String(
      row.image_url ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80"
    ),
    stock: Number(row.stock || 0),
    rating: Number(row.rating || 4.8),
    reviews_count: Number(row.reviews_count || 0),
    eta_minutes: Number(row.eta_minutes || 10),
    is_active: row.is_active !== false,
    description: String(row.description || ""),
    nutrition: typeof row.nutrition === "object" && row.nutrition ? row.nutrition : {},
    shelf_life: row.shelf_life || "Fresh",
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

function MainContent() {
  const { user } = useAuth();
  const { currentAddress, serviceability, setIsLocationModalOpen } = useLocation();
  const { orders, getOrderById } = useOrders();
  const { language, t } = useThemeLanguage();

  // Catalog State - Exclusively from Supabase (Never mock fallbacks)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [banners, setBanners] = useState<BannerInfo[]>([]);

  // Loading and Error States
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  // Page Routing State
  const [currentPage, setCurrentPage] = useState<
    | "home"
    | "category"
    | "checkout"
    | "order-success"
    | "order-tracking"
    | "orders"
    | "admin"
    | "auth"
    | "wallet"
    | "help"
    | "profile"
  >("home");

  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string>("");
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [dismissHighDemand, setDismissHighDemand] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  const getDefaultCategorySection = (catId: string): string => {
    switch (catId) {
      case "fruits-vegetables":
      case "dairy-bread-eggs":
      case "atta-rice-dal":
      case "masala-oil-dry-fruits":
      case "tea-coffee-beverages":
      case "instant-frozen-food":
        return "Grocery & Kitchen";
      case "snacks-munchies":
      case "sweets-chocolates":
      case "cold-drinks-juices":
        return "Snacks & Drinks";
      case "cleaning-household":
      case "pet-care":
        return "Household & Lifestyle";
      case "personal-care":
      case "baby-care":
        return "Beauty & Personal Care";
      default:
        return "Grocery & Kitchen";
    }
  };

  // Fetch all catalog items from Supabase
  const fetchCatalogFromSupabase = useCallback(async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);

    try {
      if (!isSupabaseConfigured || !supabase) {
        setCatalogError("Supabase client is not configured. Check environment credentials.");
        setIsLoadingCatalog(false);
        return;
      }

      // 1. Fetch Products
      // We query without hardcoding .eq("is_active", true) at SQL level to be fully resilient
      // if columns are being added/migrated in Supabase. Filtering is safely done in JavaScript.
      const { data: prodData, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (prodErr) {
        console.error("Supabase products fetch failed:", prodErr);
        setCatalogError(`Database query failed: ${prodErr.message}`);
      } else {
        const mappedProds = (prodData || [])
          .filter((row: any) => row.is_active !== false)
          .map(mapDbProduct);
        setProducts(mappedProds);
      }

      // 2. Fetch Categories with subcategories
      const { data: catData, error: catErr } = await supabase
        .from("categories")
        .select("*, subcategories(*)");

      if (!catErr && catData) {
        const sortedCats = [...catData].sort(
          (a: any, b: any) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0)
        );
        const mappedCats: CategoryInfo[] = sortedCats
          .filter((c: any) => c.is_active !== false)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            name_hi: c.name_hi,
            iconName: c.icon_name || c.icon || "ShoppingBag",
            icon_name: c.icon_name || c.icon || "ShoppingBag",
            color: c.color,
            section: c.section || getDefaultCategorySection(c.id),
            image_url: c.image_url || undefined,
            sort_order: c.sort_order ?? c.display_order ?? 0,
            is_active: c.is_active !== false,
            subcategories: (c.subcategories || [])
              .filter((s: any) => s.is_active !== false)
              .sort((a: any, b: any) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0))
              .map((s: any) => s.name),
          }));
        setCategories(mappedCats);
      }

      // 3. Fetch Banners
      const { data: banData } = await supabase
        .from("banners")
        .select("*");

      if (banData) {
        const sortedBanners = [...banData]
          .filter((b: any) => b.is_active !== false)
          .sort((a: any, b: any) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0));
        setBanners(sortedBanners as BannerInfo[]);
      }
    } catch (err: any) {
      console.error("Catalog exception:", err);
      setCatalogError(err?.message || "Failed to connect to database");
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCatalogFromSupabase();
  }, [fetchCatalogFromSupabase]);

  // REALTIME SUBSCRIPTION ON PRODUCTS & CATEGORIES TABLES
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const prodChannel = supabase
      .channel("public:products_live_sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        (payload: any) => {
          if (payload.new) {
            const mapped = mapDbProduct(payload.new);
            setProducts((prev) => {
              if (prev.some((p) => p.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload: any) => {
          if (payload.new) {
            const mapped = mapDbProduct(payload.new);
            setProducts((prev) => prev.map((p) => (p.id === mapped.id ? mapped : p)));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "products" },
        (payload: any) => {
          if (payload.old) {
            setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const catChannel = supabase
      .channel("public:categories_live_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          fetchCatalogFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(prodChannel);
      supabase.removeChannel(catChannel);
    };
  }, [fetchCatalogFromSupabase]);

  // Helper to trigger database seeding directly from the app
  const handleTriggerAutoSeed = async () => {
    if (!supabase) return;
    setIsSeeding(true);
    setSeedSuccessMsg(null);
    setCatalogError(null);

    const res = await autoSeedSupabase(supabase);
    setIsSeeding(false);

    if (res.success) {
      setSeedSuccessMsg(res.message);
      await fetchCatalogFromSupabase();
    } else {
      setCatalogError(res.message);
    }
  };

  // Admin Catalog Handlers wired to Supabase
  const handleAddProduct = async (newProd: Product) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Supabase client not configured" };
    }
    try {
      const payload: Record<string, any> = {
        id: newProd.id,
        name: newProd.name,
        name_hi: newProd.name_hi || null,
        brand: newProd.brand,
        category_id: newProd.category,
        subcategory: newProd.subcategory,
        price: newProd.price,
        mrp: newProd.mrp,
        weight: newProd.weight,
        discount_pct: newProd.discount_pct,
        image_url: newProd.image_url,
        stock: newProd.stock,
        rating: newProd.rating || 4.8,
        reviews_count: newProd.reviews_count || 0,
        eta_minutes: newProd.eta_minutes || 10,
        is_active: newProd.is_active ?? true,
        description: newProd.description || "",
        nutrition: newProd.nutrition || {},
        shelf_life: newProd.shelf_life || "Fresh",
        tags: newProd.tags || [],
      };

      let { error } = await supabase.from("products").insert(payload);
      if (error && error.code === "42703") {
        // Automatically drop undefined columns and retry
        const cleanPayload = { ...payload };
        const missingMatch = error.message.match(/column "?([a-zA-Z0-9_]+)"? does not exist/);
        if (missingMatch && missingMatch[1]) {
          delete cleanPayload[missingMatch[1]];
        } else {
          delete cleanPayload.is_active;
          delete cleanPayload.nutrition;
          delete cleanPayload.eta_minutes;
        }
        const retryRes = await supabase.from("products").insert(cleanPayload);
        error = retryRes.error;
      }

      if (error) {
        return { success: false, error: error.message };
      }
      setProducts((prev) => [newProd, ...prev]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to add product" };
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Supabase client not configured" };
    }
    try {
      const payload: Record<string, any> = {
        name: updated.name,
        name_hi: updated.name_hi || null,
        brand: updated.brand,
        category_id: updated.category,
        subcategory: updated.subcategory,
        price: updated.price,
        mrp: updated.mrp,
        weight: updated.weight,
        discount_pct: updated.discount_pct,
        image_url: updated.image_url,
        stock: updated.stock,
        is_active: updated.is_active ?? true,
        description: updated.description || "",
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase.from("products").update(payload).eq("id", updated.id);
      if (error && error.code === "42703") {
        const cleanPayload = { ...payload };
        const missingMatch = error.message.match(/column "?([a-zA-Z0-9_]+)"? does not exist/);
        if (missingMatch && missingMatch[1]) {
          delete cleanPayload[missingMatch[1]];
        } else {
          delete cleanPayload.is_active;
        }
        const retryRes = await supabase.from("products").update(cleanPayload).eq("id", updated.id);
        error = retryRes.error;
      }

      if (error) {
        return { success: false, error: error.message };
      }
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update product" };
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Supabase client not configured" };
    }
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) {
        return { success: false, error: error.message };
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete product" };
    }
  };

  // Product Rails Data dynamically filtered from Supabase products
  const bestSellers = products.filter((p) => p.tags.includes("bestseller") || p.rating >= 4.85).slice(0, 10);
  const freshArrivals = products.filter((p) => p.category === "fruits-vegetables" || p.category === "dairy-bread-eggs").slice(0, 10);
  const dealsOfTheDay = products.filter((p) => p.discount_pct >= 15).slice(0, 10);
  const quickSnacks = products.filter((p) => p.category === "snacks-munchies" || p.category === "cold-drinks-juices").slice(0, 10);

  const handleOpenDetail = (prod: Product) => {
    setDetailProduct(prod);
  };

  const handleCategoryClick = (catId: string) => {
    if (!catId) {
      setSelectedCategory("");
      setCurrentPage("home");
    } else {
      setSelectedCategory(catId);
      setCurrentPage("category");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* GLOBAL HEADER */}
      <Header
        onOpenAuth={() => setCurrentPage("auth")}
        onOpenAdmin={() => setCurrentPage("admin")}
        onOpenWallet={() => setCurrentPage("wallet")}
        onOpenOrders={() => setCurrentPage("orders")}
        onOpenProfile={() => setCurrentPage("profile")}
        onOpenSavedAddresses={() => setIsLocationModalOpen(true)}
        onOpenInvoices={() => {
          if (orders.length > 0) {
            setActiveInvoiceOrder(orders[0]);
          } else {
            setCurrentPage("orders");
          }
        }}
        onOpenWishlist={() => setIsWishlistModalOpen(true)}
        onSearchSelectProduct={(p) => setDetailProduct(p)}
        products={products}
      />

      {/* High demand alert notification */}
      {!dismissHighDemand && serviceability.isServiceable && (
        <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto flex items-center gap-2 font-medium">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {t(
                "high_demand_alert",
                "High demand in your area: Additional electric fleet deployed to ensure sub-10 minute doorstep delivery!"
              )}
            </span>
          </div>
          <button
            onClick={() => setDismissHighDemand(true)}
            className="text-amber-800 dark:text-amber-300 font-bold hover:opacity-80 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: HOME PAGE */}
        {currentPage === "home" && (
          <div className="space-y-8">
            {/* Promo Carousel */}
            <PromoCarousel
              banners={banners}
              isLoading={isLoadingCatalog}
              onSelectCategory={handleCategoryClick}
            />

            {/* Error Banner with Retry */}
            {catalogError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{catalogError}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchCatalogFromSupabase}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            )}

            {/* Seeding success alert */}
            {seedSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{seedSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setSeedSuccessMsg(null)}
                  className="text-xs font-bold text-emerald-700 hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Empty State when Database has 0 Products */}
            {!isLoadingCatalog && !catalogError && products.length === 0 && (
              <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    Database is Empty (0 Products in Supabase)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Your frontend is connected to Supabase, but the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-emerald-600">products</code> table has no records yet.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleTriggerAutoSeed}
                    disabled={isSeeding}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSeeding ? "Seeding Database..." : "Auto-Seed 150+ Products Now"}</span>
                  </button>

                  <button
                    onClick={fetchCatalogFromSupabase}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* Category Grid */}
            <CategoryGrid
              categories={categories}
              products={products}
              isLoading={isLoadingCatalog}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryClick}
              onSearchSelectProduct={(p) => setDetailProduct(p)}
              onOpenWishlist={() => setIsWishlistModalOpen(true)}
            />

            {/* Product Rail: Best Sellers */}
            {(isLoadingCatalog || bestSellers.length > 0) && (
              <ProductRail
                title={language === "hi" ? "सबसे ज्यादा बिकने वाले सामान" : "Best Sellers in 10 Mins"}
                subtitle="Staples, milk, bread & essentials ordered right now"
                tag="FASTEST"
                products={bestSellers}
                isLoading={isLoadingCatalog}
                onOpenDetail={handleOpenDetail}
                onViewAll={() => handleCategoryClick("dairy-bread-eggs")}
              />
            )}

            {/* Product Rail: Deals of the Day */}
            {(isLoadingCatalog || dealsOfTheDay.length > 0) && (
              <ProductRail
                title={language === "hi" ? "आज के बेहतरीन ऑफर्स" : "Deals of the Day"}
                subtitle="Up to 30% OFF on pantry staples, oils and chocolates"
                tag="MAX SAVINGS"
                products={dealsOfTheDay}
                isLoading={isLoadingCatalog}
                onOpenDetail={handleOpenDetail}
                onViewAll={() => handleCategoryClick("masala-oil-dry-fruits")}
              />
            )}

            {/* Product Rail: Fresh Farm Produce */}
            {(isLoadingCatalog || freshArrivals.length > 0) && (
              <ProductRail
                title={language === "hi" ? "ताज़ा फल और सब्ज़ियां" : "Fresh Farm Produce"}
                subtitle="Sourced this morning from local Nashik and Pune farms"
                tag="ORGANIC"
                products={freshArrivals}
                isLoading={isLoadingCatalog}
                onOpenDetail={handleOpenDetail}
                onViewAll={() => handleCategoryClick("fruits-vegetables")}
              />
            )}

            {/* Product Rail: Evening Snacks */}
            {(isLoadingCatalog || quickSnacks.length > 0) && (
              <ProductRail
                title={language === "hi" ? "चाय-नाश्ता और स्नैक्स" : "Evening Snacks & Cold Drinks"}
                subtitle="Haldiram's bhujia, biscuits, colas & chips"
                tag="CHAI TIME"
                products={quickSnacks}
                isLoading={isLoadingCatalog}
                onOpenDetail={handleOpenDetail}
                onViewAll={() => handleCategoryClick("snacks-munchies")}
              />
            )}
          </div>
        )}

        {/* VIEW 2: CATEGORY VIEW */}
        {currentPage === "category" && (
          <CategoryView
            categoryId={selectedCategory}
            onBack={() => {
              setSelectedCategory("");
              setCurrentPage("home");
            }}
            products={products}
            categories={categories}
            onOpenDetail={handleOpenDetail}
          />
        )}

        {/* VIEW 3: CHECKOUT */}
        {currentPage === "checkout" && (
          <CheckoutPage
            onBack={() => setCurrentPage("home")}
            onOpenAuth={() => {
              setPostLoginRedirect("checkout");
              setCurrentPage("auth");
            }}
            onOrderSuccess={(orderId) => {
              setActiveTrackingOrderId(orderId);
              setCurrentPage("order-success");
            }}
          />
        )}

        {/* VIEW 4: ORDER SUCCESS */}
        {currentPage === "order-success" && (
          <OrderSuccessPage
            orderId={activeTrackingOrderId}
            onTrackOrder={(orderId) => {
              setActiveTrackingOrderId(orderId);
              setCurrentPage("order-tracking");
            }}
            onContinueShopping={() => setCurrentPage("home")}
          />
        )}

        {/* VIEW 5: ORDER TRACKING */}
        {currentPage === "order-tracking" && (
          <OrderTrackingPage
            orderId={activeTrackingOrderId}
            onBack={() => setCurrentPage("home")}
            onViewInvoice={(orderId) => {
              const ord = getOrderById(orderId);
              if (ord) setActiveInvoiceOrder(ord);
            }}
          />
        )}

        {/* VIEW 6: MY ORDERS */}
        {currentPage === "orders" && (
          <OrdersPage
            onBack={() => setCurrentPage("home")}
            onTrackOrder={(orderId) => {
              setActiveTrackingOrderId(orderId);
              setCurrentPage("order-tracking");
            }}
            onViewInvoice={(orderId) => {
              const ord = getOrderById(orderId);
              if (ord) setActiveInvoiceOrder(ord);
            }}
            onHelp={() => setCurrentPage("help")}
          />
        )}

        {/* VIEW 7: ADMIN PORTAL */}
        {currentPage === "admin" && (
          <AdminPage
            onBack={() => setCurrentPage("home")}
            products={products}
            categories={categories}
            onRefreshData={fetchCatalogFromSupabase}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {/* VIEW 8: AUTHENTICATION */}
        {currentPage === "auth" && (
          <AuthPage
            onBack={() => {
              setPostLoginRedirect(null);
              setCurrentPage("home");
            }}
            onSuccess={() => {
              if (postLoginRedirect === "checkout") {
                setPostLoginRedirect(null);
                setCurrentPage("checkout");
              } else {
                setCurrentPage("home");
              }
            }}
          />
        )}

        {/* VIEW 9: WALLET & REWARDS */}
        {currentPage === "wallet" && (
          <WalletPage onBack={() => setCurrentPage("home")} />
        )}

        {/* VIEW 10: HELP CENTER */}
        {currentPage === "help" && (
          <HelpCenterPage onBack={() => setCurrentPage("home")} />
        )}

        {/* VIEW 11: PROFILE & ACCOUNT */}
        {currentPage === "profile" && (
          <ProfilePage
            onBack={() => setCurrentPage("home")}
            onOpenOrders={() => setCurrentPage("orders")}
            onOpenWallet={() => setCurrentPage("wallet")}
            onOpenHelp={() => setCurrentPage("help")}
            onOpenAdmin={() => setCurrentPage("admin")}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white text-base">
              ⚡ {APP_NAME}
            </span>
            <span>· 10-Minute Grocery Delivery across India</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setCurrentPage("home")} className="hover:text-emerald-600">Home</button>
            <button onClick={() => setCurrentPage("orders")} className="hover:text-emerald-600">Orders</button>
            <button onClick={() => setCurrentPage("wallet")} className="hover:text-emerald-600">Wallet</button>
            <button onClick={() => setCurrentPage("profile")} className="hover:text-emerald-600 font-medium">My Account</button>
            <button onClick={() => setCurrentPage("help")} className="hover:text-emerald-600">Help & Support</button>
            <button onClick={() => setCurrentPage("admin")} className="hover:text-emerald-600">Admin Portal</button>
          </div>

          <div className="text-[11px] text-slate-400">
            GSTIN: {GSTIN} · FSSAI Certified · {new Date().getFullYear()} {APP_NAME} Technologies Pvt. Ltd.
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav
        currentTab={currentPage}
        onSelectTab={(tab) => {
          if (tab === "home") {
            setCurrentPage("home");
            setSelectedCategory("");
          } else if (tab === "categories") {
            setSelectedCategory(categories[0]?.id || "dairy-bread-eggs");
            setCurrentPage("category");
          }
        }}
        onOpenOrders={() => setCurrentPage("orders")}
        onOpenAuth={() => setCurrentPage("auth")}
        onOpenProfile={() => setCurrentPage("profile")}
      />

      {/* GLOBAL MODALS & DRAWERS */}
      <CartDrawer
        onProceedToCheckout={() => setCurrentPage("checkout")}
        onOpenAuth={() => {
          setPostLoginRedirect("checkout");
          setCurrentPage("auth");
        }}
      />

      <LocationModal />

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        allProducts={products}
        onSelectSimilar={(p) => setDetailProduct(p)}
      />

      <InvoiceModal
        order={activeInvoiceOrder}
        onClose={() => setActiveInvoiceOrder(null)}
      />

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        products={products}
        onSelectProduct={(p) => setDetailProduct(p)}
        onExploreProducts={() => {
          setSelectedCategory("");
          setCurrentPage("home");
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <OrderProvider>
            <ThemeLanguageProvider>
              <NotificationProvider>
                <WishlistProvider>
                  <MainContent />
                </WishlistProvider>
              </NotificationProvider>
            </ThemeLanguageProvider>
          </OrderProvider>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
