-- ============================================================================
-- AI FITNESS BRAIN (AIFitCore) — SEED 002: BANGLADESHI & GLOBAL FOOD DATABASE
-- Standardized per typical serving size with accurate macro & fiber profiles
-- ============================================================================

INSERT INTO public.food_items (
  slug, name, name_local, category, cuisine_tag, serving_size_g, serving_unit_label,
  calories_kcal, protein_g, carbs_g, fat_g, fiber_g, budget_tier, is_verified
) VALUES
  -- BANGLADESHI STAPLES
  ('steamed-white-rice', 'Steamed White Rice (Bhat)', 'সাদা ভাত', 'grains', 'bangladeshi', 150, '1 medium bowl (150g cooked)', 195, 4.1, 42.3, 0.4, 0.6, 'budget', TRUE),
  ('brown-red-rice', 'Deshi Red / Brown Rice (Lal Chal Bhat)', 'লাল চালের ভাত', 'grains', 'bangladeshi', 150, '1 medium bowl (150g cooked)', 170, 4.3, 35.2, 1.4, 2.7, 'budget', TRUE),
  ('whole-wheat-roti', 'Whole Wheat Atta Roti / Chapati', 'আটার রুটি', 'grains', 'bangladeshi', 45, '1 medium roti (45g)', 120, 3.8, 23.5, 1.1, 2.8, 'budget', TRUE),
  ('masoor-dal-thick', 'Cooked Masoor Dal (Red Lentil Soup)', 'মসুর ডাল', 'legumes', 'bangladeshi', 150, '1 cup thick dal (150g)', 168, 10.8, 26.5, 2.2, 5.4, 'budget', TRUE),
  ('rohu-fish-curry', 'Rui / Rohu Fish Curry (Homestyle)', 'রুই মাছের ঝোল', 'protein', 'bangladeshi', 130, '1 medium piece with light gravy (130g)', 192, 23.4, 3.8, 9.2, 0.5, 'moderate', TRUE),
  ('tilapia-grilled-bhuna', 'Tilapia Fish Bhuna / Pan-Seared', 'তেলাপিয়া মাছ ভুনা', 'protein', 'bangladeshi', 130, '1 fillet serving (130g)', 178, 26.5, 2.5, 6.8, 0.4, 'budget', TRUE),
  ('hilsa-ilish-curry', 'Hilsa (Ilish) Fish Curry', 'ইলিশ মাছ', 'protein', 'bangladeshi', 120, '1 piece (120g)', 295, 21.8, 2.0, 22.0, 0.2, 'premium', TRUE),
  ('deshi-chicken-curry', 'Homestyle Chicken Curry (Murgi Jhol)', 'মুরগির মাংস', 'protein', 'bangladeshi', 150, '150g chicken breast/thigh curry', 235, 28.5, 4.5, 11.2, 0.8, 'moderate', TRUE),
  ('boiled-whole-egg', 'Boiled Whole Egg (Siddho Dim)', 'সিদ্ধ ডিম', 'protein', 'bangladeshi', 50, '1 large egg (50g)', 78, 6.3, 0.6, 5.3, 0.0, 'budget', TRUE),
  ('egg-omelette-onion', 'Deshi Egg Omelette with Onion & Chili', 'ডিম ভাজা', 'protein', 'bangladeshi', 110, '2 eggs with 1 tsp oil', 196, 13.0, 2.2, 15.0, 0.4, 'budget', TRUE),
  ('mixed-sabzi-bhaji', 'Mixed Vegetable Bhaji (Labra / Sabzi)', 'সবজি ভাজি', 'vegetables', 'bangladeshi', 150, '1 cup cooked vegetables (150g)', 115, 3.2, 14.5, 5.1, 4.6, 'budget', TRUE),
  ('shak-spinach-bhaji', 'Leafy Shak Bhaji (Palong / Lal Shak)', 'শাক ভাজি', 'vegetables', 'bangladeshi', 120, '1 cup cooked greens (120g)', 74, 3.6, 7.2, 3.5, 3.8, 'budget', TRUE),
  ('boiled-chana-chickpeas', 'Spiced Boiled Chickpeas (Chola / Boot)', 'ছোলা বুট', 'legumes', 'bangladeshi', 120, '1 cup (120g)', 198, 10.5, 32.0, 3.2, 8.5, 'budget', TRUE),
  ('fresh-cow-milk', 'Pasteurized Low-Fat Milk (Dudh)', 'দুধ', 'dairy', 'bangladeshi', 250, '1 glass (250ml)', 125, 8.5, 12.2, 4.5, 0.0, 'budget', TRUE),
  ('tok-doi-yogurt', 'Plain Sour Yogurt (Tok Doi)', 'টক দই', 'dairy', 'bangladeshi', 150, '1 bowl (150g)', 95, 7.8, 7.5, 3.8, 0.0, 'budget', TRUE),
  ('sagor-banana', 'Ripe Banana (Sagor Kola)', 'সাগর কলা', 'fruits', 'bangladeshi', 118, '1 medium banana (118g)', 105, 1.3, 27.0, 0.4, 3.1, 'budget', TRUE),
  ('deshi-guava', 'Fresh Guava (Peyara)', 'পিয়ারা', 'fruits', 'bangladeshi', 150, '1 large guava (150g)', 102, 3.8, 21.5, 1.4, 8.1, 'budget', TRUE),
  ('ripe-papaya', 'Ripe Papaya Cubes (Pepe)', 'পাকা পেঁপে', 'fruits', 'bangladeshi', 150, '1 bowl (150g)', 65, 0.9, 16.2, 0.4, 2.6, 'budget', TRUE),

  -- GLOBAL FITNESS STAPLES
  ('rolled-oats', 'Rolled Oats Porridge', 'ওটস', 'grains', 'international', 60, '60g dry oats cooked in water', 228, 7.9, 40.6, 3.9, 6.1, 'moderate', TRUE),
  ('grilled-chicken-breast', 'Grilled Skinless Chicken Breast', 'গ্রিল্ড চিকেন ব্রেস্ট', 'protein', 'international', 150, '150g cooked breast', 248, 46.5, 0.0, 5.4, 0.0, 'moderate', TRUE),
  ('whey-protein-scoop', 'Whey Protein Isolate Shake', 'হুই প্রোটিন', 'supplements', 'international', 32, '1 scoop (32g) in water', 120, 25.0, 2.0, 1.2, 0.0, 'premium', TRUE),
  ('roasted-almonds', 'Raw / Roasted Almonds (Kath Badam)', 'কাঠ বাদাম', 'nuts', 'international', 28, '1 handful (28g / ~23 almonds)', 164, 6.0, 6.1, 14.2, 3.5, 'premium', TRUE),
  ('peanut-butter', 'Natural Peanut Butter', 'পিনাট বাটার', 'nuts', 'international', 32, '2 tbsp (32g)', 188, 8.0, 6.4, 16.0, 2.6, 'moderate', TRUE)
ON CONFLICT (slug) DO NOTHING;
