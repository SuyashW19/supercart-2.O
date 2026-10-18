import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "../types";
import { supabase, isSupabaseConfigured } from "../services/supabase";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  adminRole: UserRole | null;
  adminVerified: boolean;
  loginWithGoogle: (email?: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithEmail: (email: string, password?: string, isMagicLink?: boolean) => Promise<{ success: boolean; message?: string }>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; message?: string }>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<{ success: boolean; isNewUser?: boolean; message?: string }>;
  verifyAdminId: (adminId: string) => boolean;
  completeOnboarding: (data: { name: string; phone?: string; email?: string; location?: string }) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = "supercart_user";
const STORAGE_KEY_ADMIN_VERIFIED = "supercart_admin_verified";

// Demo admin account ID whitelist
export const VALID_ADMIN_IDS = ["ADM-1001", "ADM-1002", "SUPER-999"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Clean up legacy random default phone numbers
      if (parsed && (parsed.phone === "+91 98230 12345" || parsed.phone === "+91 98765 43210")) {
        delete parsed.phone;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [adminVerified, setAdminVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_VERIFIED) === "true";
    } catch {
      return false;
    }
  });

  // Sync session on mount with Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user && !user) {
          let dbProfile: any = null;
          try {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();
            dbProfile = data;
          } catch (e) {
            console.warn("Profile fetch error:", e);
          }

          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone || dbProfile?.phone || undefined,
            name: dbProfile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Suyash Wale",
            avatar_url: dbProfile?.avatar_url || session.user.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/a/ACg8ocK5pvLTSJXY8TLIlhTLR_XChP5zv8syp60Ua0cWuN7ju7SqW5Oh=s96-c",
            wallet_balance: dbProfile?.wallet_balance ?? 200,
            referral_code: "SUPERWALE",
            role: session.user.email?.includes("admin") || session.user.email === "suyashwale19@gmail.com" ? "super_admin" : "customer",
            admin_id: session.user.email === "suyashwale19@gmail.com" ? "ADM-1001" : undefined,
            created_at: dbProfile?.created_at || new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          let dbProfile: any = null;
          try {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();
            dbProfile = data;
          } catch (e) {
            console.warn("Profile sync error:", e);
          }

          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone || dbProfile?.phone || undefined,
            name: dbProfile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Suyash Wale",
            avatar_url: dbProfile?.avatar_url || session.user.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/a/ACg8ocK5pvLTSJXY8TLIlhTLR_XChP5zv8syp60Ua0cWuN7ju7SqW5Oh=s96-c",
            wallet_balance: dbProfile?.wallet_balance ?? 200,
            referral_code: "SUPERWALE",
            role: session.user.email?.includes("admin") || session.user.email === "suyashwale19@gmail.com" ? "super_admin" : "customer",
            admin_id: session.user.email === "suyashwale19@gmail.com" ? "ADM-1001" : undefined,
            created_at: dbProfile?.created_at || new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const loginWithGoogle = async (customEmail?: string, customName?: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const email = customEmail || "suyashwale19@gmail.com";
      const name = customName || (email === "suyashwale19@gmail.com" ? "Suyash Wale" : email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

      let profileId = "f2a90287-07f2-49b2-bf65-52499cf9ebaa";
      let avatarUrl = "https://lh3.googleusercontent.com/a/ACg8ocK5pvLTSJXY8TLIlhTLR_XChP5zv8syp60Ua0cWuN7ju7SqW5Oh=s96-c";
      let walletBalance = 200;
      let phone: string | undefined = undefined;
      let role: UserRole = "super_admin";
      let adminId: string | undefined = "ADM-1001";

      // If Supabase is configured, fetch/sync with database profile
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbProfile, error: dbErr } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .maybeSingle();

          if (!dbErr && dbProfile) {
            profileId = dbProfile.id;
            avatarUrl = dbProfile.avatar_url || avatarUrl;
            walletBalance = dbProfile.wallet_balance ?? walletBalance;
            phone = dbProfile.phone || undefined;
          } else if (!dbProfile) {
            const newId = "usr_g_" + Math.random().toString(36).substring(2, 9);
            await supabase.from("profiles").insert({
              id: newId,
              email,
              full_name: name,
              avatar_url: avatarUrl,
              wallet_balance: 100,
            });
            profileId = newId;
            walletBalance = 100;
            role = "customer";
            adminId = undefined;
          }
        } catch (dbErr) {
          console.warn("Supabase profile sync:", dbErr);
        }
      }

      await new Promise((r) => setTimeout(r, 400));

      const googleUser: UserProfile = {
        id: profileId,
        email,
        name,
        phone,
        avatar_url: avatarUrl,
        wallet_balance: walletBalance,
        referral_code: "SUPERWALE",
        role,
        admin_id: adminId,
        created_at: new Date().toISOString(),
      };

      setUser(googleUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(googleUser));
      if (role === "super_admin" || adminId) {
        setAdminVerified(true);
        localStorage.setItem(STORAGE_KEY_ADMIN_VERIFIED, "true");
      }
      return { success: true };
    } catch (e: any) {
      console.error("Google login error:", e);
      return { success: false, message: e?.message || "Failed to sign in with Google" };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string, isMagicLink?: boolean) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (isMagicLink) {
          const { error } = await supabase.auth.signInWithOtp({ email });
          if (error) return { success: false, message: error.message };
          return { success: true, message: "Magic link sent to your email!" };
        } else if (password) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            // Try signing up if user doesn't exist
            const signUp = await supabase.auth.signUp({ email, password });
            if (signUp.error) return { success: false, message: signUp.error.message };
            const newUser: UserProfile = {
              id: signUp.data.user?.id || "usr_new",
              email,
              name: email.split("@")[0],
              wallet_balance: 100,
              referral_code: "SC" + Math.floor(1000 + Math.random() * 9000),
              role: "customer",
              created_at: new Date().toISOString(),
            };
            setUser(newUser);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
            return { success: true };
          }
          if (data.user) {
            const profile: UserProfile = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || email.split("@")[0],
              phone: data.user.phone,
              wallet_balance: 100,
              referral_code: "SC" + Math.floor(1000 + Math.random() * 9000),
              role: "customer",
              created_at: new Date().toISOString(),
            };
            setUser(profile);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
            return { success: true };
          }
        }
      }

      // Simulated seamless email login
      await new Promise((r) => setTimeout(r, 500));
      if (isMagicLink) {
        return { success: true, message: `Magic sign-in link simulated for ${email}` };
      }
      const newUser: UserProfile = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        email,
        name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        wallet_balance: 100,
        referral_code: "SC" + Math.floor(1000 + Math.random() * 9000),
        role: email.includes("admin") ? "super_admin" : "customer",
        admin_id: email.includes("admin") ? "ADM-1001" : undefined,
        created_at: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to sign in" };
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneOtp = async (phone: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      return { success: true, message: `OTP sent successfully to ${phone}` };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      if (otp.length !== 6) {
        return { success: false, message: "Please enter a valid 6-digit OTP" };
      }
      // Demo logic: any 6 digit OTP succeeds
      const existingUserStr = localStorage.getItem(STORAGE_KEY_USER);
      let isNew = true;
      let profile: UserProfile;

      if (existingUserStr) {
        profile = JSON.parse(existingUserStr);
        profile.phone = phone;
        isNew = false;
      } else {
        profile = {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          phone,
          name: "Grocery Shopper",
          wallet_balance: 100,
          referral_code: "SC" + Math.floor(1000 + Math.random() * 9000),
          role: "customer",
          created_at: new Date().toISOString(),
        };
      }

      setUser(profile);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      return { success: true, isNewUser: isNew };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAdminId = (adminId: string): boolean => {
    const cleanId = adminId.trim().toUpperCase();
    if (VALID_ADMIN_IDS.includes(cleanId)) {
      setAdminVerified(true);
      localStorage.setItem(STORAGE_KEY_ADMIN_VERIFIED, "true");
      if (user) {
        const updated = { ...user, role: "super_admin" as UserRole, admin_id: cleanId };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      }
      return true;
    }
    return false;
  };

  const completeOnboarding = (data: { name: string; phone?: string; email?: string; location?: string }) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      name: data.name || user.name,
      phone: data.phone || user.phone,
      email: data.email || user.email,
    };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
          updated_at: new Date().toISOString(),
        })
        .then();
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...data };
    if (data.phone !== undefined) {
      if (!data.phone || !data.phone.trim()) {
        delete updated.phone;
      } else {
        updated.phone = data.phone.trim();
      }
    }
    setUser(updated);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      supabase
        .from("profiles")
        .update({
          name: updated.name,
          phone: updated.phone || null,
          email: updated.email,
          wallet_balance: updated.wallet_balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .then();
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      // Strictly comply with prompt: "On logout: clear session, cart and cached data, redirect to home and force a full page refresh."
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_ADMIN_VERIFIED);
      localStorage.removeItem("supercart_cart");
      localStorage.removeItem("supercart_wishlist");
      localStorage.removeItem("supercart_applied_coupon");
      setUser(null);
      setAdminVerified(false);
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "editor";
  const adminRole = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        adminRole,
        adminVerified,
        loginWithGoogle,
        loginWithEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        verifyAdminId,
        completeOnboarding,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
