import { Coupon } from "../types";

export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: "SUPERCART50",
    title: "Flat ₹50 OFF",
    description: "Save ₹50 on your first grocery delivery on orders above ₹199",
    discount_pct: 0,
    max_discount: 50,
    min_order: 199,
    expiry: "31 Dec 2026",
  },
  {
    code: "SUPER10",
    title: "10% Instant Savings",
    description: "Get 10% instant discount up to ₹100 on orders above ₹499",
    discount_pct: 10,
    max_discount: 100,
    min_order: 499,
    expiry: "31 Dec 2026",
  },
  {
    code: "FESTIVE15",
    title: "15% Mega Discount",
    description: "Save 15% up to ₹150 on fresh grocery orders above ₹799",
    discount_pct: 15,
    max_discount: 150,
    min_order: 799,
    expiry: "31 Dec 2026",
  },
  {
    code: "FREEDEL",
    title: "Zero Delivery Fee",
    description: "Enjoy zero delivery fee on any cart value above ₹149",
    discount_pct: 0,
    max_discount: 25,
    min_order: 149,
    expiry: "31 Dec 2026",
  },
];
