// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — CENTRAL ADAPTIVE AI FITNESS BRAIN SERVICE
// Coordinates Workout, Nutrition, Calorie, Recovery, Progress & Progression Engines
// ============================================================================

import {
  AIRecommendation,
  ExerciseProgressionDecisionRecord,
  FitnessGoalType,
  FoodEntry,
  NutritionTargets,
  RecoveryLog,
  UserExercisePerformance,
  UserPreferences,
  UserProfile,
  WaterLog,
  WeightLog,
  WorkoutPlan,
  WorkoutSession,
} from "@/types/fitness";
import {
  aggregateDailyNutrition,
  calculateNutritionTargets,
  DailyNutritionSummary,
} from "@/lib/calculations/nutrition";
import { generatePersonalizedWorkoutPlan } from "@/services/workout/workout-generator";
import { generatePersonalizedMealPlan } from "@/services/nutrition/food-catalog";
import { generateUUID, getTodayDateString } from "@/lib/utils";

export interface FitnessBrainSynthesisInput {
  profile: UserProfile;
  goal: FitnessGoalType;
  preferences: UserPreferences;
  sessions: WorkoutSession[];
  performanceMap: Record<string, UserExercisePerformance>;
  progressionHistory: ExerciseProgressionDecisionRecord[];
  foodEntries: FoodEntry[];
  waterLogs: WaterLog[];
  recoveryLogs: RecoveryLog[];
  weightLogs: WeightLog[];
  activeWorkoutPlan?: WorkoutPlan;
}

export interface FitnessBrainSynthesisOutput {
  nutritionTargets: NutritionTargets;
  todayNutrition: DailyNutritionSummary;
  latestReadinessScore: number;
  readinessStatus: string;
  recommendations: AIRecommendation[];
  recommendedWorkoutPlan: WorkoutPlan;
}

/**
 * Central Adaptive AI Fitness Brain coordinator.
 * Connects workout history, nutrition adherence, body metrics, and recovery into one evolving plan.
 */
