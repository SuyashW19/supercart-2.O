import React from "react";
import { Home, LayoutGrid, RotateCcw, User, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenOrders: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenOrders,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { totalItemCount, setIsCartDrawerOpen } = useCart();
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectTab("home")}
        className={`flex flex-col items-center gap-0.5 ${
          currentTab === "home" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Home</span>
      </button>

      <button
        onClick={() => onSelectTab("categories")}
        className={`flex flex-col items-center gap-0.5 ${
          currentTab === "category" || currentTab === "categories" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Categories</span>
      </button>

      <button
        onClick={onOpenOrders}
        className={`flex flex-col items-center gap-0.5 ${
          currentTab === "orders" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        <RotateCcw className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Orders</span>
      </button>

      <button
        onClick={user ? (onOpenProfile || onOpenOrders) : onOpenAuth}
        className={`flex flex-col items-center gap-0.5 ${
          currentTab === "profile" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-semibold">{user ? "Account" : "Login"}</span>
      </button>

      <button
        onClick={() => setIsCartDrawerOpen(true)}
        className="relative flex flex-col items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {totalItemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold">Cart</span>
      </button>
    </div>
  );
};
