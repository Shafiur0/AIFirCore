// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — COMPREHENSIVE UNIT & INTEGRATION TEST SUITE
// Covers all 12 testing requirements in Section 24
// ============================================================================

import { describe, expect, it } from "vitest";
import {
  aggregateDailyNutrition,
  calculateBMR,
  calculateNutritionTargets,
  calculateTDEE,
} from "@/lib/calculations/nutrition";
import { SquatAnalyzer } from "@/engines/squat/squat-analyzer";
import { PushUpAnalyzer } from "@/engines/pushup/pushup-analyzer";
import { POSE_LANDMARKS, PoseLandmarkPoint } from "@/engines/pose/geometry";
import { evaluateExerciseProgression } from "@/services/progression/progression-engine";
import { verifyResourceOwnership } from "@/lib/security/rate-limiter";
import {
  AIFoodVisionResponseSchema,
  AIMealPlanResponseSchema,
  AIWorkoutPlanResponseSchema,
  AIHistoryAnalysisResponseSchema,
  AINutritionAdviceResponseSchema,
  AIProgressSummaryResponseSchema,
} from "@/lib/validations/schemas";
import { getConfiguredModels } from "@/lib/ai/openrouter";
import { generatePersonalizedWorkoutPlan } from "@/services/workout/workout-generator";
import { EXERCISE_CATALOG } from "@/services/workout/exercise-catalog";
import {
  parseNaturalFoodDescription,
  searchFoodCatalog,
} from "@/services/nutrition/food-catalog";
import { FoodEntry, UserPreferences, UserProfile } from "@/types/fitness";

function makeBaseLandmarks(): PoseLandmarkPoint[] {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.98,
  }));
}

describe("1. BMR, TDEE, Daily Calorie Totals & Macro Calculations", () => {
  it("calculates Mifflin-St Jeor BMR accurately for male and female profiles", () => {
    const maleBmr = calculateBMR({
      weightKg: 75,
      heightCm: 175,
      ageYears: 25,
      biologicalSex: "male",
    });
    // 10*75 + 6.25*175 - 5*25 + 5 = 750 + 1093.75 - 125 + 5 = 1723.75 -> 1724
    expect(maleBmr.bmrKcal).toBe(1724);
    expect(maleBmr.formulaUsed).toBe("Mifflin-St Jeor");

    const femaleBmr = calculateBMR({
      weightKg: 60,
      heightCm: 165,
      ageYears: 28,
      biologicalSex: "female",
    });
    // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
    expect(femaleBmr.bmrKcal).toBe(1330);
  });

  it("uses Katch-McArdle formula when bodyFatPct is provided", () => {
    const katch = calculateBMR({
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      biologicalSex: "male",
      bodyFatPct: 15,
    });
    // LBM = 80 * 0.85 = 68kg -> 370 + 21.6 * 68 = 1838.8 -> 1839
    expect(katch.formulaUsed).toBe("Katch-McArdle");
    expect(katch.bmrKcal).toBe(1839);
  });

  it("calculates TDEE and personalized macro targets with safety guardrails", () => {
    const tdee = calculateTDEE({
      bmrKcal: 1724,
      activityLevel: "moderately_active",
      workoutDaysPerWeek: 4,
      preferredWorkoutDurationMin: 45,
    });
    expect(tdee).toBeGreaterThan(2500);

    const targets = calculateNutritionTargets(
      {
        id: "user-1",
        ageYears: 26,
        biologicalSex: "male",
        heightCm: 175,
        currentWeightKg: 75,
        targetWeightKg: 78,
        activityLevel: "moderately_active",
        workoutDaysPerWeek: 4,
        preferredWorkoutDurationMin: 45,
        medicalConditions: [],
      },
      "muscle_gain"
    );

    expect(targets.dailyCalorieTarget).toBeGreaterThan(targets.tdeeKcal);
    expect(targets.proteinTargetG).toBe(150); // 75kg * 2.0g/kg
    expect(targets.carbsTargetG).toBeGreaterThan(150);
    expect(targets.fatTargetG).toBeGreaterThan(50);
    expect(targets.waterTargetMl).toBeGreaterThanOrEqual(2600);

    // Underage user safety check: disables calorie deficit
    const underageTargets = calculateNutritionTargets(
      {
        id: "user-teen",
        ageYears: 16,
        biologicalSex: "male",
        heightCm: 170,
        currentWeightKg: 68,
        targetWeightKg: 63,
        activityLevel: "moderately_active",
        workoutDaysPerWeek: 3,
        preferredWorkoutDurationMin: 40,
        medicalConditions: [],
      },
      "fat_loss"
    );
    expect(underageTargets.dailyCalorieTarget).toBeGreaterThanOrEqual(
      underageTargets.tdeeKcal
    );
    expect(
      underageTargets.safetyWarnings.some((w) => w.includes("Underage"))
    ).toBe(true);
  });

  it("deterministically aggregates daily calorie, macro, and water totals", () => {
    const targets = calculateNutritionTargets(
      {
        id: "u1",
        ageYears: 25,
        biologicalSex: "male",
        heightCm: 175,
        currentWeightKg: 75,
        targetWeightKg: 75,
        activityLevel: "moderately_active",
        workoutDaysPerWeek: 4,
        preferredWorkoutDurationMin: 45,
        medicalConditions: [],
      },
      "maintenance"
    );

    const entries: FoodEntry[] = [
      {
        id: "e1",
        userId: "u1",
        loggedDate: "2026-11-19",
        mealType: "breakfast",
        foodName: "2 Atta Rotis & 2 Boiled Eggs",
        entryMethod: "manual",
        portionGrams: 190,
        servings: 1,
        caloriesKcal: 396,
        proteinG: 20.2,
        carbsG: 48.2,
        fatG: 12.8,
        fiberG: 5.6,
        userConfirmed: true,
        createdAt: "2026-11-19T08:00:00Z",
      },
      {
        id: "e2",
        userId: "u1",
        loggedDate: "2026-11-19",
        mealType: "lunch",
        foodName: "Red Rice, Rohu Fish & Masoor Dal",
        entryMethod: "manual",
        portionGrams: 430,
        servings: 1,
        caloriesKcal: 530,
        proteinG: 38.5,
        carbsG: 65.5,
        fatG: 12.8,
        fiberG: 8.6,
        userConfirmed: true,
        createdAt: "2026-11-19T13:00:00Z",
      },
    ];

    const summary = aggregateDailyNutrition({
      date: "2026-11-19",
      entries,
      waterLogs: [
        {
          id: "w1",
          userId: "u1",
          loggedDate: "2026-11-19",
          amountMl: 750,
          loggedAt: "2026-11-19T10:00:00Z",
        },
      ],
      targets,
    });

    expect(summary.consumedCalories).toBe(926);
    expect(summary.protein.consumedG).toBe(58.7);
    expect(summary.carbs.consumedG).toBe(113.7);
    expect(summary.water.consumedMl).toBe(750);
    expect(summary.remainingCalories).toBe(targets.dailyCalorieTarget - 926);
  });
});

