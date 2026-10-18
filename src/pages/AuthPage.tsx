import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Lock,
  User,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { APP_NAME, APP_TAGLINE } from "../config";

interface AuthPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack, onSuccess }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
    completeOnboarding,
    isLoading,
  } = useAuth();

  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);

  // Email form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMagicLink, setIsMagicLink] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingLocation, setOnboardingLocation] = useState("Baner, Pune");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!phone || phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }
    const cleanPhone = phone.startsWith("+91") ? phone : `+91 ${phone}`;
    const res = await sendPhoneOtp(cleanPhone);
    if (res.success) {
      setOtpSent(true);
      setTimer(30);
      setSuccessMessage(`OTP sent to ${cleanPhone}`);
    } else {
      setErrorMessage(res.message || "Failed to send OTP");
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val[val.length - 1];
    }
    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const enteredOtp = otpValues.join("");
    if (enteredOtp.length !== 6) {
      setErrorMessage("Please enter full 6-digit OTP");
      return;
    }

    const cleanPhone = phone.startsWith("+91") ? phone : `+91 ${phone}`;
    const res = await verifyPhoneOtp(cleanPhone, enteredOtp);
    if (res.success) {
      if (res.isNewUser) {
        setShowOnboarding(true);
      } else {
        onSuccess();
      }
    } else {
      setErrorMessage(res.message || "Invalid OTP entered");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const res = await loginWithEmail(email, password, isMagicLink);
    if (res.success) {
      if (isMagicLink && res.message) {
        setSuccessMessage(res.message);
      } else {
        onSuccess();
      }
    } else {
      setErrorMessage(res.message || "Authentication failed");
    }
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding({
      name: onboardingName || "Valued Shopper",
      location: onboardingLocation,
    });
    onSuccess();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* BRAND PANEL (LEFT ON DESKTOP) */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white relative overflow-hidden">
          <div className="relative z-10">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">⚡</span>
              <span className="text-3xl font-black tracking-tight">{APP_NAME}</span>
            </div>
            <p className="text-sm text-emerald-100 font-medium leading-relaxed max-w-xs">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="relative z-10 space-y-4 my-auto">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>10-Minute Dark Store Network</span>
              </div>
              <p className="text-emerald-100/90 text-[11px] leading-relaxed">
                Hyperlocal micro-fulfilment centers packing your fresh dairy, fruits and snacks in under 2 minutes.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-100">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Bank-grade 128-bit encryption for all data</span>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-emerald-200/80">
            Trusted by 500,000+ happy households across India
          </div>
        </div>

        {/* AUTH FORM (RIGHT ON DESKTOP, SINGLE CARD ON MOBILE) */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="md:hidden flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-black text-lg text-emerald-600">{APP_NAME}</span>
          </div>

          {showOnboarding ? (
            /* NEW USER ONBOARDING STEP */
            <div className="space-y-4 animate-in fade-in">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                  Step 2 of 2
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Welcome to {APP_NAME}!
                </h2>
                <p className="text-xs text-slate-500">
                  Please introduce yourself to complete your profile
                </p>
              </div>

              <form onSubmit={handleCompleteOnboarding} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={onboardingName}
                    onChange={(e) => setOnboardingName(e.target.value)}
                    placeholder="e.g. Suyash Wale"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Default Delivery Area
                  </label>
                  <input
                    type="text"
                    value={onboardingLocation}
                    onChange={(e) => setOnboardingLocation(e.target.value)}
                    placeholder="e.g. Baner, Pune"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span>Complete Setup & Start Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* STANDARD LOGIN / SIGNUP */
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Get Fresh Groceries in 10 Mins
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log in or sign up to track orders, access SuperCart Wallet & rewards
                </p>
              </div>

              {/* Mode Toggle: Phone vs Email */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => {
                    setAuthMode("phone");
                    setErrorMessage("");
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === "phone"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Phone with OTP
                </button>
                <button
                  onClick={() => {
                    setAuthMode("email");
                    setErrorMessage("");
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === "email"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Email / Magic Link
                </button>
              </div>

              {/* PHONE OTP FLOW */}
              {authMode === "phone" ? (
                !otpSent ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="98230 12345"
                          required
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tracking-wider focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Sending OTP..." : "Continue with Phone"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        OTP sent to <span className="font-bold text-slate-800 dark:text-slate-200">+91 {phone}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {/* 6-digit OTP input boxes */}
                    <div className="flex justify-between gap-1.5">
                      {otpValues.map((val, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          className="w-11 h-12 text-center text-lg font-black font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {timer > 0 ? `Resend in ${timer}s` : "Didn't receive code?"}
                      </span>
                      {timer === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTimer(30);
                            sendPhoneOtp(phone);
                          }}
                          className="font-bold text-emerald-600 hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Verifying..." : "Verify & Continue"}
                    </button>
                  </form>
                )
              ) : (
                /* EMAIL LOGIN FLOW */
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  {!isMagicLink && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
                      <input
                        type="checkbox"
                        checked={isMagicLink}
                        onChange={(e) => setIsMagicLink(e.target.checked)}
                        className="accent-emerald-600"
                      />
                      <span>Send Magic Link without password</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Signing in..." : isMagicLink ? "Send Magic Link" : "Sign In with Email"}
                  </button>
                </form>
              )}

              {/* Feedbacks */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={async () => {
                  setErrorMessage("");
                  const res = await loginWithGoogle();
                  if (res.success) {
                    onSuccess();
                  } else {
                    setErrorMessage(res.message || "Failed to log in with Google");
                  }
                }}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? "Signing in with Google..." : "Continue with Google"}</span>
              </button>

              {/* One-tap Google profile card for recognized account */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="https://lh3.googleusercontent.com/a/ACg8ocK5pvLTSJXY8TLIlhTLR_XChP5zv8syp60Ua0cWuN7ju7SqW5Oh=s96-c"
                    alt="Suyash Wale"
                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/30"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      Suyash Wale
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      suyashwale19@gmail.com
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setErrorMessage("");
                    const res = await loginWithGoogle("suyashwale19@gmail.com", "Suyash Wale");
                    if (res.success) {
                      onSuccess();
                    } else {
                      setErrorMessage(res.message || "Failed to log in with Google");
                    }
                  }}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  One-tap login
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                By continuing, you agree to {APP_NAME}'s Terms of Service and Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
