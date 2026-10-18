import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  ChevronDown,
  Search,
  Mic,
  ShoppingCart,
  User,
  Bell,
  Sun,
  Moon,
  ShieldAlert,
  Clock,
  Sparkles,
  X,
  History,
  LogOut,
  Menu,
} from "lucide-react";
import { APP_NAME, formatINR } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "../../context/LocationContext";
import { useCart } from "../../context/CartContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { useNotifications } from "../../context/NotificationContext";
import { Product } from "../../types";
import { SettingsMenuDrawer } from "./SettingsMenuDrawer";

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenWallet: () => void;
  onOpenOrders: () => void;
  onOpenProfile?: () => void;
  onOpenSavedAddresses?: () => void;
  onOpenInvoices?: () => void;
  onOpenWishlist?: () => void;
  onSearchSelectProduct?: (product: Product) => void;
  products: Product[];
}

const SEARCH_PLACEHOLDERS = [
  "Search 'Amul milk'",
  "Search 'Tata salt'",
  "Search 'Aashirvaad atta'",
  "Search 'fresh bananas'",
  "Search 'Haldiram bhujia'",
  "Search 'Maggi noodles'",
  "Search 'Fortune oil'",
];

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenAdmin,
  onOpenWallet,
  onOpenOrders,
  onOpenProfile,
  onOpenSavedAddresses,
  onOpenInvoices,
  onOpenWishlist,
  onSearchSelectProduct,
  products,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { currentAddress, setIsLocationModalOpen } = useLocation();
  const { cart, grandTotal, setIsCartDrawerOpen, totalItemCount } = useCart();
  const { isDarkMode, toggleDarkMode, language, setLanguage, t } = useThemeLanguage();
  const { notifications, unreadCount, markAsRead, isNotificationOpen, setIsNotificationOpen } = useNotifications();

  // Settings Menu Drawer state
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("supercart_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isListening, setIsListening] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Rotate search placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice search is not supported by your browser. Please type your query.");
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;

      setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsSearchFocused(true);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSelectQuery = (term: string) => {
    setSearchQuery(term);
    if (!recentSearches.includes(term)) {
      const updated = [term, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem("supercart_recent_searches", JSON.stringify(updated));
    }
  };

  const filteredSuggestions = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top micro banner for quick-commerce guarantee */}
      <div className="bg-emerald-700 text-white text-[11px] font-semibold py-1 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>⚡ 10-Minute SuperFast Delivery Guaranteed {currentAddress.city ? `across ${currentAddress.city}` : "across India"}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 md:gap-8">
          {/* ZONE 1: HAMBURGER, BRAND LOGO & LOCATION */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0 min-w-0">
            {/* 1. HAMBURGER ICON (TOP-LEFT CORNER, MIN 40x40px, CLEAR HOVER STATE) */}
            <button
              onClick={() => setIsSettingsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isSettingsMenuOpen}
              className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 flex items-center justify-center shadow-xs cursor-pointer"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* 2. SUPERCART LOGO */}
            <a href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-xs group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {APP_NAME}
                </span>
                <span className="hidden sm:inline text-[10px] font-bold text-emerald-600 dark:text-emerald-400 -mt-1 tracking-wider uppercase">
                  10 Min Delivery
                </span>
              </div>
            </a>

            {/* 3. LOCATION SELECTOR */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="text-left flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/80 dark:border-slate-700 max-w-[140px] sm:max-w-[240px] shadow-xs cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MapPin className="w-4 h-4 fill-white text-white" />
              </div>
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    {currentAddress.label || "HOME"}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1 mt-0.5">
                  {currentAddress.area || currentAddress.city
                    ? `${currentAddress.area || ""}${currentAddress.area && currentAddress.city ? ", " : ""}${currentAddress.city || ""}`
                    : "Select Delivery Location"}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 2: SEARCH BAR WITH ANIMATED PLACEHOLDER */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-2xl hidden md:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition-all shadow-inner"
              />

              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-10 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}

              {/* Voice search button */}
              <button
                onClick={handleVoiceSearch}
                aria-label="Search by voice"
                className={`absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors ${
                  isListening ? "text-emerald-600 animate-pulse bg-emerald-50 dark:bg-emerald-950/60" : ""
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Instant Suggestions Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Recent searches */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" /> Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectQuery(term)}
                          className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions match list */}
                {filteredSuggestions.length > 0 ? (
                  <div className="p-2 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-72 overflow-y-auto">
                    {filteredSuggestions.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          onSearchSelectProduct?.(product);
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-lg cursor-pointer transition-colors"
                      >
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 object-contain rounded bg-white dark:bg-slate-900 p-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {product.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {product.weight} · {formatINR(product.price)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded shrink-0">
                          {product.eta_minutes} mins
                        </span>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No products found for "{searchQuery}". Try searching for milk, bread, dal or chips.
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* ZONE 3: ACTIONS & UTILITIES */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              title="Toggle English / Hindi"
              className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {language === "en" ? "हिन्दी" : "EN"}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                aria-label="Notifications"
                className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notification Popover */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{unreadCount} unread</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-lg cursor-pointer ${
                          !n.read ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                        }`}
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{n.title}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight">
                          {n.message}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 block">{n.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Portal Quick Link (if admin) */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin
              </button>
            )}

            {/* User Account / Profile */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || "User"}
                        className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/30"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                      {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email || user.phone}</p>
                      </div>
                      {onOpenProfile && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenProfile();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg flex items-center gap-2"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>My Profile & Account</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg flex items-center gap-2"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Orders</span>
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenWallet();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg flex items-center justify-between"
                      >
                        <span>SuperCart Wallet</span>
                        <span className="text-emerald-600 font-bold">{formatINR(user.wallet_balance)}</span>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg"
                        >
                          SuperCart Admin
                        </button>
                      )}
                      <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* CART BUTTON */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left leading-tight">
                {totalItemCount > 0 ? (
                  <>
                    <span className="text-[10px] opacity-80 uppercase font-bold tracking-tight">
                      {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold tabular-nums">
                      {formatINR(grandTotal)}
                    </span>
                  </>
                ) : (
                  <span>My Cart</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* SETTINGS MENU DRAWER / FULLSCREEN MODAL */}
      <SettingsMenuDrawer
        isOpen={isSettingsMenuOpen}
        onClose={() => setIsSettingsMenuOpen(false)}
        onOpenProfile={() => onOpenProfile?.()}
        onOpenAuth={onOpenAuth}
        onOpenWallet={onOpenWallet}
        onOpenOrders={onOpenOrders}
        onOpenSavedAddresses={() => {
          if (onOpenSavedAddresses) {
            onOpenSavedAddresses();
          } else {
            setIsLocationModalOpen(true);
          }
        }}
        onOpenInvoices={() => onOpenInvoices?.()}
        onOpenWishlist={() => onOpenWishlist?.()}
      />
    </header>
  );
};
