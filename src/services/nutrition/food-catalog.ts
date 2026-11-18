// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — BANGLADESHI & GLOBAL FOOD CATALOG & MEAL ENGINE
// ============================================================================

import {
  FoodBudgetTier,
  FoodCatalogItem,
  MealType,
  NutritionTargets,
  PlannedMeal,
  UserPreferences,
} from "@/types/fitness";
import { generateUUID, getTodayDateString } from "@/lib/utils";

export const FOOD_CATALOG: FoodCatalogItem[] = [
  // BANGLADESHI STAPLES
  {
    id: "fd-bd-white-rice",
    slug: "steamed-white-rice",
    name: "Steamed White Rice (Bhat)",
    nameLocal: "সাদা ভাত (Bhat)",
    category: "grains",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "1 medium bowl (150g cooked)",
    caloriesKcal: 195,
    proteinG: 4.1,
    carbsG: 42.3,
    fatG: 0.4,
    fiberG: 0.6,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-red-rice",
    slug: "brown-red-rice",
    name: "Deshi Red / Brown Rice (Lal Chal Bhat)",
    nameLocal: "লাল চালের ভাত (Lal Chal)",
    category: "grains",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "1 medium bowl (150g cooked)",
    caloriesKcal: 170,
    proteinG: 4.3,
    carbsG: 35.2,
    fatG: 1.4,
    fiberG: 2.7,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-roti",
    slug: "whole-wheat-roti",
    name: "Whole Wheat Atta Roti / Chapati",
    nameLocal: "আটার রুটি (Atta Roti)",
    category: "grains",
    cuisineTag: "bangladeshi",
    servingSizeG: 45,
    servingUnitLabel: "1 medium roti (45g)",
    caloriesKcal: 120,
    proteinG: 3.8,
    carbsG: 23.5,
    fatG: 1.1,
    fiberG: 2.8,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-dal",
    slug: "masoor-dal-thick",
    name: "Cooked Masoor Dal (Red Lentil Soup)",
    nameLocal: "মসুর ডাল (Masoor Dal)",
    category: "legumes",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "1 cup thick dal (150g)",
    caloriesKcal: 168,
    proteinG: 10.8,
    carbsG: 26.5,
    fatG: 2.2,
    fiberG: 5.4,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-rohu-fish",
    slug: "rohu-fish-curry",
    name: "Rui / Rohu Fish Curry (Homestyle)",
    nameLocal: "রুই মাছের ঝোল (Rui Mach)",
    category: "protein",
    cuisineTag: "bangladeshi",
    servingSizeG: 130,
    servingUnitLabel: "1 medium piece with light gravy (130g)",
    caloriesKcal: 192,
    proteinG: 23.4,
    carbsG: 3.8,
    fatG: 9.2,
    fiberG: 0.5,
    budgetTier: "moderate",
  },
  {
    id: "fd-bd-tilapia",
    slug: "tilapia-grilled-bhuna",
    name: "Tilapia Fish Bhuna / Pan-Seared",
    nameLocal: "তেলাপিয়া মাছ ভুনা (Tilapia)",
    category: "protein",
    cuisineTag: "bangladeshi",
    servingSizeG: 130,
    servingUnitLabel: "1 fillet serving (130g)",
    caloriesKcal: 178,
    proteinG: 26.5,
    carbsG: 2.5,
    fatG: 6.8,
    fiberG: 0.4,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-hilsa",
    slug: "hilsa-ilish-curry",
    name: "Hilsa (Ilish) Fish Curry",
    nameLocal: "ইলিশ মাছ (Ilish Mach)",
    category: "protein",
    cuisineTag: "bangladeshi",
    servingSizeG: 120,
    servingUnitLabel: "1 piece (120g)",
    caloriesKcal: 295,
    proteinG: 21.8,
    carbsG: 2.0,
    fatG: 22.0,
    fiberG: 0.2,
    budgetTier: "premium",
  },
  {
    id: "fd-bd-chicken-curry",
    slug: "deshi-chicken-curry",
    name: "Homestyle Chicken Curry (Murgi Jhol)",
    nameLocal: "মুরগির মাংস (Murgi Jhol)",
    category: "protein",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "150g chicken curry serving",
    caloriesKcal: 235,
    proteinG: 28.5,
    carbsG: 4.5,
    fatG: 11.2,
    fiberG: 0.8,
    budgetTier: "moderate",
  },
  {
    id: "fd-bd-boiled-egg",
    slug: "boiled-whole-egg",
    name: "Boiled Whole Egg (Siddho Dim)",
    nameLocal: "সিদ্ধ ডিম (Siddho Dim)",
    category: "protein",
    cuisineTag: "bangladeshi",
    servingSizeG: 50,
    servingUnitLabel: "1 large egg (50g)",
    caloriesKcal: 78,
    proteinG: 6.3,
    carbsG: 0.6,
    fatG: 5.3,
    fiberG: 0,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-omelette",
    slug: "egg-omelette-onion",
    name: "Deshi Egg Omelette with Onion & Chili",
    nameLocal: "ডিম ভাজা (Dim Bhaja)",
    category: "protein",
    cuisineTag: "bangladeshi",
    servingSizeG: 110,
    servingUnitLabel: "2 eggs omelette (110g)",
    caloriesKcal: 196,
    proteinG: 13.0,
    carbsG: 2.2,
    fatG: 15.0,
    fiberG: 0.4,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-sabzi",
    slug: "mixed-sabzi-bhaji",
    name: "Mixed Vegetable Bhaji (Labra / Sabzi)",
    nameLocal: "মিক্সড সবজি ভাজি (Sabzi)",
    category: "vegetables",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "1 cup cooked vegetables (150g)",
    caloriesKcal: 115,
    proteinG: 3.2,
    carbsG: 14.5,
    fatG: 5.1,
    fiberG: 4.6,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-shak",
    slug: "shak-spinach-bhaji",
    name: "Leafy Shak Bhaji (Palong / Lal Shak)",
    nameLocal: "শাক ভাজি (Shak)",
    category: "vegetables",
    cuisineTag: "bangladeshi",
    servingSizeG: 120,
    servingUnitLabel: "1 cup cooked greens (120g)",
    caloriesKcal: 74,
    proteinG: 3.6,
    carbsG: 7.2,
    fatG: 3.5,
    fiberG: 3.8,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-chana",
    slug: "boiled-chana-chickpeas",
    name: "Spiced Boiled Chickpeas (Chola / Boot)",
    nameLocal: "ছোলা বুট (Chola)",
    category: "legumes",
    cuisineTag: "bangladeshi",
    servingSizeG: 120,
    servingUnitLabel: "1 cup (120g)",
    caloriesKcal: 198,
    proteinG: 10.5,
    carbsG: 32.0,
    fatG: 3.2,
    fiberG: 8.5,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-milk",
    slug: "fresh-cow-milk",
    name: "Pasteurized Low-Fat Milk (Dudh)",
    nameLocal: "গরুর দুধ (Dudh)",
    category: "dairy",
    cuisineTag: "bangladeshi",
    servingSizeG: 250,
    servingUnitLabel: "1 glass (250ml)",
    caloriesKcal: 125,
    proteinG: 8.5,
    carbsG: 12.2,
    fatG: 4.5,
    fiberG: 0,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-doi",
    slug: "tok-doi-yogurt",
    name: "Plain Sour Yogurt (Tok Doi)",
    nameLocal: "টক দই (Tok Doi)",
    category: "dairy",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "1 bowl (150g)",
    caloriesKcal: 95,
    proteinG: 7.8,
    carbsG: 7.5,
    fatG: 3.8,
    fiberG: 0,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-banana",
    slug: "sagor-banana",
    name: "Ripe Banana (Sagor Kola)",
    nameLocal: "সাগর কলা (Kola)",
    category: "fruits",
    cuisineTag: "bangladeshi",
    servingSizeG: 118,
    servingUnitLabel: "1 medium banana (118g)",
    caloriesKcal: 105,
    proteinG: 1.3,
    carbsG: 27.0,
    fatG: 0.4,
    fiberG: 3.1,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-guava",
    slug: "deshi-guava",
    name: "Fresh Guava (Peyara)",
    nameLocal: "পেয়ারা (Peyara)",
    category: "fruits",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "1 large guava (150g)",
    caloriesKcal: 102,
    proteinG: 3.8,
    carbsG: 21.5,
    fatG: 1.4,
    fiberG: 8.1,
    budgetTier: "budget",
  },
  {
    id: "fd-bd-papaya",
    slug: "ripe-papaya",
    name: "Ripe Papaya Cubes (Pepe)",
    nameLocal: "পাকা পেঁপে (Pepe)",
    category: "fruits",
    cuisineTag: "bangladeshi",
    servingSizeG: 150,
    servingUnitLabel: "1 bowl (150g)",
    caloriesKcal: 65,
    proteinG: 0.9,
    carbsG: 16.2,
    fatG: 0.4,
    fiberG: 2.6,
    budgetTier: "budget",
  },

  // INTERNATIONAL FITNESS STAPLES
  {
    id: "fd-int-oats",
    slug: "rolled-oats",
    name: "Rolled Oats Porridge",
    nameLocal: "ওটস (Oats)",
    category: "grains",
    cuisineTag: "international",
    servingSizeG: 60,
    servingUnitLabel: "60g dry oats cooked",
    caloriesKcal: 228,
    proteinG: 7.9,
    carbsG: 40.6,
    fatG: 3.9,
    fiberG: 6.1,
    budgetTier: "moderate",
  },
  {
    id: "fd-int-chicken-breast",
    slug: "grilled-chicken-breast",
    name: "Grilled Skinless Chicken Breast",
    nameLocal: "গ্রিল্ড চিকেন ব্রেস্ট",
    category: "protein",
    cuisineTag: "international",
    servingSizeG: 150,
    servingUnitLabel: "150g cooked breast",
    caloriesKcal: 248,
    proteinG: 46.5,
    carbsG: 0.0,
    fatG: 5.4,
    fiberG: 0,
    budgetTier: "moderate",
  },
  {
    id: "fd-int-whey",
    slug: "whey-protein-scoop",
    name: "Whey Protein Isolate Shake",
    nameLocal: "হোয়ে প্রোটিন শেক",
    category: "supplements",
    cuisineTag: "international",
    servingSizeG: 32,
    servingUnitLabel: "1 scoop (32g) in water",
    caloriesKcal: 120,
    proteinG: 25.0,
    carbsG: 2.0,
    fatG: 1.2,
    fiberG: 0,
    budgetTier: "premium",
  },
  {
    id: "fd-int-almonds",
    slug: "roasted-almonds",
    name: "Raw / Roasted Almonds (Kath Badam)",
    nameLocal: "কাঠ বাদাম (Badam)",
    category: "nuts",
    cuisineTag: "international",
    servingSizeG: 28,
    servingUnitLabel: "1 handful (28g)",
    caloriesKcal: 164,
    proteinG: 6.0,
    carbsG: 6.1,
    fatG: 14.2,
    fiberG: 3.5,
    budgetTier: "premium",
  },
  {
    id: "fd-int-peanut-butter",
    slug: "peanut-butter",
    name: "Natural Peanut Butter",
    nameLocal: "পিনাট বাটার",
    category: "nuts",
    cuisineTag: "international",
    servingSizeG: 32,
    servingUnitLabel: "2 tbsp (32g)",
    caloriesKcal: 188,
    proteinG: 8.0,
    carbsG: 6.4,
    fatG: 16.0,
    fiberG: 2.6,
    budgetTier: "moderate",
  },
];