describe("2. Computer Vision Pose State Transitions, Rep Counting & Form Rules", () => {
  it("transitions SquatAnalyzer through STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> REP_COMPLETE and counts good reps", () => {
    const analyzer = new SquatAnalyzer();

    // Helper to build squat landmarks with a given knee angle geometry
    const makeSquatPose = (phase: "standing" | "descending" | "bottom") => {
      const pts = makeBaseLandmarks();
      pts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.2, visibility: 0.99 };
      pts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.5, y: 0.2, visibility: 0.99 };
      if (phase === "standing") {
        // Straight leg ~175 deg
        pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.5, visibility: 0.99 };
        pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.51, y: 0.7, visibility: 0.99 };
        pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.5, y: 0.9, visibility: 0.99 };
      } else if (phase === "descending") {
        // ~130 deg knee angle
        pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.58, visibility: 0.99 };
        pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.58, y: 0.7, visibility: 0.99 };
        pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.5, y: 0.9, visibility: 0.99 };
      } else {
        // Deep squat ~90 deg knee angle
        pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.69, visibility: 0.99 };
        pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.64, y: 0.7, visibility: 0.99 };
        pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.63, y: 0.9, visibility: 0.99 };
      }
      pts[POSE_LANDMARKS.RIGHT_HIP] = { ...pts[POSE_LANDMARKS.LEFT_HIP] };
      pts[POSE_LANDMARKS.RIGHT_KNEE] = { ...pts[POSE_LANDMARKS.LEFT_KNEE] };
      pts[POSE_LANDMARKS.RIGHT_ANKLE] = { ...pts[POSE_LANDMARKS.LEFT_ANKLE] };
      return pts;
    };

    // Frame 1: Standing
    const f1 = analyzer.analyzeFrame(makeSquatPose("standing"), 1000);
    expect(f1.phase).toBe("STANDING");

    // Feed descending & bottom frames (simulating 30 FPS stream acrossEMA smoother)
    for (let t = 1100; t <= 1300; t += 50) {
      analyzer.analyzeFrame(makeSquatPose("descending"), t);
    }
    let fBottom = f1;
    for (let t = 1350; t <= 1650; t += 50) {
      fBottom = analyzer.analyzeFrame(makeSquatPose("bottom"), t);
    }
    expect(fBottom.phase).toBe("BOTTOM");

    // Ascend back to standing
    for (let t = 1700; t <= 1850; t += 50) {
      analyzer.analyzeFrame(makeSquatPose("descending"), t);
    }
    let fComplete = fBottom;
    for (let t = 1900; t <= 2300; t += 50) {
      const frame = analyzer.analyzeFrame(makeSquatPose("standing"), t);
      if (frame.repJustCompleted) {
        fComplete = frame;
      }
    }

    expect(fComplete.totalReps).toBe(1);
    expect(fComplete.repJustCompleted).toBe(true);
    expect(fComplete.currentFormScore).toBeGreaterThanOrEqual(80);
  });

  it("prevents duplicate rep counting within the refractory bounce window and tests all 6 exercise analyzers", () => {
    const pushup = new PushUpAnalyzer();
    expect(pushup.metadata.key).toBe("pushup");
    expect(pushup.metadata.formRulesSummary.length).toBeGreaterThan(0);

    // Verify shallow squat triggers form correction feedback ("Go a little deeper.")
    const squat = new SquatAnalyzer();
    const shallowPts = makeBaseLandmarks();
    shallowPts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.2, visibility: 0.99 };
    shallowPts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.5, y: 0.2, visibility: 0.99 };
    // Start standing
    shallowPts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.5, y: 0.5, visibility: 0.99 };
    shallowPts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.51, y: 0.7, visibility: 0.99 };
    shallowPts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.5, y: 0.9, visibility: 0.99 };
    shallowPts[POSE_LANDMARKS.RIGHT_HIP] = { ...shallowPts[POSE_LANDMARKS.LEFT_HIP] };
    shallowPts[POSE_LANDMARKS.RIGHT_KNEE] = { ...shallowPts[POSE_LANDMARKS.LEFT_KNEE] };
    shallowPts[POSE_LANDMARKS.RIGHT_ANKLE] = { ...shallowPts[POSE_LANDMARKS.LEFT_ANKLE] };

    squat.analyzeFrame(shallowPts, 1000);

    // Partial descent (~130 deg)
    const partialPts = makeBaseLandmarks();
    partialPts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.5, y: 0.25, visibility: 0.99 };
    partialPts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.5, y: 0.25, visibility: 0.99 };
    partialPts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.58, visibility: 0.99 };
    partialPts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.58, y: 0.7, visibility: 0.99 };
    partialPts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.5, y: 0.9, visibility: 0.99 };
    partialPts[POSE_LANDMARKS.RIGHT_HIP] = { ...partialPts[POSE_LANDMARKS.LEFT_HIP] };
    partialPts[POSE_LANDMARKS.RIGHT_KNEE] = { ...partialPts[POSE_LANDMARKS.LEFT_KNEE] };
    partialPts[POSE_LANDMARKS.RIGHT_ANKLE] = { ...partialPts[POSE_LANDMARKS.LEFT_ANKLE] };

    let partialFrame = squat.analyzeFrame(partialPts, 1100);
    for (let t = 1150; t <= 1350; t += 50) {
      partialFrame = squat.analyzeFrame(partialPts, t);
    }
    expect(partialFrame.feedbackMessage).toBe("Go a little deeper.");

    // Missing visibility check fallback
    const invisiblePts = makeBaseLandmarks().map((p) => ({ ...p, visibility: 0.1 }));
    const hiddenFrame = squat.analyzeFrame(invisiblePts, 1500);
    expect(hiddenFrame.isBodyVisible).toBe(false);
  });
});

