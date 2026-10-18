import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  X,
  User,
  Crown,
  ChevronRight,
  Package,
  MapPin,
  FileText,
  Bookmark,
  Wallet,
  Tag,
  Gift,
  MessageSquareQuote,
  Info,
  Send,
  Settings,
  LogOut,
  Moon,
  Sun,
  Globe,
  Bell,
  Trash2,
  Check,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useCart } from "../../context/CartContext";
import { formatINR, APP_NAME } from "../../config";

interface SettingsMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onOpenOrders: () => void;
  onOpenSavedAddresses: () => void;
  onOpenInvoices: () => void;
  onOpenWishlist: () => void;
}

type MenuView = "main" | "settings" | "about" | "feedback" | "coupons" | "refer";

export const SettingsMenuDrawer: React.FC<SettingsMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenAuth,
  onOpenWallet,
  onOpenOrders,
  onOpenSavedAddresses,
  onOpenInvoices,
  onOpenWishlist,
}) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, language, setLanguage, t } = useThemeLanguage();
  const { clearCart } = useCart();

  const [activeView, setActiveView] = useState<MenuView>("main");

  // Settings subpage state
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyPromos, setNotifyPromos] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Reset to main menu when opening
  useEffect(() => {
    if (isOpen) {
      setActiveView("main");
      setShowDeleteConfirm(false);
      setFeedbackSent(false);
    }
  }, [isOpen]);

  // Keyboard navigation & Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeView !== "main") {
          setActiveView("main");
        } else {
          onClose();
        }
      }

      // Tab trap
      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeView, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Logout handler: clears session, cart, cached data, redirects to home and forces page refresh
  const handleLogout = async () => {
    try {
      clearCart();
      await logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn("Storage clear error:", e);
      }
      onClose();
      window.location.href = "/";
      window.location.reload();
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      clearCart();
      await logout();
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Delete account error:", e);
    } finally {
      window.location.href = "/";
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation and settings menu"
      className="fixed inset-0 z-[100] overflow-hidden"
    >
      {/* Dark backdrop overlay covering the whole screen above everything else */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
        aria-hidden="true"
      />

      {/* Drawer Panel: Slides in from the LEFT side, 320px wide (max-w-[85vw] on mobile), fills full viewport height */}
      <div
        ref={drawerRef}
        className="fixed top-0 bottom-0 left-0 h-full w-[320px] max-w-[85vw] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col z-[101] transform transition-transform duration-300 ease-out animate-in slide-in-from-left overflow-hidden border-r border-slate-200/80 dark:border-slate-800"
      >
        {/* TOP BAR / HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            {activeView !== "main" ? (
              <button
                onClick={() => setActiveView("main")}
                className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Back to main menu"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}

            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
              {activeView === "main"
                ? "Menu"
                : activeView === "settings"
                ? "Settings"
                : activeView === "about"
                ? "About SuperCart"
                : activeView === "feedback"
                ? "Send Feedback"
                : activeView === "coupons"
                ? "Coupons & Offers"
                : "Refer & Earn"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT AREA: fills full viewport height, scrolls internally */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5">
          {/* ============================================================== */}
          {/* VIEW 1: MAIN MENU                                              */}
          {/* ============================================================== */}
          {activeView === "main" && (
            <>
              {/* 1. PROFILE CARD */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                {user ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name || "User"}
                          className="w-13 h-13 rounded-full object-cover shrink-0 shadow-md ring-2 ring-emerald-500/30"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-full bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                          {user.name || "SuperCart User"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.phone || user.email || "Member"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenProfile();
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Edit profile</span>
                      <span>▸</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Welcome to {APP_NAME}
                        </h3>
                        <p className="text-xs text-slate-500">Sign in for saved addresses & fast checkout</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all shrink-0"
                    >
                      Login / Sign up
                    </button>
                  </div>
                )}
              </div>

              {/* 2. WALLET & REWARDS BANNER ROW */}
              <button
                onClick={() => {
                  onClose();
                  onOpenWallet();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-emerald-500/10 dark:from-amber-950/30 dark:to-emerald-950/30 border border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50 transition-all text-left group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <Crown className="w-5 h-5 fill-amber-100" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      SuperCart Wallet & rewards
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Balance:{" "}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {user ? formatINR(user.wallet_balance || 0) : "₹0"}
                      </span>{" "}
                      · Cashback & scratch cards
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* 3. GROUP "YOUR INFORMATION" */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1 h-3.5 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Your information
                  </span>
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrders();
                    }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Your orders
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenSavedAddresses();
                    }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Saved addresses
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenInvoices();
                    }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Invoices
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenWishlist();
                    }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Wishlist
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* 4. GROUP "MEMBERSHIPS & REWARDS" */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1 h-3.5 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Memberships & rewards
                  </span>
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWallet();
                    }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Wallet and cashback
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveView("coupons")}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Coupons & offers
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveView("refer")}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Refer & earn
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* 5. GROUP "MORE" */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-1 h-3.5 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    More
                  </span>
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
                  <button
                    onClick={() => setActiveView("feedback")}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquareQuote className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Your feedback
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveView("about")}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        About
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveView("feedback")}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Send className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Send feedback
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveView("settings")}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Settings
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {user && (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-bold">Log out</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  )}
                </div>
              </div>

              {/* Version micro label */}
              <div className="text-center pt-2 pb-4 text-[11px] text-slate-400 dark:text-slate-500">
                {APP_NAME} v2.4.0 · India's 10-Minute Grocery Delivery
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: SETTINGS SUBPAGE                                        */}
          {/* ============================================================== */}
          {activeView === "settings" && (
            <div className="space-y-5">
              {/* Language Selection */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    App Language / भाषा
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      language === "en"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    {language === "en" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>English</span>
                  </button>

                  <button
                    onClick={() => setLanguage("hi")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      language === "hi"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    {language === "hi" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>हिन्दी (Hindi)</span>
                  </button>
                </div>
              </div>

              {/* Theme Mode Toggle */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  {isDarkMode ? (
                    <Moon className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance</h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      if (isDarkMode) toggleDarkMode();
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      !isDarkMode
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-700/50"
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!isDarkMode) toggleDarkMode();
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isDarkMode
                        ? "border-emerald-500 bg-emerald-950/40 text-emerald-400 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Moon className="w-4 h-4 text-emerald-400" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Notifications Toggles */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Order Updates</p>
                      <p className="text-[11px] text-slate-400">Live order status and dispatch alerts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyOrders}
                      onChange={(e) => setNotifyOrders(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Promotions & Offers</p>
                      <p className="text-[11px] text-slate-400">Discounts and flash deal announcements</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyPromos}
                      onChange={(e) => setNotifyPromos(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">WhatsApp Delivery Alerts</p>
                      <p className="text-[11px] text-slate-400">Receive receipt & live tracking on WhatsApp</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyWhatsapp}
                      onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Delete Account */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="text-sm font-bold">Account Management</h3>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl space-y-3 border border-rose-200 dark:border-rose-900">
                    <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                      Are you sure you want to delete your SuperCart account? This will permanently erase your saved addresses, order history, and wallet balance.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      >
                        Yes, Delete My Account
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: COUPONS & OFFERS SUBPAGE                               */}
          {/* ============================================================== */}
          {activeView === "coupons" && (
            <div className="space-y-3">
              {[
                { code: "SUPERCART50", discount: "Flat ₹50 OFF", min: "Min. order ₹299", desc: "Applicable on your next 3 orders" },
                { code: "FREEDEL199", discount: "FREE Delivery", min: "Min. order ₹199", desc: "Doorstep delivery in 10 minutes" },
                { code: "CASHBACK100", discount: "₹100 Cashback", min: "Min. order ₹499", desc: "Credited instantly to SuperCart Wallet" },
              ].map((c) => (
                <div
                  key={c.code}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {c.code}
                      </span>
                      <span className="font-black text-xs text-slate-900 dark:text-white">{c.discount}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{c.desc} · {c.min}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code);
                      alert(`Coupon ${c.code} copied!`);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:underline px-2 py-1"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: REFER & EARN SUBPAGE                                   */}
          {/* ============================================================== */}
          {activeView === "refer" && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Refer Friends, Get ₹100 Each!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Share your referral code with friends and family. When they place their first order, you both get ₹100 wallet cashback!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-dashed border-emerald-500/50 flex items-center justify-between">
                <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400 tracking-wider">
                  {user?.referral_code || "SUPERCART-FRIEND"}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(user?.referral_code || "SUPERCART-FRIEND");
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2000);
                  }}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  {copiedReferral ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: ABOUT SUBPAGE                                          */}
          {/* ============================================================== */}
          {activeView === "about" && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">{APP_NAME}</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                SuperCart is India's ultrafast 10-minute grocery delivery network. Sourcing farm-fresh produce directly from local agriculturists and stocking thousands of pantry staples, snacks, personal care, and dairy products.
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                <p>Version: 2.4.0</p>
                <p>Support: care@supercart.in</p>
                <p>FSSAI Licensed & GST Compliant</p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: FEEDBACK SUBPAGE                                       */}
          {/* ============================================================== */}
          {activeView === "feedback" && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share Your Feedback</h3>
              <p className="text-xs text-slate-500">
                How was your recent ordering and delivery experience? We read every message!
              </p>

              {feedbackSent ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-center space-y-2 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Thank you! Your feedback has been received.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!feedbackText.trim()) return;
                    setFeedbackSent(true);
                  }}
                  className="space-y-3"
                >
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you loved or how we can improve..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:border-emerald-500 focus:outline-hidden"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : drawerContent;
};
