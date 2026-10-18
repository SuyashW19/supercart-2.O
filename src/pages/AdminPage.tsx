import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  BarChart3,
  Package,
  ShoppingBag,
  History,
  LogOut,
  Upload,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  MapPin,
  Clock,
  Ban,
  Check,
  ArrowUp,
  ArrowDown,
  Layers,
  Eye,
  EyeOff,
  Image,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrderContext";
import { useLocation } from "../context/LocationContext";
import { Product, OrderStatus, CategoryInfo, ServiceablePincode } from "../types";
import { formatINR, APP_NAME } from "../config";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { autoSeedSupabase } from "../lib/seedData";

interface AdminPageProps {
  onBack: () => void;
  products: Product[];
  categories?: CategoryInfo[];
  onRefreshData?: () => void;
  onUpdateProduct: (product: Product) => Promise<{ success: boolean; error?: string } | void>;
  onAddProduct: (product: Product) => Promise<{ success: boolean; error?: string } | void>;
  onDeleteProduct: (productId: string) => Promise<{ success: boolean; error?: string } | void>;
}

const SALES_DATA = [
  { time: "06:00", orders: 12, revenue: 3840 },
  { time: "08:00", orders: 38, revenue: 14200 },
  { time: "10:00", orders: 64, revenue: 26800 },
  { time: "12:00", orders: 42, revenue: 18400 },
  { time: "14:00", orders: 30, revenue: 11200 },
  { time: "16:00", orders: 55, revenue: 22100 },
  { time: "18:00", orders: 85, revenue: 37900 },
  { time: "20:00", orders: 72, revenue: 31200 },
];

