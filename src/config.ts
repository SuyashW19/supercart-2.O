/**
 * SuperCart Application Configuration
 * Production-ready quick-commerce settings
 */

export const APP_NAME = "SuperCart";
export const APP_TAGLINE = "India's 10-Minute Grocery Delivery";
export const DEFAULT_CITY = "Pune";
export const SUPPORT_PHONE = "+91 800-SUPERCART (787-372)";
export const SUPPORT_EMAIL = "care@supercart.in";
export const GSTIN = "27AABCS1429B1Z8";

// Delivery fee configuration: decreased to 0.5% of order
export const FREE_DELIVERY_THRESHOLD = 199;
export const DELIVERY_FEE_RATE = 0.005; // 0.5% delivery fee
export const STANDARD_DELIVERY_FEE = 0.005; // 0.5%
export const HANDLING_FEE = 5;
export const SURGE_FEE = 0; // Dynamic based on weather/demand
export const GST_RATE = 0.05; // 5% average grocery GST

// Serviceable pincodes (Pune, Mumbai, Delhi-NCR, Bengaluru, Hyderabad, Chennai)
export const SERVICEABLE_PINCODES: Record<string, { city: string; area: string; etaMinutes: number }> = {
  // Pune & Suburbs / Nearby
  "411001": { city: "Pune", area: "Camp / Station", etaMinutes: 9 },
  "411004": { city: "Pune", area: "Deccan Gymkhana", etaMinutes: 10 },
  "411005": { city: "Pune", area: "Shivajinagar", etaMinutes: 8 },
  "411006": { city: "Pune", area: "Yerawada", etaMinutes: 11 },
  "411014": { city: "Pune", area: "Viman Nagar / Kharadi", etaMinutes: 9 },
  "411016": { city: "Pune", area: "Model Colony", etaMinutes: 10 },
  "411028": { city: "Pune", area: "Hadapsar / Magarpatta", etaMinutes: 12 },
  "411038": { city: "Pune", area: "Kothrud", etaMinutes: 8 },
  "411045": { city: "Pune", area: "Baner / Balewadi", etaMinutes: 10 },
  "411057": { city: "Pune", area: "Hinjawadi Phase 1 & 2 / Wakad", etaMinutes: 11 },
  "411067": { city: "Pune", area: "Aundh / Pashan", etaMinutes: 9 },
  "412108": { city: "Pune", area: "Paud / Ghotwade / Mulshi", etaMinutes: 15 },
  "412115": { city: "Pune", area: "Pirangut / Urawade", etaMinutes: 14 },
  "410506": { city: "Pune", area: "Talegaon Dabhade", etaMinutes: 15 },
  "416001": { city: "Kolhapur", area: "Shahupuri / Rajarampuri", etaMinutes: 12 },
  "416211": { city: "Kolhapur", area: "Radhanagari / Ghotwade", etaMinutes: 15 },
  // Mumbai & Navi Mumbai / Thane
  "400001": { city: "Mumbai", area: "Fort / Colaba", etaMinutes: 12 },
  "400050": { city: "Mumbai", area: "Bandra West", etaMinutes: 9 },
  "400053": { city: "Mumbai", area: "Andheri West / Lokhandwala", etaMinutes: 10 },
  "400076": { city: "Mumbai", area: "Powai / Hiranandani", etaMinutes: 11 },
  "400703": { city: "Navi Mumbai", area: "Vashi / Sanpada", etaMinutes: 10 },
  "400601": { city: "Thane", area: "Thane West / Majiwada", etaMinutes: 11 },
  // Bengaluru
  "560001": { city: "Bengaluru", area: "MG Road / Brigade", etaMinutes: 10 },
  "560034": { city: "Bengaluru", area: "Koramangala", etaMinutes: 8 },
  "560038": { city: "Bengaluru", area: "Indiranagar", etaMinutes: 9 },
  "560100": { city: "Bengaluru", area: "Electronic City", etaMinutes: 12 },
  "560103": { city: "Bengaluru", area: "Bellandur / Outer Ring Rd", etaMinutes: 11 },
  "560066": { city: "Bengaluru", area: "Whitefield / ITPL", etaMinutes: 10 },
  "560078": { city: "Bengaluru", area: "JP Nagar / Jayanagar", etaMinutes: 9 },
  // Delhi-NCR
  "110001": { city: "Delhi", area: "Connaught Place", etaMinutes: 9 },
  "110016": { city: "Delhi", area: "Hauz Khas / Green Park", etaMinutes: 10 },
  "110024": { city: "Delhi", area: "Lajpat Nagar", etaMinutes: 9 },
  "122002": { city: "Gurugram", area: "Cyber City / DLF Phase 1-5", etaMinutes: 10 },
  "201301": { city: "Noida", area: "Sector 18 / Sector 62", etaMinutes: 10 },
  // Hyderabad
  "500081": { city: "Hyderabad", area: "Hitec City / Madhapur", etaMinutes: 9 },
  "500034": { city: "Hyderabad", area: "Banjara Hills", etaMinutes: 10 },
  "500032": { city: "Hyderabad", area: "Gachibowli / Financial District", etaMinutes: 11 },
  // Chennai
  "600017": { city: "Chennai", area: "T Nagar / Mylapore", etaMinutes: 10 },
  "600096": { city: "Chennai", area: "OMR / Perungudi", etaMinutes: 11 },
  // Ahmedabad
  "380015": { city: "Ahmedabad", area: "Satellite / Vastrapur", etaMinutes: 10 },
  "380009": { city: "Ahmedabad", area: "Navrangpura / CG Road", etaMinutes: 9 },
  // Kolkata
  "700091": { city: "Kolkata", area: "Salt Lake Sector V / New Town", etaMinutes: 11 },
  "700019": { city: "Kolkata", area: "Ballygunge / Park Street", etaMinutes: 10 },
};

/**
 * Format currency in Indian Rupees format (e.g., ₹1,234.50)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format compact INR without decimals for labels when clean
 */
export function formatCompactINR(amount: number): string {
  if (amount % 1 === 0) {
    return `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
  }
  return formatINR(amount);
}

/**
 * Supabase client configuration
 * Read from import.meta.env with fallbacks to provided project credentials
 */
export const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || "https://cyxxldgxksnzuhczkwav.supabase.co"
).trim();

export const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eHhsZGd4a3NuenVoY3prd2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MjgyODQsImV4cCI6MjEwNzIwNDI4NH0.dr2twEue9X9hfn9q-V03HGa7nIPm_aE0F1k5bvClnfM"
).trim();

/**
 * Google Maps API Key
 * Uses AI Studio's built-in Google Maps Platform integration demo key
 */
export const GOOGLE_MAPS_API_KEY = (
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  (import.meta.env.GOOGLE_MAPS_API_KEY as string) ||
  "AIzaSyAtc_IRCZxeaWC-2jZv7RTVfnKdE29Js5A"
).trim();
