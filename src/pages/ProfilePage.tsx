import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Wallet,
  ShoppingBag,
  MapPin,
  Heart,
  HelpCircle,
  ShieldAlert,
  LogOut,
  Moon,
  Sun,
  Globe,
  Share2,
  Check,
  Edit2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLocation } from "../context/LocationContext";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { formatINR, APP_NAME } from "../config";

interface ProfilePageProps {
  onBack: () => void;
  onOpenOrders: () => void;
  onOpenWallet: () => void;
  onOpenHelp: () => void;
  onOpenAdmin: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  onOpenOrders,
  onOpenWallet,
  onOpenHelp,
  onOpenAdmin,
}) => {
  const { user, isAdmin, updateProfile, logout } = useAuth();
  const { savedAddresses } = useLocation();
  const { isDarkMode, toggleDarkMode, language, setLanguage, t } = useThemeLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [phoneInput, setPhoneInput] = useState(user?.phone || "");
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Not Logged In</h2>
        <p className="text-sm text-slate-500 mb-6">Log in or create an account to manage your profile, orders, and addresses.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameInput.trim() || user.name,
      email: emailInput.trim() || user.email,
      phone: phoneInput.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCopyReferral = () => {
    if (user.referral_code) {
      navigator.clipboard?.writeText(user.referral_code);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              My Profile & Account
            </h1>
            <p className="text-xs text-slate-500">
              Manage your credentials, preferences, and account security
            </p>
          </div>
        </div>

        {/* Prominent Header Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* User Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 uppercase">
                    {user.role === "customer" ? "Verified Customer" : user.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {user.phone}
                    </span>
                  )}
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-600"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Phone Number (+91)
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-emerald-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Save Changes
              </button>
            </form>
          )}

          {/* Referral Banner */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Refer friends & earn ₹100 wallet cashback
              </span>
              <p className="text-[11px] text-slate-500">
                Share your referral code with friends and family for instant discount.
              </p>
            </div>
            <button
              onClick={handleCopyReferral}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors"
            >
              {copiedReferral ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedReferral ? "Copied!" : user.referral_code}</span>
            </button>
          </div>
        </div>

        {/* Wallet & Balance Overview */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-100 mb-1">
              <Wallet className="w-4 h-4" />
              <span>SuperCart Wallet Balance</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black">
              {formatINR(user.wallet_balance)}
            </div>
            <p className="text-[11px] text-emerald-100 mt-1">
              Applicable automatically during checkout for instant savings
            </p>
          </div>
          <button
            onClick={onOpenWallet}
            className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-sm"
          >
            Manage Wallet
          </button>
        </div>

        {/* Quick Menu Options */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
          <button
            onClick={onOpenOrders}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">My Orders</div>
                <div className="text-xs text-slate-500">Track current orders, reorder, and download tax invoices</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={onOpenHelp}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Help & Customer Support</div>
                <div className="text-xs text-slate-500">24x7 chat, refund requests, delivery partner escalations</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Admin Operations Portal</div>
                  <div className="text-xs text-slate-500">Inventory control, live dark store dispatch, sales metrics</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Preferences & Settings
          </h3>
          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Theme</span>
                  <p className="text-[11px] text-slate-500">Toggle dark / light display interface</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Language Switch */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Language (भाषा)</span>
                  <p className="text-[11px] text-slate-500">Bilingual English / Hindi support</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    language === "en" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("hi")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    language === "hi" ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LOGOUT DANGER CARD */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Log Out of SuperCart</span>
              </h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1">
                Clears your current logged-in session, active cart, and local storage cache.
              </p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Confirm Log Out?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to log out of {APP_NAME}? You will need to verify your phone number or email to log back in.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? "Logging out..." : "Yes, Log Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
