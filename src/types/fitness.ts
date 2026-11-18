// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — CORE DOMAIN TYPES
// Strongly typed interfaces matching the 25-table PostgreSQL schema
// ============================================================================

export type BiologicalSex = "male" | "female" | "other" | "prefer_not_to_say";

export type FitnessExperienceLevel =
  | "beginner"
  | "novice"
  | "intermediate"
  | "advanced"
  | "expert";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type FitnessGoalType =
  | "muscle_gain"
  | "fat_loss"
  | "maintenance"
  | "strength"
  | "general_fitness"
  | "endurance";

export type TrainingCategory = "gym" | "home" | "calisthenics";

export type FoodBudgetTier = "budget" | "moderate" | "premium";

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export type FoodEntryMethod = "manual" | "text" | "voice" | "image";

export type ProgressionDecisionType = "progress" | "maintain" | "regress";

export type CameraExerciseKey =
  | "squat"
  | "pushup"
  | "lunge"
  | "plank"
  | "bicep-curl"
  | "shoulder-press";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  ageYears: number;
  biologicalSex: BiologicalSex;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  bodyFatPct?: number;
  fitnessExperience: FitnessExperienceLevel;
  activityLevel: ActivityLevel;
  workoutDaysPerWeek: number;
  preferredWorkoutDurationMin: number;
  injuriesLimitations: string[];
  medicalConditions: string[];
  isPregnantOrNursing?: boolean;
  hasEatingDisorderHistory?: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserGoal {
  id: string;
  userId: string;
  primaryGoal: FitnessGoalType;
  secondaryGoal?: FitnessGoalType;
  targetWeightKg: number;
  weeklyRateKg: number;
  isActive: boolean;
}

export interface UserPreferences {
  id: string;
  userId: string;
  preferredTrainingCategory: TrainingCategory;
  availableEquipment: string[];
  dietaryPreference: string;
  dietaryRestrictions: string[];
  allergies: string[];
  foodBudgetTier: FoodBudgetTier;
  cuisinePreferences: string[];
  preferredMeals: string[];
  voiceFeedbackEnabled: boolean;
  themePreference: "dark" | "light";
}

export interface ExerciseInstructionStep {
  stepNumber: number;
  instructionText: string;
  formCue: string;
  commonMistake: string;
}

export interface ExerciseCatalogItem {
  id: string;
  slug: string;
  name: string;
  category: TrainingCategory;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  movementPattern: string;
  programTags: string[];
  isCameraSupported: boolean;
  cameraAnalyzerKey?: CameraExerciseKey;
  recommendedCameraView?: string;
  defaultSets: number;
  defaultReps: string;
  defaultRestSec: number;
  caloriesPerMin: number;
  description: string;
  instructions: ExerciseInstructionStep[];
  progressionOptions: {
    easierVariationSlug?: string;
    harderVariationSlug?: string;
    pathwaySlug?: string;
    stepOrder?: number;
    prerequisiteReps?: number;
    prerequisiteFormScore?: number;
  };
}

export interface SkillPathwayNode {
  exerciseSlug: string;
  exerciseName: string;
  level: 1 | 2 | 3 | 4 | 5;
  stepOrder: number;
  prerequisiteReps: number;
  prerequisiteFormScore: number;
  description: string;
  progressionNotes: string;
}

export interface SkillPathway {
  slug: string;
  name: string;
  category: TrainingCategory;
  targetMuscle: string;
  description: string;
  nodes: SkillPathwayNode[];
}