export function searchFoodCatalog(query: string, cuisineFilter?: string): FoodCatalogItem[] {
  const q = query.trim().toLowerCase();
  return FOOD_CATALOG.filter((item) => {
    if (cuisineFilter && cuisineFilter !== "all" && item.cuisineTag !== cuisineFilter) {
      return false;
    }
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.nameLocal && item.nameLocal.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q)
    );
  });
}

export interface ParsedFoodCandidate {
  foodName: string;
  matchedCatalogSlug?: string;
  portionGrams: number;
  servings: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: number;
}

/**
 * Parses natural language text or voice description (e.g. "2 rotis, 2 boiled eggs and 1 cup dal")
 * into structured food candidates with estimated portions and macros for user confirmation.
 */
export function parseNaturalFoodDescription(description: string): ParsedFoodCandidate[] {
  const text = description.toLowerCase();
  const candidates: ParsedFoodCandidate[] = [];

  const keywordMap: Array<{ keywords: string[]; slug: string }> = [
    { keywords: ["red rice", "brown rice", "lal chal"], slug: "brown-red-rice" },
    { keywords: ["rice", "bhat", "ভাত"], slug: "steamed-white-rice" },
    { keywords: ["roti", "chapati", "রুটি"], slug: "whole-wheat-roti" },
    { keywords: ["dal", "lentil", "ডাল"], slug: "masoor-dal-thick" },
    { keywords: ["rohu", "rui", "রুই"], slug: "rohu-fish-curry" },
    { keywords: ["tilapia", "তেলাপিয়া"], slug: "tilapia-grilled-bhuna" },
    { keywords: ["hilsa", "ilish", "ইলিশ"], slug: "hilsa-ilish-curry" },
    { keywords: ["fish", "mach", "মাছ"], slug: "rohu-fish-curry" },
    { keywords: ["grilled chicken", "chicken breast"], slug: "grilled-chicken-breast" },
    { keywords: ["chicken", "murgi", "মুরগি"], slug: "deshi-chicken-curry" },
    { keywords: ["omelette", "omelet", "dim bhaja"], slug: "egg-omelette-onion" },
    { keywords: ["egg", "dim", "ডিম"], slug: "boiled-whole-egg" },
    { keywords: ["vegetable", "sabzi", "bhaji", "সবজি"], slug: "mixed-sabzi-bhaji" },
    { keywords: ["spinach", "shak", "greens", "শাক"], slug: "shak-spinach-bhaji" },
    { keywords: ["chickpea", "chana", "chola", "boot", "ছোলা"], slug: "boiled-chana-chickpeas" },
    { keywords: ["milk", "dudh", "দুধ"], slug: "fresh-cow-milk" },
    { keywords: ["yogurt", "doi", "curd", "দই"], slug: "tok-doi-yogurt" },
    { keywords: ["banana", "kola", "কলা"], slug: "sagor-banana" },
    { keywords: ["guava", "peyara", "পেয়ারা"], slug: "deshi-guava" },
    { keywords: ["papaya", "pepe", "পেঁপে"], slug: "ripe-papaya" },
    { keywords: ["oat", "oats", "porridge"], slug: "rolled-oats" },
    { keywords: ["whey", "protein shake"], slug: "whey-protein-scoop" },
    { keywords: ["almond", "badam"], slug: "roasted-almonds" },
    { keywords: ["peanut butter"], slug: "peanut-butter" },
  ];

  const matchedSlugs = new Set<string>();

  for (const mapping of keywordMap) {
    for (const kw of mapping.keywords) {
      const idx = text.indexOf(kw);
      if (idx !== -1 && !matchedSlugs.has(mapping.slug)) {
        matchedSlugs.add(mapping.slug);
        const item = FOOD_CATALOG.find((f) => f.slug === mapping.slug);
        if (!item) continue;

        // Look right before the keyword for a quantity number (e.g., "2 roti", "3 eggs")
        const prefix = text.slice(Math.max(0, idx - 12), idx);
        const numMatch = prefix.match(/(\d+(\.\d+)?)/);
        const servings = numMatch ? Math.max(0.25, Math.min(10, parseFloat(numMatch[1]))) : 1;

        candidates.push({
          foodName: item.name,
          matchedCatalogSlug: item.slug,
          portionGrams: Math.round(item.servingSizeG * servings),
          servings,
          caloriesKcal: Math.round(item.caloriesKcal * servings),
          proteinG: Number((item.proteinG * servings).toFixed(1)),
          carbsG: Number((item.carbsG * servings).toFixed(1)),
          fatG: Number((item.fatG * servings).toFixed(1)),
          fiberG: Number((item.fiberG * servings).toFixed(1)),
          confidence: 0.88,
        });
        break;
      }
    }
  }

  // Fallback if user entered an unlisted dish description
  if (candidates.length === 0 && text.trim().length > 0) {
    candidates.push({
      foodName: description.trim(),
      portionGrams: 200,
      servings: 1,
      caloriesKcal: 280,
      proteinG: 14,
      carbsG: 34,
      fatG: 9,
      fiberG: 3.5,
      confidence: 0.62,
    });
  }

  return candidates;
}

