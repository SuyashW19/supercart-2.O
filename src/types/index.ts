export type UserRole = "customer" | "admin" | "super_admin" | "editor";

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  wallet_balance: number;
  referral_code: string;
  role: UserRole;
  admin_id?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  name_hi?: string;
  brand: string;
  category: string;
  category_id?: string;
  subcategory: string;
  price: number;
  mrp: number;
  weight: string;
  discount_pct: number;
  image_url: string;
  stock: number;
  rating: number;
  reviews_count: number;
  eta_minutes: number;
  is_active: boolean;
  description: string;
  nutrition?: Record<string, string>;
  shelf_life?: string;
  tags: string[];
}

export interface CategoryInfo {
  id: string;
  name: string;
  name_hi?: string;
  iconName?: string;
  icon_name?: string;
  subcategories: string[];
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  image_url?: string;
  section?: string;
}

export interface BannerInfo {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
  category_id?: string;
  badge_text?: string;
  bg_color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  user_id?: string;
  label: "Home" | "Work" | "Other";
  receiver_name: string;
  receiver_phone: string;
  house_no: string;
  street: string;
  landmark?: string;
  area: string;
  city: string;
  state?: string;
  pincode: string;
  lat: number;
  lng: number;
  is_default: boolean;
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  product_id: string;
  name: string;
  weight: string;
  price: number;
  mrp: number;
  quantity: number;
  image_url: string;
  status: "packed" | "substituted" | "unavailable";
}

export interface DeliveryPartner {
  name: string;
  phone: string;
  rating: number;
  vehicle_no: string;
  avatar_url: string;
  current_lat: number;
  current_lng: number;
}

export interface StoreLocation {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  label: string;
  time: string;
  completed: boolean;
  details?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  status: OrderStatus;
  items: OrderItem[];
  delivery_address: Address;
  delivery_slot: "instant" | "scheduled";
  scheduled_time?: string;
  delivery_otp: string;
  payment_method: "upi" | "card" | "netbanking" | "wallet" | "cod";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  item_total: number;
  delivery_fee: number;
  handling_fee: number;
  discount: number;
  delivery_tip: number;
  gst: number;
  grand_total: number;
  delivery_instructions?: string[];
  substitution_preference: "replace" | "refund";
  delivery_partner?: DeliveryPartner;
  store_location: StoreLocation;
  timeline: OrderTimelineStep[];
}

export interface Coupon {
  code: string;
  title: string;
  description: string;
  discount_pct: number;
  max_discount: number;
  min_order: number;
  expiry: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "order" | "promo" | "wallet";
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  old_value?: string;
  new_value?: string;
}

export interface ServiceablePincode {
  pincode: string;
  city?: string;
  state?: string;
  is_active: boolean;
  eta_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlockedPincode {
  pincode: string;
  reason?: string;
  blocked_at?: string;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

