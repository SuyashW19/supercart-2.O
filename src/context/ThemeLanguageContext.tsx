import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "hi";

interface ThemeLanguageContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const DICTIONARY: Record<string, Record<Language, string>> = {
  "delivering_to": { en: "Delivering to", hi: "डिलीवरी स्थान" },
  "search_placeholder": { en: "Search for atta, dal, milk, chips, shampoo...", hi: "आटा, दाल, दूध, चिप्स, शैम्पू खोजें..." },
  "cart": { en: "Cart", hi: "कार्ट" },
  "login": { en: "Login", hi: "लॉग इन" },
  "my_orders": { en: "My Orders", hi: "मेरे ऑर्डर्स" },
  "profile": { en: "Profile", hi: "प्रोफ़ाइल" },
  "admin": { en: "Admin", hi: "एडमिन" },
  "wallet": { en: "Wallet", hi: "वॉलेट" },
  "ten_mins": { en: "10 mins", hi: "१० मिनट" },
  "add": { en: "ADD", hi: "जोड़ें" },
  "item_total": { en: "Item Total", hi: "कुल सामान" },
  "delivery_fee": { en: "Delivery Fee", hi: "डिलीवरी शुल्क" },
  "free": { en: "FREE", hi: "मुफ़्त" },
  "handling_fee": { en: "Handling Fee", hi: "हैंडलिंग शुल्क" },
  "to_pay": { en: "To Pay", hi: "कुल भुगतान" },
  "place_order": { en: "Place Order", hi: "ऑर्डर दें" },
  "free_delivery_above": { en: "Free delivery on orders above ₹199", hi: "₹199 से अधिक के ऑर्डर पर मुफ़्त डिलीवरी" },
  "high_demand_alert": { en: "High Demand in your area: Extra delivery partners deployed to ensure 10-minute delivery!", hi: "आपके क्षेत्र में भारी मांग: १० मिनट में डिलीवरी सुनिश्चित करने हेतु अतिरिक्त पार्टनर तैनात हैं!" },
  "categories": { en: "Categories", hi: "श्रेणियां" },
  "view_all": { en: "View All", hi: "सभी देखें" },
  "track_order": { en: "Track Order", hi: "ऑर्डर ट्रैक करें" },
  "download_invoice": { en: "Download Invoice", hi: "इनवॉइस डाउनलोड करें" },
};

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("supercart_dark_mode") === "true";
    } catch {
      return false;
    }
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("supercart_lang") as Language;
      return saved === "hi" ? "hi" : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("supercart_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("supercart_lang", language);
  }, [language]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const t = (key: string, fallback?: string): string => {
    const entry = DICTIONARY[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || key;
  };

  return (
    <ThemeLanguageContext.Provider value={{ isDarkMode, toggleDarkMode, language, setLanguage, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error("useThemeLanguage must be used within a ThemeLanguageProvider");
  }
  return context;
};