export interface WorkoutPlanExerciseItem {
  id: string;
  exerciseId: string;
  exerciseSlug: string;
  exerciseName: string;
  primaryMuscle: string;
  equipment: string[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  orderIndex: number;
  targetSets: number;
  targetReps: string;
  restDurationSec: number;
  instructions: string[];
  formGuidance: string;
  progressionRecommendation: string;
  isCameraSupported: boolean;
  cameraAnalyzerKey?: CameraExerciseKey;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: TrainingCategory;
  goalFocus: FitnessGoalType;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  estimatedDurationMin: number;
  targetMuscles: string[];
  generatedByAi: boolean;
  generationMode: "openrouter_ai" | "deterministic_engine";
  aiRationale: string;
  exercises: WorkoutPlanExerciseItem[];
  isActive: boolean;
  createdAt: string;
}

export interface ExerciseSetLog {
  setNumber: number;
  targetReps: number;
  completedReps: number;
  goodReps: number;
  needsCorrectionReps: number;
  weightKg: number;
  durationSec: number;
  restTakenSec: number;
  formScore: number;
  romScore: number;
  rpe: number;
  feedbackSummary: string[];
}

export interface WorkoutSessionExerciseLog {
  exerciseId: string;
  exerciseSlug: string;
  exerciseName: string;
  orderIndex: number;
  completedSets: number;
  targetSets: number;
  totalReps: number;
  goodReps: number;
  badReps: number;
  averageFormScore: number;
  averageRomPct: number;
  usedCameraTrainer: boolean;
  sets: ExerciseSetLog[];
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutPlanId?: string;
  sessionName: string;
  category: TrainingCategory;
  startedAt: string;
  completedAt: string;
  durationSec: number;
  totalReps: number;
  goodReps: number;
  averageFormScore: number;
  perceivedDifficulty: number;
  caloriesBurnedEst: number;
  status: "in_progress" | "completed" | "missed" | "cancelled";
  notes?: string;
  exercises: WorkoutSessionExerciseLog[];
}

export interface UserExercisePerformance {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseSlug: string;
  exerciseName: string;
  currentLevel: 1 | 2 | 3 | 4 | 5;
  currentVariationName: string;
  personalBestReps: number;
  personalBestWeightKg: number;
  rollingFormScore: number;
  rollingConsistencyScore: number;
  consecutiveSuccessfulSessions: number;
  consecutiveStruggleSessions: number;
  lastPerformedAt: string;
}

export interface ExerciseProgressionDecisionRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseSlug: string;
  exerciseName: string;
  workoutSessionId?: string;
  previousLevel: 1 | 2 | 3 | 4 | 5;
  newLevel: 1 | 2 | 3 | 4 | 5;
  decision: ProgressionDecisionType;
  reasonSummary: string;
  recommendedVariationName: string;
  recommendedRepsOrLoad: string;
  evidenceMetrics: {
    completionRatio: number;
    formScore: number;
    romScore: number;
    consecutiveSuccesses: number;
    consecutiveStruggles: number;
    recoveryReadiness: number;
    rpe: number;
  };
  createdAt: string;
}

export interface NutritionTargets {
  id: string;
  userId: string;
  bmrKcal: number;
  tdeeKcal: number;
  dailyCalorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  fiberTargetG: number;
  waterTargetMl: number;
  formulaUsed: string;
  formulaAssumptions: string;
  goalAdjustmentKcal: number;
  safetyWarnings: string[];
  isCurrent: boolean;
  createdAt: string;
}

export interface FoodCatalogItem {
  id: string;
  slug: string;
  name: string;
  nameLocal?: string;
  category: string;
  cuisineTag: "bangladeshi" | "international";
  servingSizeG: number;
  servingUnitLabel: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  budgetTier: FoodBudgetTier;
}

export interface FoodEntry {
  id: string;
  userId: string;
  foodItemId?: string;
  loggedDate: string;
  mealType: MealType;
  foodName: string;
  entryMethod: FoodEntryMethod;
  portionGrams: number;
  servings: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  imageUrl?: string;
  aiConfidence?: number;
  userConfirmed: boolean;
  createdAt: string;
}

export interface PlannedMeal {
  id: string;
  userId: string;
  planDate: string;
  mealType: MealType;
  title: string;
  description: string;
  itemsSummary: string[];
  totalCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  cuisineTag: "bangladeshi" | "international";
  isCustomized: boolean;
}

export interface WeightLog {
  id: string;
  userId: string;
  loggedDate: string;
  weightKg: number;
  bodyFatPct?: number;
  isMeasured: boolean;
  notes?: string;
}

export interface BodyMeasurementLog {
  id: string;
  userId: string;
  loggedDate: string;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepCm?: number;
  thighCm?: number;
  neckCm?: number;
}

export interface RecoveryLog {
  id: string;
  userId: string;
  loggedDate: string;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  muscleSoreness: 1 | 2 | 3 | 4 | 5;
  soreAreas: string[];
  fatigueLevel: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  readinessScore: number;
  isRestDay: boolean;
  notes?: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  loggedDate: string;
  amountMl: number;
  loggedAt: string;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  moduleSource: "workout" | "nutrition" | "progression" | "recovery" | "general";
  title: string;
  summary: string;
  rationale: string;
  priority: "low" | "medium" | "high";
  isApplied: boolean;
  createdAt: string;
}

export interface AIChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  generationMode?: "openrouter_ai" | "deterministic_engine";
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementCode: string;
  title: string;
  description: string;
  category: "consistency" | "strength" | "form" | "nutrition" | "recovery";
  unlockedAt: string;
}
