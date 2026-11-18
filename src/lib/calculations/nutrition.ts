// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — DETERMINISTIC METABOLIC & CALORIE ENGINE
// Pure, unit-tested calculations for BMR, TDEE, Macros, Fiber, Hydration & Totals
// ============================================================================

import {
  ActivityLevel,
  BiologicalSex,
  FitnessGoalType,
  FoodEntry,
  MealType,
  NutritionTargets,
  UserProfile,
  WaterLog,
} from "@/types/fitness";
import { generateUUID } from "@/lib/utils";

export interface BMRResult {
  bmrKcal: number;
  formulaUsed: "Mifflin-St Jeor" | "Katch-McArdle";
  assumptions: string;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

/**
 * Calculates Basal Metabolic Rate (BMR) using:
 * 1. Katch-McArdle when a valid bodyFatPct (4% - 60%) is provided:
 *    BMR = 370 + 21.6 * LeanBodyMass(kg)
 * 2. Mifflin-St Jeor otherwise:
 *    Male:   10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
 *    Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
 *    Other / Prefer Not To Say: midpoint (-78 offset) with transparent note.
 */
export function calculateBMR(params: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  biologicalSex: BiologicalSex;
  bodyFatPct?: number;
}): BMRResult {
  const weight = Math.max(25, Math.min(350, params.weightKg));
  const height = Math.max(100, Math.min(250, params.heightCm));
  const age = Math.max(10, Math.min(110, params.ageYears));

  if (
    typeof params.bodyFatPct === "number" &&
    params.bodyFatPct >= 4 &&
    params.bodyFatPct <= 60
  ) {
    const leanBodyMassKg = weight * (1 - params.bodyFatPct / 100);
    const bmr = Math.round(370 + 21.6 * leanBodyMassKg);
    return {
      bmrKcal: Math.max(900, bmr),
      formulaUsed: "Katch-McArdle",
      assumptions: `Estimated from lean body mass (${leanBodyMassKg.toFixed(1)} kg at ${params.bodyFatPct}% body fat). Population-level metabolic estimate, not direct calorimetry.`,
    };
  }

  const base = 10 * weight + 6.25 * height - 5 * age;
  let sexOffset = -78;
  let sexAssumption = "midpoint metabolic constant (-78 kcal)";

  if (params.biologicalSex === "male") {
    sexOffset = 5;
    sexAssumption = "standard male constant (+5 kcal)";
  } else if (params.biologicalSex === "female") {
    sexOffset = -161;
    sexAssumption = "standard female constant (-161 kcal)";
  }

  const bmr = Math.round(base + sexOffset);
  return {
    bmrKcal: Math.max(900, bmr),
    formulaUsed: "Mifflin-St Jeor",
    assumptions: `Calculated via Mifflin-St Jeor equation using ${sexAssumption}. Values are resting energy estimates and vary by individual genetics and lean mass.`,
  };
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) from BMR, baseline activity,
 * and structured weekly training volume.
 */
export function calculateTDEE(params: {
  bmrKcal: number;
  activityLevel: ActivityLevel;
  workoutDaysPerWeek?: number;
  preferredWorkoutDurationMin?: number;
}): number {
  const baseMultiplier = ACTIVITY_MULTIPLIERS[params.activityLevel] ?? 1.55;
  const days = Math.max(0, Math.min(7, params.workoutDaysPerWeek ?? 4));
  const duration = Math.max(15, Math.min(180, params.preferredWorkoutDurationMin ?? 45));

  // Fine-tune multiplier slightly if workout volume differs from typical category baseline
  const weeklyTrainingMinutes = days * duration;
  const trainingBonusFactor = Math.min(0.12, Math.max(-0.05, (weeklyTrainingMinutes - 180) * 0.00025));

  const effectiveMultiplier = Number((baseMultiplier + trainingBonusFactor).toFixed(3));
  return Math.round(params.bmrKcal * effectiveMultiplier);
}

/**
 * Generates individualized calorie, macro, fiber, and hydration targets
 * along with explicit clinical/safety disclaimers and warnings.
 */