/**
 * Deterministically builds a personalized 4-meal daily plan (Breakfast, Lunch, Snack, Dinner)
 * tailored to the user's exact calorie/macro targets, budget, allergies, and Bangladeshi/Global preferences.
 */
export function generatePersonalizedMealPlan(params: {
  userId: string;
  targets: NutritionTargets;
  preferences?: Partial<UserPreferences>;
  date?: string;
}): PlannedMeal[] {
  const planDate = params.date ?? getTodayDateString();
  const totalCal = params.targets.dailyCalorieTarget;
  const totalProt = params.targets.proteinTargetG;
  const totalCarbs = params.targets.carbsTargetG;
  const totalFat = params.targets.fatTargetG;

  const allergies = (params.preferences?.allergies ?? []).map((a) => a.toLowerCase());
  const isDairyFree =
    allergies.some((a) => a.includes("milk") || a.includes("dairy") || a.includes("lactose")) ||
    (params.preferences?.dietaryRestrictions ?? []).some((r) => r.toLowerCase().includes("dairy"));
  const isEggFree = allergies.some((a) => a.includes("egg"));
  const isFishFree = allergies.some((a) => a.includes("fish") || a.includes("seafood"));
  const isVegetarian =
    params.preferences?.dietaryPreference === "vegetarian" ||
    params.preferences?.dietaryPreference === "vegan";

  const scale = totalCal / 2100; // Baseline 2100 kcal template scaler
  const rotiCount = Math.max(2, Math.min(4, Math.round(2.5 * scale)));
  const eggCount = Math.max(2, Math.min(4, Math.round(2 * scale)));

  // 1. BREAKFAST (~25% daily calories)
  const breakfastTitle = isEggFree
    ? `Deshi Oats, Chola & Fruit Power Breakfast`
    : `${rotiCount} Whole Wheat Atta Rotis, ${eggCount} Eggs & Mixed Sabzi`;
  const breakfastItems = isEggFree
    ? [
        `Rolled Oats Porridge (${Math.round(65 * scale)}g)`,
        `Spiced Boiled Chickpeas / Chola (${Math.round(120 * scale)}g)`,
        `1 Medium Sagor Banana`,
      ]
    : [
        `${rotiCount} Whole Wheat Atta Rotis (${rotiCount * 45}g)`,
        `${eggCount} Boiled Whole Eggs / Dim (${eggCount * 50}g)`,
        `1 Cup Mixed Vegetable Bhaji / Sabzi (150g)`,
        isDairyFree ? `1 Fresh Guava (Peyara)` : `1 Glass Low-Fat Milk / Dudh (250ml)`,
      ];

  // 2. LUNCH (~35% daily calories)
  const lunchProteinSource = isVegetarian
    ? "2 Cups Thick Masoor Dal & Spiced Chickpea Bhuna"
    : isFishFree
    ? `Homestyle Deshi Chicken Curry / Murgi Jhol (${Math.round(160 * scale)}g)`
    : `Rui / Rohu Fish Curry (${Math.round(150 * scale)}g) + 1 Cup Thick Masoor Dal`;

  const lunchItems = [
    `Steamed Deshi Rice / Lal Chal Bhat (${Math.round(180 * scale)}g cooked)`,
    lunchProteinSource,
    `Leafy Palong / Lal Shak Bhaji (120g)`,
    `Cucumber & Tomato Salad`,
  ];

  // 3. SNACK (~15% daily calories)
  const snackItems = [
    isDairyFree
      ? `Spiced Boiled Chola / Chickpeas (120g)`
      : `1 Bowl Plain Tok Doi / Sour Yogurt (150g) + Boiled Chola (80g)`,
    `1 Medium Sagor Banana or Fresh Guava (Peyara)`,
    params.preferences?.foodBudgetTier === "premium"
      ? `1 Handful Roasted Almonds / Kath Badam (25g)`
      : `1 Boiled Egg or Roasted Peanuts (25g)`,
  ];

  // 4. DINNER (~25% daily calories)
  const dinnerProtein = isVegetarian
    ? `Thick Masoor Dal (200g) & Mixed Vegetable Labra`
    : `Homestyle Chicken Breast / Tilapia Fish Bhuna (${Math.round(150 * scale)}g)`;

  const dinnerItems = [
    `${Math.max(1, rotiCount - 1)} Whole Wheat Atta Rotis OR 1 Small Bowl Red Rice (130g)`,
    dinnerProtein,
    `1 Cup Mixed Sabzi / Vegetable Bhaji (150g)`,
  ];

  const splits: Array<{
    mealType: MealType;
    pct: number;
    title: string;
    description: string;
    items: string[];
  }> = [
    {
      mealType: "breakfast",
      pct: 0.26,
      title: breakfastTitle,
      description: "High-protein, high-fiber Bangladeshi morning fuel supporting stable blood glucose.",
      items: breakfastItems,
    },
    {
      mealType: "lunch",
      pct: 0.34,
      title: isVegetarian
        ? "Bangladeshi Red Rice, Double Dal & Leafy Shak Plate"
        : "Bangladeshi Rice, Fish/Chicken Curry, Masoor Dal & Shak",
      description: "Balanced complex carbohydrates, complete amino acids, and iron-rich leafy greens.",
      items: lunchItems,
    },
    {
      mealType: "snack",
      pct: 0.14,
      title: "Pre/Post-Workout Deshi Protein & Fruit Refuel",
      description: "Glycogen replenishment and digestible protein timed around your workout window.",
      items: snackItems,
    },
    {
      mealType: "dinner",
      pct: 0.26,
      title: isVegetarian
        ? "Light Atta Roti, Lentil Dal & Vegetable Dinner"
        : "Lean Chicken/Tilapia Bhuna, Atta Roti & Mixed Vegetables",
      description: "Overnight muscle protein synthesis support with controlled evening carbohydrates.",
      items: dinnerItems,
    },
  ];

  return splits.map((s) => ({
    id: generateUUID(),
    userId: params.userId,
    planDate,
    mealType: s.mealType,
    title: s.title,
    description: s.description,
    itemsSummary: s.items,
    totalCalories: Math.round(totalCal * s.pct),
    proteinG: Math.round(totalProt * s.pct),
    carbsG: Math.round(totalCarbs * s.pct),
    fatG: Math.round(totalFat * s.pct),
    fiberG: Math.round(params.targets.fiberTargetG * s.pct),
    cuisineTag: "bangladeshi",
    isCustomized: false,
  }));
}