export function synthesizeAdaptiveFitnessBrain(
  input: FitnessBrainSynthesisInput
): FitnessBrainSynthesisOutput {
  const today = getTodayDateString();

  // 1. Calorie & Macro Calculation Engine
  const nutritionTargets = calculateNutritionTargets(input.profile, input.goal);

  // 2. Daily Nutrition & Hydration Aggregation
  const todayNutrition = aggregateDailyNutrition({
    date: today,
    entries: input.foodEntries,
    waterLogs: input.waterLogs,
    targets: nutritionTargets,
  });

  // 3. Recovery Intelligence Evaluation
  const latestRecovery = input.recoveryLogs[0];
  const latestReadinessScore = latestRecovery?.readinessScore ?? 82;
  const readinessStatus =
    latestReadinessScore >= 78
      ? "Optimal Readiness"
      : latestReadinessScore >= 58
      ? "Moderate Readiness"
      : "Low Readiness — Volume Adjusted";

  // 4. Workout Intelligence Engine
  const recommendedWorkoutPlan =
    input.activeWorkoutPlan ??
    generatePersonalizedWorkoutPlan({
      user: input.profile,
      preferences: input.preferences,
      goal: input.goal,
      category: input.preferences.preferredTrainingCategory,
      durationMin: input.profile.preferredWorkoutDurationMin,
      availableEquipment: input.preferences.availableEquipment,
      performanceMap: input.performanceMap,
      recoveryReadinessScore: latestReadinessScore,
      soreMuscleAreas: latestRecovery?.soreAreas ?? [],
    });

  // 5. Generate Explainable Adaptive Recommendations across all modules
  const recommendations: AIRecommendation[] = [];

  // A. Progression Engine Insight
  const recentProgression = input.progressionHistory[0];
  if (recentProgression) {
    recommendations.push({
      id: generateUUID(),
      userId: input.profile.id,
      moduleSource: "progression",
      title: `${recentProgression.exerciseName}: ${recentProgression.decision.toUpperCase()} (Level ${recentProgression.previousLevel} → ${recentProgression.newLevel})`,
      summary: `Recommended prescription: ${recentProgression.recommendedVariationName} (${recentProgression.recommendedRepsOrLoad}).`,
      rationale: recentProgression.reasonSummary,
      priority: recentProgression.decision === "regress" ? "high" : "medium",
      isApplied: true,
      createdAt: recentProgression.createdAt,
    });
  } else {
    recommendations.push({
      id: generateUUID(),
      userId: input.profile.id,
      moduleSource: "progression",
      title: "Independent Per-Exercise Skill Tracking Active",
      summary: `Each movement tracks its own level (1–5) independently rather than a generic global difficulty.`,
      rationale: `Complete 2 consecutive sessions with >= 82% form score on any exercise to automatically trigger progressive overload.`,
      priority: "medium",
      isApplied: true,
      createdAt: new Date().toISOString(),
    });
  }

  // B. Recovery Intelligence Insight
  if (latestReadinessScore < 65) {
    recommendations.push({
      id: generateUUID(),
      userId: input.profile.id,
      moduleSource: "recovery",
      title: `Recovery Alert (${latestReadinessScore}% Readiness) — Volume Scaled Down`,
      summary: `Working sets reduced by ~20% and rest intervals extended by +25s for today's session.`,
      rationale: `Based on your logged sleep (${latestRecovery?.sleepHours ?? 6}h), soreness (${latestRecovery?.muscleSoreness ?? 3}/5), and fatigue (${latestRecovery?.fatigueLevel ?? 3}/5), reducing acute volume prevents CNS burnout without losing strength adaptations.`,
      priority: "high",
      isApplied: true,
      createdAt: new Date().toISOString(),
    });
  } else {
    recommendations.push({
      id: generateUUID(),
      userId: input.profile.id,
      moduleSource: "recovery",
      title: `Peak Recovery Window (${latestReadinessScore}% Readiness)`,
      summary: `Cleared for full working sets and AI Camera Trainer form verification today.`,
      rationale: `Sleep and soreness metrics indicate strong neuromuscular recovery—ideal day to push primary compound movements.`,
      priority: "low",
      isApplied: true,
      createdAt: new Date().toISOString(),
    });
  }

  // C. Nutrition & Protein Intelligence Insight
  if (todayNutrition.protein.remainingG > 30) {
    recommendations.push({
      id: generateUUID(),
      userId: input.profile.id,
      moduleSource: "nutrition",
      title: `Protein Gap: ${todayNutrition.protein.remainingG}g Remaining Today`,
      summary: `Include a high-protein Bangladeshi or global meal (e.g., 150g Rohu/Tilapia Fish or Chicken + Masoor Dal + 2 Boiled Eggs).`,
      rationale: `Your ${input.goal.replace("_", " ")} goal at ${input.profile.currentWeightKg} kg requires ${nutritionTargets.proteinTargetG}g daily protein to support myofibrillar synthesis.`,
      priority: "medium",
      isApplied: false,
      createdAt: new Date().toISOString(),
    });
  }

  // D. Workout Adaptation Insight
  recommendations.push({
    id: generateUUID(),
    userId: input.profile.id,
    moduleSource: "workout",
    title: `Personalized ${input.preferences.preferredTrainingCategory.toUpperCase()} Protocol Ready`,
    summary: `${recommendedWorkoutPlan.name} (${recommendedWorkoutPlan.exercises.length} exercises, ${recommendedWorkoutPlan.estimatedDurationMin} min).`,
    rationale: recommendedWorkoutPlan.aiRationale,
    priority: "medium",
    isApplied: true,
    createdAt: new Date().toISOString(),
  });

  return {
    nutritionTargets,
    todayNutrition,
    latestReadinessScore,
    readinessStatus,
    recommendations,
    recommendedWorkoutPlan,
  };
}
