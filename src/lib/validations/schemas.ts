// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — ZOD VALIDATION SCHEMAS
// Validates user inputs, API payloads, and structured OpenRouter AI responses
// ============================================================================

import { z } from "zod";

export const OnboardingProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  ageYears: z.number().int().min(12, "Age must be at least 12").max(100),
  biologicalSex: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  heightCm: z.number().min(100, "Height must be at least 100 cm").max(250),
  currentWeightKg: z.number().min(25, "Weight must be at least 25 kg").max(350),
  targetWeightKg: z.number().min(25).max(350),
  bodyFatPct: z.number().min(4).max(60).optional(),
  fitnessExperience: z.enum(["beginner", "novice", "intermediate", "advanced", "expert"]),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ]),
  workoutDaysPerWeek: z.number().int().min(1).max(7),
  preferredWorkoutDurationMin: z.number().int().min(15).max(180),
  injuriesLimitations: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  isPregnantOrNursing: z.boolean().optional(),
  hasEatingDisorderHistory: z.boolean().optional(),
  primaryGoal: z.enum([
    "muscle_gain",
    "fat_loss",
    "maintenance",
    "strength",
    "general_fitness",
    "endurance",
  ]),
  preferredTrainingCategory: z.enum(["gym", "home", "calisthenics"]),
  availableEquipment: z.array(z.string()).min(1),
  dietaryPreference: z.string().default("omnivore"),
  dietaryRestrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  foodBudgetTier: z.enum(["budget", "moderate", "premium"]).default("moderate"),
  cuisinePreferences: z.array(z.string()).default(["bangladeshi", "international"]),
  preferredMeals: z.array(z.string()).default([]),
});

export const AIWorkoutExerciseResponseSchema = z.object({
  exerciseSlug: z.string().min(1),
  targetSets: z.number().int().min(1).max(10),
  targetReps: z.string().min(1),
  restDurationSec: z.number().int().min(15).max(300),
  progressionRecommendation: z.string().min(3),
});

export const AIWorkoutPlanResponseSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(5),
  aiRationale: z.string().min(5),
  exercises: z.array(AIWorkoutExerciseResponseSchema).min(2).max(10),
});

export const AIMealItemResponseSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  title: z.string().min(3),
  description: z.string().min(3),
  itemsSummary: z.array(z.string()).min(1),
  totalCalories: z.number().min(50).max(2500),
  proteinG: z.number().min(0).max(200),
  carbsG: z.number().min(0).max(350),
  fatG: z.number().min(0).max(150),
  fiberG: z.number().min(0).max(60).default(5),
});

export const AIMealPlanResponseSchema = z.object({
  meals: z.array(AIMealItemResponseSchema).min(3).max(6),
  coachingNote: z.string().optional(),
});

export const AIFoodVisionItemSchema = z.object({
  foodName: z.string().min(1),
  portionGrams: z.number().min(5).max(2000),
  servings: z.number().min(0.1).max(20).default(1),
  caloriesKcal: z.number().min(0).max(3500),
  proteinG: z.number().min(0).max(250),
  carbsG: z.number().min(0).max(400),
  fatG: z.number().min(0).max(200),
  fiberG: z.number().min(0).max(80).default(2),
  confidence: z.number().min(0).max(1),
});

export const AIFoodVisionResponseSchema = z.object({
  detectedItems: z.array(AIFoodVisionItemSchema).min(1),
  uncertaintyNotice: z.string(),
});

export const AIHistoryAnalysisResponseSchema = z.object({
  summary: z.string().min(5),
  strengths: z.array(z.string()).min(1),
  bottlenecks: z.array(z.string()).min(1),
  nextAction: z.string().min(5),
});

export const AINutritionAdviceResponseSchema = z.object({
  headline: z.string().min(5),
  adviceBullets: z.array(z.string()).min(1),
  postWorkoutSuggestion: z.string().min(5),
});

export const AIProgressSummaryResponseSchema = z.object({
  reportTitle: z.string().min(3),
  narrative: z.string().min(5),
  keyMilestones: z.array(z.string()).min(1),
});

export const FoodEntryInputSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  foodName: z.string().min(1, "Food name is required"),
  entryMethod: z.enum(["manual", "text", "voice", "image"]).default("manual"),
  portionGrams: z.number().min(1).max(3000),
  servings: z.number().min(0.1).max(25).default(1),
  caloriesKcal: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(400),
  carbsG: z.number().min(0).max(600),
  fatG: z.number().min(0).max(300),
  fiberG: z.number().min(0).max(150).default(0),
  userConfirmed: z.boolean().default(true),
});

export const RecoveryInputSchema = z.object({
  sleepHours: z.number().min(0).max(16),
  sleepQuality: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  muscleSoreness: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  soreAreas: z.array(z.string()).default([]),
  fatigueLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  stressLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  isRestDay: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});