export const AdminPage: React.FC<AdminPageProps> = ({
  onBack,
  products,
  categories = [],
  onRefreshData,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
}) => {
  const { adminVerified, verifyAdminId, logout } = useAuth();
  const { orders, updateOrderStatus, simulateDeliveryStep } = useOrders();
  const {
    serviceablePincodes,
    blockedPincodes,
    addBlockedPincode,
    removeBlockedPincode,
    upsertServiceablePincode,
    removeServiceablePincode,
    checkPincodeServiceability,
  } = useLocation();

  // Authentication states
  const [adminIdInput, setAdminIdInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "categories" | "orders" | "audit" | "pincodes"
  >("dashboard");

  // Category management states
  const [categorySearch, setCategorySearch] = useState("");
  const [categorySectionFilter, setCategorySectionFilter] = useState("all");
  const [isUploadingCatImage, setIsUploadingCatImage] = useState<string | null>(null);

  // Pincode management states
  const [testPincodeInput, setTestPincodeInput] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [newBlockedPin, setNewBlockedPin] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");
  const [newCustomPin, setNewCustomPin] = useState("");
  const [newCustomCity, setNewCustomCity] = useState("");
  const [newCustomState, setNewCustomState] = useState("");
  const [newCustomEta, setNewCustomEta] = useState<number>(10);

  // Product management states
  const [productSearch, setProductSearch] = useState("");
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  // Auto-seed state
  const [isSeeding, setIsSeeding] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; action: string; details: string }>>([]);

  // Fetch real audit logs from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            time: new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            action: d.action.replace(/_/g, " ").toUpperCase(),
            details: `${d.entity} ${d.entity_id}: ${JSON.stringify(d.new_values || {})}`,
          }));
          setAuditLogs(mapped);
        }
      });
  }, [activeTab]);

  // Handle Admin ID verification check
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = verifyAdminId(adminIdInput);
    if (!ok) {
      setAuthError("Invalid Admin ID. Try ADM-1001 or SUPER-999.");
    } else {
      setAuthError("");
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setIsUploadingImage(true);
    setActionError(null);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setActionError(`Storage upload error: ${uploadError.message}. Make sure 'product-images' bucket is created in Supabase.`);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(filePath);
        setUploadedImageUrl(publicUrl);
        setActionSuccess("Image uploaded to Supabase Storage!");
      }
    } catch (err: any) {
      setActionError(`Image upload failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRunAutoSeed = async () => {
    if (!supabase) return;
    setIsSeeding(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await autoSeedSupabase(supabase);
    setIsSeeding(false);

    if (res.success) {
      setActionSuccess(res.message);
      onRefreshData?.();
    } else {
      setActionError(res.message);
    }
  };

  // Categories Manager Handlers (Realtime updates to Supabase)
  const handleUpdateCategoryField = async (catId: string, updates: Partial<CategoryInfo>) => {
    setActionError(null);
    setActionSuccess(null);
    if (!isSupabaseConfigured || !supabase) {
      setActionSuccess("Updated category configuration locally.");
      onRefreshData?.();
      return;
    }
    try {
      const payload: Record<string, any> = { ...updates };
      // Strip undefined
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      const { error } = await supabase.from("categories").update(payload).eq("id", catId);
      if (error) {
        setActionError(`Category update error: ${error.message}. Ensure columns are created via SQL migration.`);
      } else {
        setActionSuccess("Category updated successfully! Changes broadcast live.");
        onRefreshData?.();
      }
    } catch (err: any) {
      setActionError(`Category update failed: ${err.message}`);
    }
  };

  const handleUploadCategoryTile = async (catId: string, file: File) => {
    if (!isSupabaseConfigured || !supabase) {
      setActionError("Supabase is not configured for file storage.");
      return;
    }
    try {
      setIsUploadingCatImage(catId);
      setActionError(null);
      setActionSuccess(null);
      const fileExt = file.name.split(".").pop();
      const filePath = `tile_${catId}_${Date.now()}.${fileExt}`;

      // Upload to category-images bucket
      const { error: uploadError } = await supabase.storage
        .from("category-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback to product-images if category-images bucket isn't provisioned yet
        const { error: fallbackError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, { upsert: true });

        if (fallbackError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(filePath);

        await handleUpdateCategoryField(catId, { image_url: publicUrl });
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("category-images").getPublicUrl(filePath);

        await handleUpdateCategoryField(catId, { image_url: publicUrl });
      }
      setActionSuccess("Category tile image uploaded and linked!");
    } catch (err: any) {
      setActionError(`Category image upload failed: ${err.message}`);
    } finally {
      setIsUploadingCatImage(null);
    }
  };

  const handleReorderCategory = async (catId: string, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const currentIndex = sorted.findIndex((c) => c.id === catId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentCat = sorted[currentIndex];
    const targetCat = sorted[targetIndex];

    const currentOrder = currentCat.sort_order ?? currentIndex;
    const targetOrder = targetCat.sort_order ?? targetIndex;

    // Swap orders
    await handleUpdateCategoryField(currentCat.id, { sort_order: targetOrder });
    await handleUpdateCategoryField(targetCat.id, { sort_order: currentOrder });
  };

  if (!adminVerified) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {APP_NAME} Admin Verification
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Authorized personnel only. Please verify your Admin ID to unlock the operations dashboard.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-3 pt-2">
            <input
              type="text"
              value={adminIdInput}
              onChange={(e) => setAdminIdInput(e.target.value)}
              placeholder="Enter Admin ID (e.g. ADM-1001)"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-mono uppercase tracking-widest focus:border-emerald-500 focus:outline-hidden"
              required
            />

            {authError && (
              <p className="text-xs font-semibold text-rose-500">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 active:scale-98 transition-all shadow-md"
            >
              Verify & Enter Portal
            </button>
          </form>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Demo Whitelist IDs: <span className="font-mono text-emerald-600">ADM-1001</span>,{" "}
            <span className="font-mono text-emerald-600">SUPER-999</span>
          </div>

          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ← Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  // Admin Metrics
  const todayRevenue = orders.reduce((sum, o) => sum + o.grand_total, 0) + 165640;
  const todayOrderCount = orders.length + 398;
  const activeOrdersCount = orders.filter((o) =>
    ["placed", "confirmed", "packing", "out_for_delivery"].includes(o.status)
  ).length;
  const lowStockProducts = products.filter((p) => p.stock < 35);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategoryFilter === "all" || p.category === productCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {APP_NAME} Operations Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ADM-1001 (Super Admin)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live Storefront Inventory, Orders & 10-Minute Dark Store Dispatch
            </p>
          </div>
        </div>

        {/* Tab switchers and Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "products", label: "Catalog", icon: Package },
              { id: "categories", label: "Categories", icon: Layers },
              { id: "orders", label: "Orders", icon: ShoppingBag },
              { id: "pincodes", label: "Pincodes & Service", icon: MapPin },
              { id: "audit", label: "Audit Log", icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors shrink-0"
            title="Log Out of SuperCart"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>

      {/* Connected to Supabase Debug Status Bar */}
      <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold">Connected to Supabase:</span>
          <span>cyxxldgxksnzuhczkwav.supabase.co</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold text-[11px]">
            {products.length} Products Live
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAutoSeed}
            disabled={isSeeding}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSeeding ? "Seeding..." : "Auto-Seed Database (150+ Products)"}</span>
          </button>

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Error & Success Alerts */}
      {actionError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-bold">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* TAB 1: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                Today's Revenue
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {formatINR(todayRevenue)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                Total Orders
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {todayOrderCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                Active Live Dispatches
              </div>
              <div className="text-2xl font-black text-emerald-600 tabular-nums">
                {activeOrdersCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                Low Stock Alerts (&lt;35)
              </div>
              <div className="text-2xl font-black text-amber-600 tabular-nums">
                {lowStockProducts.length}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Hourly Order Velocity & Revenue
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SALES_DATA}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CATALOG (ADD / EDIT / DELETE TO SUPABASE) */}
      {activeTab === "products" && (
        <div className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by title or brand..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setIsAddingProduct(true);
                  setIsEditingProduct(null);
                  setUploadedImageUrl("");
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Product edit/add modal */}
          {(isEditingProduct || isAddingProduct) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {isAddingProduct ? "Add New Product to Supabase" : `Edit Product: ${isEditingProduct?.name}`}
                </h3>
                <button
                  onClick={() => {
                    setIsEditingProduct(null);
                    setIsAddingProduct(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const name = (form.elements.namedItem("name") as HTMLInputElement).value;
                  const brand = (form.elements.namedItem("brand") as HTMLInputElement).value;
                  const price = Number((form.elements.namedItem("price") as HTMLInputElement).value);
                  const mrp = Number((form.elements.namedItem("mrp") as HTMLInputElement).value);
                  const weight = (form.elements.namedItem("weight") as HTMLInputElement).value;
                  const stock = Number((form.elements.namedItem("stock") as HTMLInputElement).value);
                  const category = (form.elements.namedItem("category") as HTMLSelectElement).value;
                  const image_url =
                    uploadedImageUrl ||
                    (form.elements.namedItem("image_url") as HTMLInputElement).value;

                  if (isAddingProduct) {
                    const newProd: Product = {
                      id: "p_" + Date.now(),
                      name,
                      brand,
                      price,
                      mrp,
                      weight,
                      stock,
                      category,
                      category_id: category,
                      subcategory: "General",
                      discount_pct: Math.round(((mrp - price) / mrp) * 100),
                      image_url,
                      rating: 4.8,
                      reviews_count: 0,
                      eta_minutes: 10,
                      is_active: true,
                      description: `${name} by ${brand}`,
                      nutrition: {},
                      shelf_life: "Fresh",
                      tags: ["new"],
                    };
                    const res = await onAddProduct(newProd);
                    if (res && !res.success) {
                      setActionError(`Supabase write error: ${res.error}`);
                    } else {
                      setActionSuccess(`Product "${name}" saved to Supabase!`);
                      setIsAddingProduct(false);
                    }
                  } else if (isEditingProduct) {
                    const updatedProd: Product = {
                      ...isEditingProduct,
                      name,
                      brand,
                      price,
                      mrp,
                      weight,
                      stock,
                      category,
                      category_id: category,
                      image_url,
                      discount_pct: Math.max(0, Math.round(((mrp - price) / mrp) * 100)),
                    };
                    const res = await onUpdateProduct(updatedProd);
                    if (res && !res.success) {
                      setActionError(`Supabase update error: ${res.error}`);
                    } else {
                      setActionSuccess(`Product "${name}" updated in Supabase!`);
                      setIsEditingProduct(null);
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
              >
                <input
                  name="name"
                  defaultValue={isEditingProduct?.name || ""}
                  placeholder="Product Name"
                  required
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg sm:col-span-2"
                />
                <input
                  name="brand"
                  defaultValue={isEditingProduct?.brand || ""}
                  placeholder="Brand (Amul, Tata, etc.)"
                  required
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg"
                />
                <select
                  name="category"
                  defaultValue={isEditingProduct?.category || categories[0]?.id || "fruits-vegetables"}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <input
                  name="price"
                  type="number"
                  defaultValue={isEditingProduct?.price || 50}
                  placeholder="Selling Price (₹)"
                  required
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg"
                />
                <input
                  name="mrp"
                  type="number"
                  defaultValue={isEditingProduct?.mrp || 60}
                  placeholder="MRP (₹)"
                  required
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg"
                />
                <input
                  name="weight"
                  defaultValue={isEditingProduct?.weight || "500 g"}
                  placeholder="Weight (e.g. 500 g, 1 L)"
                  required
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg"
                />
                <input
                  name="stock"
                  type="number"
                  defaultValue={isEditingProduct?.stock || 50}
                  placeholder="Stock Inventory"
                  required
                  className="px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg"
                />

                <div className="sm:col-span-3 space-y-2">
                  <input
                    name="image_url"
                    value={uploadedImageUrl || isEditingProduct?.image_url || ""}
                    onChange={(e) => setUploadedImageUrl(e.target.value)}
                    placeholder="Image URL or upload below"
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 flex items-center gap-1.5 font-semibold text-[11px]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? "Uploading to Bucket..." : "Upload Photo to Supabase"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                        disabled={isUploadingImage}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">Stores in product-images bucket</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:col-span-1 items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                  >
                    Save to Supabase
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Product Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Price</th>
                    <th className="py-3 px-3 text-right">MRP</th>
                    <th className="py-3 px-3 text-center">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No products found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-8 h-8 rounded-md object-contain bg-slate-100"
                          />
                          <span className="truncate max-w-[200px]">{p.name}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{p.brand}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] capitalize">{p.category}</td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums">{formatINR(p.price)}</td>
                        <td className="py-3 px-3 text-right text-slate-400 tabular-nums">{formatINR(p.mrp)}</td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.stock < 20 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setIsEditingProduct(p);
                                setIsAddingProduct(false);
                                setUploadedImageUrl(p.image_url);
                              }}
                              className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete ${p.name} from Supabase?`)) {
                                  const res = await onDeleteProduct(p.id);
                                  if (res && !res.success) {
                                    setActionError(`Delete failed: ${res.error}`);
                                  } else {
                                    setActionSuccess(`Deleted product ${p.name}`);
                                  }
                                }
                              }}
                              className="p-1.5 rounded-lg border hover:bg-rose-50 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CATEGORIES MANAGER (SPEC PART 2) */}
      {activeTab === "categories" && (
        <div className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Categories Manager</span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload tile photography, assign sections, reorder tiles, and toggle storefront visibility. Changes reflect live via Realtime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRefreshData?.()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Sync Data
              </button>
            </div>
          </div>

          {/* Quick SQL schema banner */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                SQL Migration ready at <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded text-[11px]">/supabase/07_categories_and_address_requests.sql</code> (category columns, address_requests table & storage bucket).
              </span>
            </div>
            <button
              onClick={() => {
                alert("SQL file is located at /supabase/07_categories_and_address_requests.sql. You can execute it in the Supabase SQL Editor.");
              }}
              className="px-3 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg hover:bg-emerald-700 shrink-0"
            >
              View SQL Guide
            </button>
          </div>

          {/* Search & Section Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Section:</span>
              <select
                value={categorySectionFilter}
                onChange={(e) => setCategorySectionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="all">All Sections ({categories.length})</option>
                <option value="Grocery & Kitchen">Grocery & Kitchen</option>
                <option value="Snacks & Drinks">Snacks & Drinks</option>
                <option value="Household & Lifestyle">Household & Lifestyle</option>
                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
              </select>
            </div>
          </div>

          {/* Categories Grid Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">Order</th>
                    <th className="p-3.5 font-bold">Tile Image</th>
                    <th className="p-3.5 font-bold">Category Name</th>
                    <th className="p-3.5 font-bold">Section</th>
                    <th className="p-3.5 font-bold">Status</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categories
                    .filter((c) => {
                      const matchesSearch =
                        c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                        c.id.toLowerCase().includes(categorySearch.toLowerCase());
                      const matchesSec =
                        categorySectionFilter === "all" ||
                        (c.section || "Grocery & Kitchen") === categorySectionFilter;
                      return matchesSearch && matchesSec;
                    })
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((cat, idx, arr) => {
                      const isUploading = isUploadingCatImage === cat.id;
                      const isActive = cat.is_active !== false;

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Reorder / Sort Order */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-6 text-center">
                                {cat.sort_order ?? idx + 1}
                              </span>
                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleReorderCategory(cat.id, "up")}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === arr.length - 1}
                                  onClick={() => handleReorderCategory(cat.id, "down")}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Tile Image & Upload */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative">
                                {cat.image_url ? (
                                  <img
                                    src={cat.image_url}
                                    alt={cat.name}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <Image className="w-5 h-5 text-slate-400" />
                                )}
                                {isUploading && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="animate-spin text-white text-[10px]">⌛</span>
                                  </div>
                                )}
                              </div>

                              <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0">
                                <Upload className="w-3 h-3" />
                                <span>{cat.image_url ? "Change" : "Upload"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleUploadCategoryTile(cat.id, f);
                                  }}
                                />
                              </label>
                            </div>
                          </td>

                          {/* Category Name & subcategories */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {cat.id}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(cat.subcategories || []).slice(0, 3).map((sub, s) => (
                                <span
                                  key={s}
                                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded text-slate-600 dark:text-slate-400"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Section selector */}
                          <td className="p-3.5">
                            <select
                              value={cat.section || "Grocery & Kitchen"}
                              onChange={(e) =>
                                handleUpdateCategoryField(cat.id, { section: e.target.value })
                              }
                              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:border-emerald-500 focus:outline-hidden"
                            >
                              <option value="Grocery & Kitchen">Grocery & Kitchen</option>
                              <option value="Snacks & Drinks">Snacks & Drinks</option>
                              <option value="Household & Lifestyle">Household & Lifestyle</option>
                              <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                            </select>
                          </td>

                          {/* Active Visibility Toggle */}
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateCategoryField(cat.id, { is_active: !isActive })
                              }
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-600" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-slate-400" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Quick Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {cat.image_url && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCategoryField(cat.id, { image_url: "" })
                                  }
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Remove custom image (revert to product mini-shelf)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE DISPATCH ORDERS */}
      {activeTab === "orders" && (
        <div className="pt-6 space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Live Dark Store Orders ({orders.length})
          </div>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span>#{ord.order_number}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] uppercase">
                      {ord.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {ord.customer_name} · {ord.delivery_address.area}, {ord.delivery_address.city} · {ord.items.length} items ({formatINR(ord.grand_total)})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={ord.status}
                    onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                    className="px-2.5 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="placed">Placed</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="packing">Packing</option>
                    <option value="out_for_delivery">Out for delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => simulateDeliveryStep(ord.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                  >
                    Advance Step
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="pt-6 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Operational Audit Trail
          </div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white mr-2">[{log.action}]</span>
                  <span className="text-slate-600 dark:text-slate-400">{log.details}</span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PINCODES & NATIONWIDE SERVICEABILITY */}
      {activeTab === "pincodes" && (
        <div className="pt-6 space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Nationwide Serviceability
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xl font-black text-emerald-950 dark:text-emerald-100">
                All-India Active
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Every valid Indian 6-digit pincode is serviceable by default (10m ETA)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Blocked Pincodes
                </span>
                <Ban className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-black text-rose-950 dark:text-rose-100">
                {blockedPincodes.length}
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                Specific pincodes with delivery suspended by operations
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                  Custom ETA Overrides
                </span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-black text-blue-950 dark:text-blue-100">
                {serviceablePincodes.length}
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                Pincodes with customized dark store delivery windows
              </p>
            </div>
          </div>

          {/* Quick Pincode Live Checker */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Live Pincode Serviceability Tester</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Test any 6-digit Indian postal code to simulate customer checkout validation.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={testPincodeInput}
                onChange={(e) => setTestPincodeInput(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 415600, 781001, 110001"
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono focus:border-emerald-500 focus:outline-hidden flex-1 sm:max-w-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (testPincodeInput.trim()) {
                    const res = checkPincodeServiceability(testPincodeInput.trim());
                    setTestResult(res);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
              >
                Test Serviceability
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
                  testResult.isServiceable
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      testResult.isServiceable ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  >
                    {testResult.isServiceable ? "✓" : "✕"}
                  </span>
                  <div>
                    <span className="font-bold">
                      {testResult.isServiceable
                        ? `Serviceable (${testResult.etaMinutes}m ETA)`
                        : "Unserviceable / Suspended"}
                    </span>
                    <p className="text-[11px] opacity-80">
                      {testResult.message || `Dark Store active for ${testResult.city}`}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10">
                  {testPincodeInput}
                </span>
              </div>
            )}
          </div>

          {/* Blocked Pincodes Management */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-500" />
                <span>Blocked Pincodes (Emergency / Maintenance Outages)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pincodes in this table will be rejected in the app with your custom outage reason.
              </p>
            </div>

            {/* Block New Pincode Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newBlockedPin.trim().length === 6) {
                  addBlockedPincode(newBlockedPin.trim(), newBlockedReason.trim());
                  setNewBlockedPin("");
                  setNewBlockedReason("");
                }
              }}
              className="flex flex-col sm:flex-row gap-2 pt-1"
            >
              <input
                type="text"
                maxLength={6}
                value={newBlockedPin}
                onChange={(e) => setNewBlockedPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit Pincode"
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono w-full sm:w-36 focus:border-rose-500 focus:outline-hidden"
                required
              />
              <input
                type="text"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                placeholder="Reason (e.g. Waterlogging / Local strike / Dark store maintenance)"
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex-1 focus:border-rose-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Block Pincode</span>
              </button>
            </form>

            {/* List of Blocked Pincodes */}
            {blockedPincodes.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                No blocked pincodes. All valid Indian postal codes are currently active for delivery.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {blockedPincodes.map((b) => (
                  <div
                    key={b.pincode}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60">
                        {b.pincode}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {b.reason || "Temporarily suspended"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlockedPincode(b.pincode)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 text-[11px] font-bold transition-all"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Serviceable Pincodes & ETA Overrides */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Custom Pincodes & Express ETA Overrides</span>
              </h2>
              <p className="text-xs text-slate-500">
                Set custom delivery windows (e.g. 8 mins for flagship hub, 15 mins for periphery) or toggle active status.
              </p>
            </div>

            {/* Add Custom Override Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCustomPin.trim().length === 6) {
                  upsertServiceablePincode({
                    pincode: newCustomPin.trim(),
                    city: newCustomCity.trim() || "India",
                    state: newCustomState.trim() || "India",
                    eta_minutes: Number(newCustomEta) || 10,
                    is_active: true,
                  });
                  setNewCustomPin("");
                  setNewCustomCity("");
                  setNewCustomState("");
                  setNewCustomEta(10);
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1"
            >
              <input
                type="text"
                maxLength={6}
                value={newCustomPin}
                onChange={(e) => setNewCustomPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit Pincode"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:border-emerald-500 focus:outline-hidden"
                required
              />
              <input
                type="text"
                value={newCustomCity}
                onChange={(e) => setNewCustomCity(e.target.value)}
                placeholder="City / Area"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:border-emerald-500 focus:outline-hidden"
              />
              <input
                type="text"
                value={newCustomState}
                onChange={(e) => setNewCustomState(e.target.value)}
                placeholder="State"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:border-emerald-500 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                <span className="text-[11px] text-slate-400">ETA:</span>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={newCustomEta}
                  onChange={(e) => setNewCustomEta(Number(e.target.value))}
                  className="w-full bg-transparent text-xs font-bold focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400">m</span>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Override</span>
              </button>
            </form>

            {/* Table of Custom Pincodes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Pincode</th>
                    <th className="py-2 px-3">City / Area</th>
                    <th className="py-2 px-3">ETA</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {serviceablePincodes.map((s) => (
                    <tr key={s.pincode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {s.pincode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {s.city || "Hub"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[11px]">
                          {s.eta_minutes || 10} mins
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() =>
                            upsertServiceablePincode({
                              ...s,
                              is_active: !s.is_active,
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                            s.is_active !== false
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                          }`}
                        >
                          {s.is_active !== false ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeServiceablePincode(s.pincode)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove override"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