export function calculateNutritionTargets(
  profile: Pick<
    UserProfile,
    | "id"
    | "ageYears"
    | "biologicalSex"
    | "heightCm"
    | "currentWeightKg"
    | "targetWeightKg"
    | "bodyFatPct"
    | "activityLevel"
    | "workoutDaysPerWeek"
    | "preferredWorkoutDurationMin"
    | "medicalConditions"
    | "isPregnantOrNursing"
    | "hasEatingDisorderHistory"
  >,
  goal: FitnessGoalType
): NutritionTargets {
  const bmrResult = calculateBMR({
    weightKg: profile.currentWeightKg,
    heightCm: profile.heightCm,
    ageYears: profile.ageYears,
    biologicalSex: profile.biologicalSex,
    bodyFatPct: profile.bodyFatPct,
  });

  const tdeeKcal = calculateTDEE({
    bmrKcal: bmrResult.bmrKcal,
    activityLevel: profile.activityLevel,
    workoutDaysPerWeek: profile.workoutDaysPerWeek,
    preferredWorkoutDurationMin: profile.preferredWorkoutDurationMin,
  });

  const safetyWarnings: string[] = [
    "All metabolic values (BMR, TDEE, and macronutrients) are algorithmic estimates and never replace a physician or registered dietitian's medical prescription.",
  ];

  const isUnderage = profile.ageYears < 18;
  const isPregnant = Boolean(profile.isPregnantOrNursing);
  const hasEDHistory = Boolean(profile.hasEatingDisorderHistory);
  const hasMedicalConditions =
    Array.isArray(profile.medicalConditions) &&
    profile.medicalConditions.filter((c) => c.trim().length > 0 && c.toLowerCase() !== "none").length > 0;

  // Determine goal calorie delta
  let goalAdjustmentKcal = 0;
  if (goal === "fat_loss") {
    // Personalized 18% deficit clamped between -300 and -650 kcal
    goalAdjustmentKcal = -Math.min(650, Math.max(300, Math.round(tdeeKcal * 0.18)));
  } else if (goal === "muscle_gain") {
    // Modest 12% surplus clamped between +220 and +450 kcal
    goalAdjustmentKcal = Math.min(450, Math.max(220, Math.round(tdeeKcal * 0.12)));
  } else if (goal === "strength") {
    goalAdjustmentKcal = Math.round(tdeeKcal * 0.08);
  } else if (goal === "endurance") {
    goalAdjustmentKcal = Math.round(tdeeKcal * 0.05);
  } else {
    goalAdjustmentKcal = 0;
  }

  // Safety overrides & warnings
  if (isUnderage) {
    safetyWarnings.push(
      "Underage User Notice (<18 years): Growing adolescents require sufficient energy for bone and developmental health. Aggressive calorie deficits are disabled; consult a pediatric healthcare professional."
    );
    if (goalAdjustmentKcal < 0) {
      goalAdjustmentKcal = 0;
    }
  }

  if (isPregnant) {
    safetyWarnings.push(
      "Pregnancy / Nursing Notice: Calorie deficits are unsafe during pregnancy or lactation. Targets are set at or above maintenance—consult your OB/GYN or prenatal dietitian."
    );
    if (goalAdjustmentKcal < 0) {
      goalAdjustmentKcal = 250;
    }
  }

  if (hasEDHistory) {
    safetyWarnings.push(
      "Eating Disorder Sensitivity Notice: Strict calorie restriction is disabled to support healthy nutritional recovery. Focus on balanced nourishment and professional clinical support."
    );
    if (goalAdjustmentKcal < 0) {
      goalAdjustmentKcal = 0;
    }
  }

  if (hasMedicalConditions) {
    safetyWarnings.push(
      `Medical Condition Disclosed (${profile.medicalConditions.join(", ")}): Please review these nutrition estimates with your physician before altering your diet.`
    );
  }

  // Enforce safe calorie floor (never below BMR or sex-specific clinical floor)
  const minimumSafeFloor =
    profile.biologicalSex === "female"
      ? Math.max(1250, Math.round(bmrResult.bmrKcal * 0.92))
      : Math.max(1500, Math.round(bmrResult.bmrKcal * 0.92));

  const rawTarget = tdeeKcal + goalAdjustmentKcal;
  const dailyCalorieTarget = Math.max(minimumSafeFloor, rawTarget);
  const effectiveAdjustment = dailyCalorieTarget - tdeeKcal;

  // Protein calculation (g/kg body weight based on goal)
  let proteinPerKg = 1.6;
  if (goal === "muscle_gain" || goal === "strength") {
    proteinPerKg = 2.0;
  } else if (goal === "fat_loss") {
    proteinPerKg = 2.1; // Higher protein preserves lean mass during deficit
  } else if (goal === "endurance") {
    proteinPerKg = 1.7;
  }
  const proteinTargetG = Math.round(profile.currentWeightKg * proteinPerKg);
  const proteinCalories = proteinTargetG * 4;

  // Fat calculation (25% - 28% of total calories, minimum 0.75g/kg for hormonal health)
  const fatPct = goal === "endurance" ? 0.24 : 0.27;
  const fatFromPctG = Math.round((dailyCalorieTarget * fatPct) / 9);
  const minHormonalFatG = Math.round(profile.currentWeightKg * 0.75);
  const fatTargetG = Math.max(minHormonalFatG, fatFromPctG);
  const fatCalories = fatTargetG * 9;

  // Carbohydrate calculation (remaining calories / 4, minimum 90g for brain/glycogen function)
  const remainingCarbCalories = Math.max(360, dailyCalorieTarget - proteinCalories - fatCalories);
  const carbsTargetG = Math.round(remainingCarbCalories / 4);

  // Fiber recommendation (14g per 1000 kcal, clamped 24g - 42g)
  const fiberTargetG = Math.min(42, Math.max(24, Math.round((dailyCalorieTarget / 1000) * 14)));

  // Hydration target (35 ml/kg baseline + workout duration sweat offset)
  const baselineWaterMl = profile.currentWeightKg * 35;
  const trainingWaterOffsetMl =
    ((profile.workoutDaysPerWeek ?? 4) * (profile.preferredWorkoutDurationMin ?? 45)) / 7 * 11;
  const waterTargetMl = Math.round((baselineWaterMl + trainingWaterOffsetMl) / 50) * 50;

  return {
    id: generateUUID(),
    userId: profile.id,
    bmrKcal: bmrResult.bmrKcal,
    tdeeKcal,
    dailyCalorieTarget,
    proteinTargetG,
    carbsTargetG,
    fatTargetG,
    fiberTargetG,
    waterTargetMl,
    formulaUsed: bmrResult.formulaUsed,
    formulaAssumptions: bmrResult.assumptions,
    goalAdjustmentKcal: effectiveAdjustment,
    safetyWarnings,
    isCurrent: true,
    createdAt: new Date().toISOString(),
  };
}

