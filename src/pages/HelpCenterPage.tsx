import React, { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  MessageCircle,
  Phone,
  Mail,
  Send,
  HelpCircle,
} from "lucide-react";
import { APP_NAME, SUPPORT_PHONE, SUPPORT_EMAIL } from "../config";

interface HelpCenterPageProps {
  onBack: () => void;
}

const FAQS = [
  {
    q: "How does 10-minute delivery work?",
    a: "We maintain network of hyperlocal 'dark stores' within 2-3 kms of your neighborhood. As soon as you place an order, our system assigns a dedicated picker who packs your items in under 2 minutes, and our electric scooter delivery partner arrives at your door within 8-10 minutes.",
  },
  {
    q: "What if an item is out of stock or damaged?",
    a: "We maintain 99.8% live inventory sync. In the rare case an item is unavailable or defective, you can choose instant replacement or a zero-question 100% instant refund directly to your SuperCart Wallet or bank source account.",
  },
  {
    q: "How do I download my GST Tax Invoice?",
    a: "Go to 'My Orders' > Select your order > Tap 'GST Invoice' to view or download a complete GST-compliant PDF invoice with tax breakdown and GSTIN.",
  },
  {
    q: "What payment modes are accepted?",
    a: "We support UPI (GPay, PhonePe, Paytm, CRED), Credit/Debit Cards (Visa, Mastercard, RuPay), Netbanking across all Indian banks, and Cash on Delivery (COD).",
  },
];

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onBack }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: `Hello! Welcome to ${APP_NAME} Support. How can we help you today with your order or delivery?`,
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setChatMessages((prev) => [...prev, { sender: "user", text: userText, time: now }]);
    setChatInput("");

    // Simulated responsive support bot
    setTimeout(() => {
      let reply = "Our support executive has noted your request. We guarantee 10-minute delivery and 100% replacement/refund for any issues!";
      const lower = userText.toLowerCase();
      if (lower.includes("refund") || lower.includes("money")) {
        reply = "Refunds are processed instantly to your SuperCart Wallet, or within 24-48 hours to original UPI/Card.";
      } else if (lower.includes("late") || lower.includes("where") || lower.includes("order")) {
        reply = "Your order is tracked live on GPS. You can view the live scooter position on your Order Tracking page!";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Customer Support & FAQs
          </h1>
          <p className="text-xs text-slate-500">
            We are here 24x7 to ensure seamless 10-minute grocery delivery
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: FAQ Accordion */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Frequently Asked Questions
          </h3>

          <div className="space-y-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-3.5 pt-0 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick contact strip */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Direct Contact
            </span>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{SUPPORT_PHONE}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>{SUPPORT_EMAIL}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat Simulation */}
        <div className="flex flex-col h-[460px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-emerald-600 text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight">SuperCart Care Assistant</h4>
              <span className="text-[10px] text-emerald-100">Live Agent Online · Avg reply 10s</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about delivery, refund, items..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