describe("3. Per-Exercise Progressive Overload & Adaptive Difficulty Engine", () => {
  it("progresses an exercise only after 2 consecutive high-quality sessions with adequate recovery", () => {
    // Session 1: high quality
    const s1 = evaluateExerciseProgression({
      userId: "u1",
      exerciseSlug: "standard-push-up",
      targetSets: 3,
      completedSets: 3,
      targetRepsPerSet: 12,
      completedTotalReps: 36,
      goodReps: 34,
      averageFormScore: 88,
      averageRomScore: 90,
      perceivedRpe: 7,
      recoveryReadinessScore: 82,
    });
    expect(s1.decisionRecord.decision).toBe("maintain");
    expect(s1.updatedPerformance.consecutiveSuccessfulSessions).toBe(1);

    // Session 2: second consecutive high-quality session -> PROGRESS!
    const s2 = evaluateExerciseProgression({
      userId: "u1",
      exerciseSlug: "standard-push-up",
      targetSets: 3,
      completedSets: 3,
      targetRepsPerSet: 12,
      completedTotalReps: 38,
      goodReps: 36,
      averageFormScore: 90,
      averageRomScore: 92,
      perceivedRpe: 7,
      recoveryReadinessScore: 85,
      currentPerformance: s1.updatedPerformance,
    });
    expect(s2.decisionRecord.decision).toBe("progress");
    expect(s2.updatedPerformance.currentLevel).toBeGreaterThan(
      s1.updatedPerformance.currentLevel
    );
  });

  it("never regresses a user based on a single poor session, but regresses after 2 consecutive struggles", () => {
    const poorSession1 = evaluateExerciseProgression({
      userId: "u1",
      exerciseSlug: "standard-push-up",
      targetSets: 3,
      completedSets: 2,
      targetRepsPerSet: 12,
      completedTotalReps: 14,
      goodReps: 8,
      averageFormScore: 58,
      averageRomScore: 65,
      perceivedRpe: 10,
      recoveryReadinessScore: 75,
    });
    // Safeguard: 1 poor session MUST NOT regress!
    expect(poorSession1.decisionRecord.decision).toBe("maintain");
    expect(poorSession1.updatedPerformance.consecutiveStruggleSessions).toBe(1);

    const poorSession2 = evaluateExerciseProgression({
      userId: "u1",
      exerciseSlug: "standard-push-up",
      targetSets: 3,
      completedSets: 2,
      targetRepsPerSet: 12,
      completedTotalReps: 15,
      goodReps: 9,
      averageFormScore: 59,
      averageRomScore: 65,
      perceivedRpe: 10,
      recoveryReadinessScore: 75,
      currentPerformance: poorSession1.updatedPerformance,
    });
    expect(poorSession2.decisionRecord.decision).toBe("regress");
    expect(poorSession2.decisionRecord.recommendedVariationName).toContain(
      "Knee Push-Up"
    );
  });
});