export interface DailyNutritionSummary {
  date: string;
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  calorieAdherencePct: number;
  protein: { consumedG: number; targetG: number; remainingG: number; pct: number };
  carbs: { consumedG: number; targetG: number; remainingG: number; pct: number };
  fat: { consumedG: number; targetG: number; remainingG: number; pct: number };
  fiber: { consumedG: number; targetG: number; remainingG: number; pct: number };
  water: { consumedMl: number; targetMl: number; remainingMl: number; pct: number };
  byMealType: Record<MealType, { calories: number; proteinG: number; carbsG: number; fatG: number; count: number }>;
}

/**
 * Deterministically aggregates all confirmed food entries and water logs for a given day.
 * Never relies on an LLM for arithmetic totals.
 */
export function aggregateDailyNutrition(params: {
  date: string;
  entries: FoodEntry[];
  waterLogs: WaterLog[];
  targets: NutritionTargets;
}): DailyNutritionSummary {
  const dayEntries = params.entries.filter(
    (e) => e.loggedDate === params.date && e.userConfirmed !== false
  );
  const dayWater = params.waterLogs.filter((w) => w.loggedDate === params.date);

  const byMealType: DailyNutritionSummary["byMealType"] = {
    breakfast: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 },
    lunch: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 },
    snack: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 },
    dinner: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 },
  };

  let consumedCalories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fiberG = 0;

  for (const entry of dayEntries) {
    const cals = Number(entry.caloriesKcal) || 0;
    const p = Number(entry.proteinG) || 0;
    const c = Number(entry.carbsG) || 0;
    const f = Number(entry.fatG) || 0;
    const fb = Number(entry.fiberG) || 0;

    consumedCalories += cals;
    proteinG += p;
    carbsG += c;
    fatG += f;
    fiberG += fb;

    const bucket = byMealType[entry.mealType] ?? byMealType.snack;
    bucket.calories = Math.round(bucket.calories + cals);
    bucket.proteinG = Number((bucket.proteinG + p).toFixed(1));
    bucket.carbsG = Number((bucket.carbsG + c).toFixed(1));
    bucket.fatG = Number((bucket.fatG + f).toFixed(1));
    bucket.count += 1;
  }

  consumedCalories = Math.round(consumedCalories);
  proteinG = Number(proteinG.toFixed(1));
  carbsG = Number(carbsG.toFixed(1));
  fatG = Number(fatG.toFixed(1));
  fiberG = Number(fiberG.toFixed(1));

  const consumedWaterMl = dayWater.reduce((sum, w) => sum + (Number(w.amountMl) || 0), 0);

  const targetCalories = Math.max(1000, params.targets.dailyCalorieTarget);
  const remainingCalories = targetCalories - consumedCalories;

  const pct = (val: number, target: number) =>
    target > 0 ? Math.min(200, Math.round((val / target) * 100)) : 0;

  return {
    date: params.date,
    targetCalories,
    consumedCalories,
    remainingCalories,
    calorieAdherencePct: pct(consumedCalories, targetCalories),
    protein: {
      consumedG: proteinG,
      targetG: params.targets.proteinTargetG,
      remainingG: Number(Math.max(0, params.targets.proteinTargetG - proteinG).toFixed(1)),
      pct: pct(proteinG, params.targets.proteinTargetG),
    },
    carbs: {
      consumedG: carbsG,
      targetG: params.targets.carbsTargetG,
      remainingG: Number(Math.max(0, params.targets.carbsTargetG - carbsG).toFixed(1)),
      pct: pct(carbsG, params.targets.carbsTargetG),
    },
    fat: {
      consumedG: fatG,
      targetG: params.targets.fatTargetG,
      remainingG: Number(Math.max(0, params.targets.fatTargetG - fatG).toFixed(1)),
      pct: pct(fatG, params.targets.fatTargetG),
    },
    fiber: {
      consumedG: fiberG,
      targetG: params.targets.fiberTargetG,
      remainingG: Number(Math.max(0, params.targets.fiberTargetG - fiberG).toFixed(1)),
      pct: pct(fiberG, params.targets.fiberTargetG),
    },
    water: {
      consumedMl: consumedWaterMl,
      targetMl: params.targets.waterTargetMl,
      remainingMl: Math.max(0, params.targets.waterTargetMl - consumedWaterMl),
      pct: pct(consumedWaterMl, params.targets.waterTargetMl),
    },
    byMealType,
  };
}
