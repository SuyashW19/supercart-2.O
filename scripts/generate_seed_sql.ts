import * as fs from "fs";
import * as path from "path";
import {
  DEFAULT_SEED_CATEGORIES,
  DEFAULT_SEED_BANNERS,
  DEFAULT_SEED_PRODUCTS,
} from "../src/lib/seedData";

function sqlEscape(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    const escapedArr = val.map((v) => "'" + String(v).replace(/'/g, "''") + "'");
    return `ARRAY[${escapedArr.join(", ")}]::text[]`;
  }
  if (typeof val === "object") {
    return "'" + JSON.stringify(val).replace(/'/g, "''") + "'::jsonb";
  }
  return "'" + String(val).replace(/'/g, "''") + "'";
}

const outDir = path.resolve("./supabase");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Part 1: Categories, Subcategories, Banners, Coupons
let part1 = `-- 03_seed_part1.sql
-- Categories, Subcategories, Banners, Coupons
-- Idempotent and safe to re-run

`;

// Categories
for (const cat of DEFAULT_SEED_CATEGORIES) {
  part1 += `INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)\nVALUES (${sqlEscape(cat.id)}, ${sqlEscape(cat.name)}, ${sqlEscape(cat.name_hi)}, ${sqlEscape(cat.id)}, ${sqlEscape(cat.icon_name)}, ${sqlEscape(cat.icon_name)}, ${sqlEscape(cat.color || "#10B981")}, ${cat.sort_order || 0}, ${cat.sort_order || 0}, true)\nON CONFLICT (id) DO NOTHING;\n\n`;

  for (let i = 0; i < cat.subcategories.length; i++) {
    const sub = cat.subcategories[i];
    const subId = `${cat.id}-sub-${i + 1}`;
    part1 += `INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)\nVALUES (${sqlEscape(subId)}, ${sqlEscape(cat.id)}, ${sqlEscape(sub)}, ${sqlEscape(sub.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}, ${i}, ${i}, true)\nON CONFLICT (id) DO NOTHING;\n`;
  }
  part1 += "\n";
}

// Banners
for (const ban of DEFAULT_SEED_BANNERS) {
  part1 += `INSERT INTO banners (id, title, subtitle, image_url, bg_color, cta_text, category_id, link_category_id, badge_text, sort_order, display_order, is_active)\nVALUES (${sqlEscape(ban.id)}, ${sqlEscape(ban.title)}, ${sqlEscape(ban.subtitle)}, ${sqlEscape(ban.image_url)}, ${sqlEscape("#111827")}, ${sqlEscape(ban.cta_text || "Shop Now")}, ${sqlEscape(ban.category_id)}, ${sqlEscape(ban.category_id)}, ${sqlEscape("OFFER")}, ${ban.sort_order || 0}, ${ban.sort_order || 0}, true)\nON CONFLICT (id) DO NOTHING;\n`;
}

// Coupons
part1 += `\nINSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('SUPERCART50', 'flat', 50, 199, 50, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('FREESHIP', 'flat', 30, 149, 30, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('WELCOME20', 'percentage', 20, 299, 100, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('MEGA100', 'flat', 100, 799, 100, true) ON CONFLICT (code) DO NOTHING;
`;

fs.writeFileSync(path.join(outDir, "03_seed_part1.sql"), part1, "utf8");
console.log("Wrote 03_seed_part1.sql");

// Split products into Part 2 and Part 3
const mid = Math.ceil(DEFAULT_SEED_PRODUCTS.length / 2);
const part2Products = DEFAULT_SEED_PRODUCTS.slice(0, mid);
const part3Products = DEFAULT_SEED_PRODUCTS.slice(mid);

function generateProductsSql(products: typeof DEFAULT_SEED_PRODUCTS, partNum: number) {
  let sql = `-- 03_seed_part${partNum}.sql\n-- Products batch ${partNum - 1} (${products.length} products)\n-- Idempotent and safe to re-run\n\n`;
  for (const p of products) {
    sql += `INSERT INTO products (
  id, name, name_hi, brand, category_id, subcategory, weight, price, mrp,
  discount_pct, discount_percentage, image_url, description, badge, in_stock, stock,
  rating, rating_count, reviews_count, eta_minutes, is_active, nutrition, tags,
  shelf_life
) VALUES (
  ${sqlEscape(p.id)},
  ${sqlEscape(p.name)},
  ${sqlEscape(p.name_hi || null)},
  ${sqlEscape(p.brand)},
  ${sqlEscape(p.category)},
  ${sqlEscape(p.subcategory)},
  ${sqlEscape(p.weight)},
  ${p.price},
  ${p.mrp},
  ${p.discount_pct},
  ${p.discount_pct},
  ${sqlEscape(p.image_url)},
  ${sqlEscape(p.description)},
  ${p.stock < 20 ? "'Low Stock'" : p.discount_pct >= 25 ? "'Best Deal'" : "NULL"},
  ${p.stock > 0},
  ${p.stock},
  ${p.rating},
  ${p.reviews_count || 120},
  ${p.reviews_count || 120},
  ${p.eta_minutes || 10},
  true,
  ${sqlEscape(p.nutrition || {})},
  ${sqlEscape(p.tags || [])},
  ${sqlEscape(p.shelf_life || "Fresh")}
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  mrp = EXCLUDED.mrp,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;\n\n`;
  }
  return sql;
}

fs.writeFileSync(path.join(outDir, "03_seed_part2.sql"), generateProductsSql(part2Products, 2), "utf8");
console.log(`Wrote 03_seed_part2.sql (${part2Products.length} products)`);

fs.writeFileSync(path.join(outDir, "03_seed_part3.sql"), generateProductsSql(part3Products, 3), "utf8");
console.log(`Wrote 03_seed_part3.sql (${part3Products.length} products)`);
