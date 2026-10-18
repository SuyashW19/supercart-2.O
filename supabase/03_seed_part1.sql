-- 03_seed_part1.sql
-- Categories, Subcategories, Banners, Coupons
-- Idempotent and safe to re-run

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('fruits-vegetables', 'Fruits & Vegetables', 'फल और सब्जियां', 'fruits-vegetables', 'Apple', 'Apple', 'from-emerald-500/10 to-emerald-600/20 text-emerald-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('fruits-vegetables-sub-1', 'fruits-vegetables', 'Fresh Vegetables', 'fresh-vegetables', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('fruits-vegetables-sub-2', 'fruits-vegetables', 'Fresh Fruits', 'fresh-fruits', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('fruits-vegetables-sub-3', 'fruits-vegetables', 'Exotics & Organic', 'exotics-organic', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('fruits-vegetables-sub-4', 'fruits-vegetables', 'Herbs & Seasoning', 'herbs-seasoning', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('dairy-bread-eggs', 'Dairy, Bread & Eggs', 'दूध, ब्रेड और अंडे', 'dairy-bread-eggs', 'Milk', 'Milk', 'from-amber-500/10 to-amber-600/20 text-amber-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('dairy-bread-eggs-sub-1', 'dairy-bread-eggs', 'Milk & Paneer', 'milk-paneer', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('dairy-bread-eggs-sub-2', 'dairy-bread-eggs', 'Butter & Cheese', 'butter-cheese', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('dairy-bread-eggs-sub-3', 'dairy-bread-eggs', 'Bread & Buns', 'bread-buns', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('dairy-bread-eggs-sub-4', 'dairy-bread-eggs', 'Eggs & Curd', 'eggs-curd', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('atta-rice-dal', 'Atta, Rice & Dal', 'आटा, चावल और दाल', 'atta-rice-dal', 'Wheat', 'Wheat', 'from-orange-500/10 to-orange-600/20 text-orange-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('atta-rice-dal-sub-1', 'atta-rice-dal', 'Atta & Flours', 'atta-flours', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('atta-rice-dal-sub-2', 'atta-rice-dal', 'Basmati & Rice', 'basmati-rice', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('atta-rice-dal-sub-3', 'atta-rice-dal', 'Dals & Pulses', 'dals-pulses', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('atta-rice-dal-sub-4', 'atta-rice-dal', 'Grains & Millets', 'grains-millets', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('snacks-munchies', 'Snacks & Munchies', 'नमकीन और चिप्स', 'snacks-munchies', 'Cookie', 'Cookie', 'from-red-500/10 to-red-600/20 text-red-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('snacks-munchies-sub-1', 'snacks-munchies', 'Chips & Crisps', 'chips-crisps', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('snacks-munchies-sub-2', 'snacks-munchies', 'Bhujia & Namkeen', 'bhujia-namkeen', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('snacks-munchies-sub-3', 'snacks-munchies', 'Biscuits & Cookies', 'biscuits-cookies', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('snacks-munchies-sub-4', 'snacks-munchies', 'Rusk & Khari', 'rusk-khari', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('cold-drinks-juices', 'Cold Drinks & Juices', 'कोल्ड ड्रिंक्स और जूस', 'cold-drinks-juices', 'GlassWater', 'GlassWater', 'from-cyan-500/10 to-cyan-600/20 text-cyan-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cold-drinks-juices-sub-1', 'cold-drinks-juices', 'Soft Drinks', 'soft-drinks', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cold-drinks-juices-sub-2', 'cold-drinks-juices', 'Fruit Juices', 'fruit-juices', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cold-drinks-juices-sub-3', 'cold-drinks-juices', 'Energy Drinks', 'energy-drinks', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cold-drinks-juices-sub-4', 'cold-drinks-juices', 'Mineral & Soda', 'mineral-soda', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('tea-coffee-beverages', 'Tea, Coffee & Beverages', 'चाय, कॉफी और पेय', 'tea-coffee-beverages', 'Coffee', 'Coffee', 'from-stone-500/10 to-stone-600/20 text-stone-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('tea-coffee-beverages-sub-1', 'tea-coffee-beverages', 'Chai & Tea Leaves', 'chai-tea-leaves', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('tea-coffee-beverages-sub-2', 'tea-coffee-beverages', 'Instant & Filter Coffee', 'instant-filter-coffee', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('tea-coffee-beverages-sub-3', 'tea-coffee-beverages', 'Green Tea', 'green-tea', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('tea-coffee-beverages-sub-4', 'tea-coffee-beverages', 'Health Drink Mixes', 'health-drink-mixes', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('sweets-chocolates', 'Sweets & Chocolates', 'मिठाई और चॉकलेट', 'sweets-chocolates', 'Candy', 'Candy', 'from-pink-500/10 to-pink-600/20 text-pink-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('sweets-chocolates-sub-1', 'sweets-chocolates', 'Chocolates', 'chocolates', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('sweets-chocolates-sub-2', 'sweets-chocolates', 'Traditional Indian Sweets', 'traditional-indian-sweets', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('sweets-chocolates-sub-3', 'sweets-chocolates', 'Candies & Gums', 'candies-gums', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('sweets-chocolates-sub-4', 'sweets-chocolates', 'Ice Creams', 'ice-creams', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('instant-frozen-food', 'Instant & Frozen Food', 'इंस्टेंट और फ्रोजन फूड', 'instant-frozen-food', 'Soup', 'Soup', 'from-yellow-500/10 to-yellow-600/20 text-yellow-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('instant-frozen-food-sub-1', 'instant-frozen-food', 'Noodles & Pasta', 'noodles-pasta', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('instant-frozen-food-sub-2', 'instant-frozen-food', 'Ready To Eat & Mixes', 'ready-to-eat-mixes', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('instant-frozen-food-sub-3', 'instant-frozen-food', 'Frozen Snacks', 'frozen-snacks', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('instant-frozen-food-sub-4', 'instant-frozen-food', 'Soups & Sauces', 'soups-sauces', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('masala-oil-dry-fruits', 'Masala, Oil & Dry Fruits', 'मसाले, तेल और ड्राई फ्रूट्स', 'masala-oil-dry-fruits', 'Flame', 'Flame', 'from-amber-600/10 to-amber-700/20 text-amber-800', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('masala-oil-dry-fruits-sub-1', 'masala-oil-dry-fruits', 'Edible Oils & Ghee', 'edible-oils-ghee', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('masala-oil-dry-fruits-sub-2', 'masala-oil-dry-fruits', 'Whole Spices', 'whole-spices', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('masala-oil-dry-fruits-sub-3', 'masala-oil-dry-fruits', 'Blended Masalas', 'blended-masalas', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('masala-oil-dry-fruits-sub-4', 'masala-oil-dry-fruits', 'Almonds & Cashews', 'almonds-cashews', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('cleaning-household', 'Cleaning & Household', 'सफाई और घरेलू सामान', 'cleaning-household', 'Sparkles', 'Sparkles', 'from-teal-500/10 to-teal-600/20 text-teal-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cleaning-household-sub-1', 'cleaning-household', 'Detergents & Fabric', 'detergents-fabric', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cleaning-household-sub-2', 'cleaning-household', 'Dishwashers', 'dishwashers', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cleaning-household-sub-3', 'cleaning-household', 'Floor & Toilet Cleaners', 'floor-toilet-cleaners', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('cleaning-household-sub-4', 'cleaning-household', 'Pooja & Matches', 'pooja-matches', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('personal-care', 'Personal Care', 'पर्सनल केयर', 'personal-care', 'HeartPulse', 'HeartPulse', 'from-rose-500/10 to-rose-600/20 text-rose-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('personal-care-sub-1', 'personal-care', 'Soaps & Body Wash', 'soaps-body-wash', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('personal-care-sub-2', 'personal-care', 'Hair Care & Shampoos', 'hair-care-shampoos', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('personal-care-sub-3', 'personal-care', 'Oral Care', 'oral-care', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('personal-care-sub-4', 'personal-care', 'Skincare & Lotions', 'skincare-lotions', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('baby-care', 'Baby Care', 'शिशु देखभाल', 'baby-care', 'Baby', 'Baby', 'from-sky-500/10 to-sky-600/20 text-sky-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('baby-care-sub-1', 'baby-care', 'Diapers & Wipes', 'diapers-wipes', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('baby-care-sub-2', 'baby-care', 'Baby Food & Formula', 'baby-food-formula', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('baby-care-sub-3', 'baby-care', 'Baby Bath & Skin', 'baby-bath-skin', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('baby-care-sub-4', 'baby-care', 'Accessories', 'accessories', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, name_hi, slug, icon, icon_name, color, sort_order, display_order, is_active)
VALUES ('pet-care', 'Pet Care', 'पालतू जानवरों की देखभाल', 'pet-care', 'PawPrint', 'PawPrint', 'from-indigo-500/10 to-indigo-600/20 text-indigo-700', 0, 0, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('pet-care-sub-1', 'pet-care', 'Dog Food', 'dog-food', 0, 0, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('pet-care-sub-2', 'pet-care', 'Cat Food', 'cat-food', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('pet-care-sub-3', 'pet-care', 'Pet Treats & Chews', 'pet-treats-chews', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO subcategories (id, category_id, name, slug, sort_order, display_order, is_active)
VALUES ('pet-care-sub-4', 'pet-care', 'Grooming & Hygiene', 'grooming-hygiene', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO banners (id, title, subtitle, image_url, bg_color, cta_text, category_id, link_category_id, badge_text, sort_order, display_order, is_active)
VALUES ('b001', '10-Minute Grocery Delivery', 'Farm fresh vegetables, dairy & staples at lowest prices', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80', '#111827', 'Shop Fresh', 'fruits-vegetables', 'fruits-vegetables', 'OFFER', 1, 1, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO banners (id, title, subtitle, image_url, bg_color, cta_text, category_id, link_category_id, badge_text, sort_order, display_order, is_active)
VALUES ('b002', 'Morning Dairy & Breakfast Freshness', 'Amul Milk, Bread, Butter, Paneer & Organic Brown Eggs', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1200&auto=format&fit=crop&q=80', '#111827', 'Explore Dairy', 'dairy-bread-eggs', 'dairy-bread-eggs', 'OFFER', 2, 2, true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO banners (id, title, subtitle, image_url, bg_color, cta_text, category_id, link_category_id, badge_text, sort_order, display_order, is_active)
VALUES ('b003', 'Chai Time Munchies & Drinks', 'Haldiram''s Bhujia, Parle-G, Cold Drinks & Namkeen', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1200&auto=format&fit=crop&q=80', '#111827', 'Order Snacks', 'snacks-munchies', 'snacks-munchies', 'OFFER', 3, 3, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('SUPERCART50', 'flat', 50, 199, 50, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('FREESHIP', 'flat', 30, 149, 30, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('WELCOME20', 'percentage', 20, 299, 100, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
VALUES ('MEGA100', 'flat', 100, 799, 100, true) ON CONFLICT (code) DO NOTHING;