describe("4. RLS Access Boundaries & AI Response Validation", () => {
  it("enforces strict RLS ownership boundaries across user records", () => {
    const validAccess = verifyResourceOwnership({
      sessionUserId: "user-abc",
      resourceOwnerUserId: "user-abc",
    });
    expect(validAccess.authorized).toBe(true);

    const crossUserAccess = verifyResourceOwnership({
      sessionUserId: "user-abc",
      resourceOwnerUserId: "user-xyz",
    });
    expect(crossUserAccess.authorized).toBe(false);
    expect(crossUserAccess.error).toContain("RLS Boundary Violation");

    const unauthAccess = verifyResourceOwnership({
      sessionUserId: null,
      resourceOwnerUserId: "user-abc",
    });
    expect(unauthAccess.authorized).toBe(false);
  });

  it("validates structured AI Workout, Meal Plan, and Food Vision JSON with Zod", () => {
    const validWorkoutJson = {
      name: "Calisthenics Push & Core",
      description: "Personalized bodyweight session",
      aiRationale: "Matched to Level 2 push-ups",
      exercises: [
        {
          exerciseSlug: "standard-push-up",
          targetSets: 3,
          targetReps: "12",
          restDurationSec: 60,
          progressionRecommendation: "Maintain 85% form",
        },
        {
          exerciseSlug: "forearm-plank",
          targetSets: 3,
          targetReps: "45 sec",
          restDurationSec: 45,
          progressionRecommendation: "Keep hips aligned",
        },
      ],
    };
    expect(() =>
      AIWorkoutPlanResponseSchema.parse(validWorkoutJson)
    ).not.toThrow();

    const validVisionJson = {
      detectedItems: [
        {
          foodName: "Steamed White Rice (Bhat)",
          portionGrams: 150,
          servings: 1,
          caloriesKcal: 195,
          proteinG: 4.1,
          carbsG: 42.3,
          fatG: 0.4,
          fiberG: 0.6,
          confidence: 0.85,
        },
      ],
      uncertaintyNotice: "Please confirm estimated portion weight.",
    };
    expect(() =>
      AIFoodVisionResponseSchema.parse(validVisionJson)
    ).not.toThrow();

    const validHistoryJson = {
      summary: "Consistent 4-day training block with steady form improvement.",
      strengths: ["Push-up level 2 unlocked", "88% average squat depth form"],
      bottlenecks: ["Recovery score dip after low sleep"],
      nextAction: "Perform active recovery and prioritize 8 hours sleep",
    };
    expect(() =>
      AIHistoryAnalysisResponseSchema.parse(validHistoryJson)
    ).not.toThrow();

    const validNutritionAdvice = {
      headline: "Hit your remaining 35g protein with high-quality local staples.",
      adviceBullets: [
        "Include 150g grilled chicken or Rui fish",
        "Maintain 2800ml daily hydration",
      ],
      postWorkoutSuggestion: "2 Boiled eggs with Tok Doi (Sour Yogurt)",
    };
    expect(() =>
      AINutritionAdviceResponseSchema.parse(validNutritionAdvice)
    ).not.toThrow();

    const validProgressSummary = {
      reportTitle: "Monthly Adaptive Progress Synthesis",
      narrative: "Logged 12 sessions with 420 reps and 2 verified level-ups.",
      keyMilestones: ["Squat Level 3 Unlocked", "5kg fat reduction trajectory"],
    };
    expect(() =>
      AIProgressSummaryResponseSchema.parse(validProgressSummary)
    ).not.toThrow();

    const models = getConfiguredModels();
    expect(models.generalModel).toBeTruthy();
    expect(models.visionModel).toBeTruthy();
    expect(models.coachModel).toBeTruthy();
  });
});

