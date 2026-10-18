import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Wallet,
  Gift,
  Copy,
  Check,
  TrendingUp,
  Plus,
  CreditCard,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatINR, APP_NAME } from "../config";
import { supabase, isSupabaseConfigured } from "../services/supabase";

interface WalletPageProps {
  onBack: () => void;
}

interface WalletTxn {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  created_at: string;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onBack }) => {
  const { user, updateProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [addAmount, setAddAmount] = useState<number>(200);
  const [isAdding, setIsAdding] = useState(false);
  const [transactions, setTransactions] = useState<WalletTxn[]>([
    {
      id: "tx-1",
      amount: 100,
      type: "credit",
      description: "Welcome Bonus Cashback",
      created_at: "Today, 10:00 AM",
    },
    {
      id: "tx-2",
      amount: 50,
      type: "credit",
      description: "Fast Delivery Cashback",
      created_at: "Yesterday",
    },
  ]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;

    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped: WalletTxn[] = data.map((d: any) => ({
            id: d.id,
            amount: Number(d.amount),
            type: d.type,
            description: d.description,
            created_at: new Date(d.created_at).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setTransactions(mapped);
        }
      });
  }, [user?.id]);

  const referralCode = user?.referral_code || "SUPERWALE";

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMoney = async () => {
    setIsAdding(true);
    const newBal = (user?.wallet_balance || 0) + addAmount;
    updateProfile({ wallet_balance: newBal });

    const newTx: WalletTxn = {
      id: "tx-" + Date.now(),
      amount: addAmount,
      type: "credit",
      description: "UPI Top-up to SuperCart Wallet",
      created_at: "Just now",
    };

    setTransactions([newTx, ...transactions]);

    // Persist to Supabase if configured
    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", user.id);
        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          amount: addAmount,
          type: "credit",
          description: "UPI Top-up to SuperCart Wallet",
        });
      } catch (err) {
        console.warn("Wallet topup sync error:", err);
      }
    }

    setIsAdding(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {APP_NAME} Wallet & Rewards
          </h1>
          <p className="text-xs text-slate-500">
            Instant 1-tap checkout, cashback balance & referral bonus
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              Available Cash Balance
            </span>
            <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight mt-1">
              {formatINR(user?.wallet_balance || 0)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-emerald-100">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Usable instantly on all grocery and daily essential orders</span>
        </div>
      </div>

      {/* Top up / Add Money */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Add Money to Wallet
        </h3>

        <div className="flex gap-2">
          {[100, 200, 500, 1000].map((amt) => (
            <button
              key={amt}
              onClick={() => setAddAmount(amt)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all tabular-nums ${
                addAmount === amt
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <button
          onClick={handleAddMoney}
          disabled={isAdding}
          className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? "Adding ₹..." : `Add ₹${addAmount} Instantly via UPI`}</span>
        </button>
      </div>

      {/* Transaction History */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Recent Wallet Transactions
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    tx.type === "credit"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                  }`}
                >
                  {tx.type === "credit" ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {tx.description}
                  </div>
                  <div className="text-[10px] text-slate-400">{tx.created_at}</div>
                </div>
              </div>

              <span
                className={`text-xs font-black tabular-nums ${
                  tx.type === "credit" ? "text-emerald-600" : "text-slate-900 dark:text-white"
                }`}
              >
                {tx.type === "credit" ? "+" : "-"}
                {formatINR(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Program */}
      <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Refer Friends, Earn ₹100
            </h3>
            <p className="text-xs text-slate-500">
              When your friend places their first order, you both get ₹100 wallet credit!
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Your Referral Code
            </span>
            <span className="font-mono text-base font-extrabold text-emerald-600 tracking-wider">
              {referralCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