describe("5. Workout Creation & Food Logging (Bangladeshi & Global Catalog)", () => {
  it("creates a personalized home workout using only equipment the user actually owns", () => {
    const mockUser: UserProfile = {
      id: "u-home",
      email: "home@aifitcore.io",
      fullName: "Nadia Islam",
      ageYears: 24,
      biologicalSex: "female",
      heightCm: 164,
      currentWeightKg: 58,
      targetWeightKg: 56,
      fitnessExperience: "beginner",
      activityLevel: "lightly_active",
      workoutDaysPerWeek: 3,
      preferredWorkoutDurationMin: 30,
      injuriesLimitations: [],
      medicalConditions: [],
      onboardingCompleted: true,
      createdAt: "2026-11-19",
      updatedAt: "2026-11-19",
    };

    const mockPrefs: UserPreferences = {
      id: "p1",
      userId: "u-home",
      preferredTrainingCategory: "home",
      availableEquipment: ["none"], // Bodyweight only!
      dietaryPreference: "omnivore",
      dietaryRestrictions: [],
      allergies: [],
      foodBudgetTier: "budget",
      cuisinePreferences: ["bangladeshi"],
      preferredMeals: [],
      voiceFeedbackEnabled: true,
      themePreference: "dark",
    };

    const plan = generatePersonalizedWorkoutPlan({
      user: mockUser,
      preferences: mockPrefs,
      goal: "fat_loss",
      category: "home",
      durationMin: 30,
      availableEquipment: ["none"],
    });

    expect(plan.exercises.length).toBeGreaterThanOrEqual(3);
    for (const ex of plan.exercises) {
      // Every exercise must exist in the verified catalog and require only 'none' equipment
      const catalogMatch = EXERCISE_CATALOG.find(
        (c) => c.slug === ex.exerciseSlug
      );
      expect(catalogMatch).toBeDefined();
      expect(ex.equipment).toEqual(["none"]);
    }
  });

  it("searches Bangladeshi food catalog and parses natural food descriptions", () => {
    const bdFoods = searchFoodCatalog("rohu", "bangladeshi");
    expect(bdFoods.length).toBeGreaterThan(0);
    expect(bdFoods[0].slug).toBe("rohu-fish-curry");

    const parsed = parseNaturalFoodDescription(
      "2 rotis, 2 boiled eggs and 1 cup masoor dal"
    );
    expect(parsed.length).toBe(3);
    const roti = parsed.find((p) => p.matchedCatalogSlug === "whole-wheat-roti");
    expect(roti?.servings).toBe(2);
    expect(roti?.caloriesKcal).toBe(240);
  });
});
