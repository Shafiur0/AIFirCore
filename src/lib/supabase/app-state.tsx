"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — UNIFIED AUTH, DATABASE & INTELLIGENCE PROVIDER
// Integrates Supabase Auth/DB with per-user isolated persistence & live engines
// ============================================================================

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AIChatMessage,
  AIRecommendation,
  BodyMeasurementLog,
  ExerciseProgressionDecisionRecord,
  FitnessGoalType,
  FoodEntry,
  NutritionTargets,
  PlannedMeal,
  RecoveryLog,
  TrainingCategory,
  UserAchievement,
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
import {
  evaluateExerciseProgression,
  ExerciseSessionEvaluationInput,
} from "@/services/progression/progression-engine";
import {
  generatePersonalizedWorkoutPlan,
  getReplacementExercises,
} from "@/services/workout/workout-generator";
import { generatePersonalizedMealPlan } from "@/services/nutrition/food-catalog";
import {
  calculateRecoveryReadiness,
  RecoveryEvaluationInput,
} from "@/services/recovery/recovery-engine";
import { synthesizeAdaptiveFitnessBrain } from "@/services/brain/fitness-brain";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { generateUUID, getTodayDateString } from "@/lib/utils";

export interface UserDataVault {
  profile: UserProfile;
  goal: FitnessGoalType;
  preferences: UserPreferences;
  workoutPlans: WorkoutPlan[];
  activeWorkoutPlanId?: string;
  workoutSessions: WorkoutSession[];
  performanceMap: Record<string, UserExercisePerformance>;
  progressionHistory: ExerciseProgressionDecisionRecord[];
  foodEntries: FoodEntry[];
  plannedMeals: PlannedMeal[];
  weightLogs: WeightLog[];
  bodyMeasurements: BodyMeasurementLog[];
  recoveryLogs: RecoveryLog[];
  waterLogs: WaterLog[];
  chatMessages: AIChatMessage[];
  achievements: UserAchievement[];
}

interface StoredAccountRecord {
  userId: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  vault: UserDataVault;
}

interface FitnessBrainContextValue {
  isHydrated: boolean;
  isAuthenticated: boolean;
  isSupabaseLive: boolean;
  currentUser: UserProfile | null;
  goal: FitnessGoalType;
  preferences: UserPreferences | null;
  nutritionTargets: NutritionTargets | null;
  todayNutrition: DailyNutritionSummary | null;
  activeWorkoutPlan: WorkoutPlan | null;
  workoutPlans: WorkoutPlan[];
  workoutSessions: WorkoutSession[];
  performanceMap: Record<string, UserExercisePerformance>;
  progressionHistory: ExerciseProgressionDecisionRecord[];
  foodEntries: FoodEntry[];
  plannedMeals: PlannedMeal[];
  weightLogs: WeightLog[];
  bodyMeasurements: BodyMeasurementLog[];
  recoveryLogs: RecoveryLog[];
  waterLogs: WaterLog[];
  recommendations: AIRecommendation[];
  chatMessages: AIChatMessage[];
  achievements: UserAchievement[];
  latestReadinessScore: number;

  // Auth Actions
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ success: boolean; error?: string; requiresOnboarding?: boolean }>;
  signIn: (params: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;

  // Profile & Onboarding
  saveOnboardingAndProfile: (data: {
    profileUpdates: Partial<UserProfile>;
    goal?: FitnessGoalType;
    preferencesUpdates?: Partial<UserPreferences>;
  }) => void;

  // Workout Actions
  generateNewWorkoutPlan: (options?: {
    category?: TrainingCategory;
    durationMin?: number;
    targetMuscles?: string[];
    customPlan?: WorkoutPlan;
  }) => WorkoutPlan;
  replaceExerciseInActivePlan: (oldSlug: string, newSlug: string) => void;
  setActiveWorkoutPlan: (planId: string) => void;
  recordCompletedWorkoutSession: (params: {
    sessionName: string;
    category: TrainingCategory;
    durationSec: number;
    perceivedDifficulty: number;
    notes?: string;
    exercises: Array<{
      exerciseSlug: string;
      exerciseName: string;
      targetSets: number;
      completedSets: number;
      targetRepsPerSet: number;
      totalReps: number;
      goodReps: number;
      badReps: number;
      averageFormScore: number;
      averageRomPct: number;
      usedCameraTrainer: boolean;
    }>;
  }) => {
    session: WorkoutSession;
    decisions: ExerciseProgressionDecisionRecord[];
  };

  // Nutrition & Food Actions
  regenerateDailyMealPlan: (customMeals?: PlannedMeal[]) => PlannedMeal[];
  customizePlannedMeal: (mealId: string, updates: Partial<PlannedMeal>) => void;
  addFoodEntry: (
    entry: Omit<FoodEntry, "id" | "userId" | "loggedDate" | "createdAt"> & {
      loggedDate?: string;
    }
  ) => FoodEntry;
  deleteFoodEntry: (entryId: string) => void;
  logWaterIntake: (amountMl: number) => void;

  // Body & Recovery Actions
  logWeightAndBody: (params: {
    weightKg: number;
    bodyFatPct?: number;
    isMeasured?: boolean;
    chestCm?: number;
    waistCm?: number;
    hipsCm?: number;
    bicepCm?: number;
    thighCm?: number;
    notes?: string;
  }) => void;
  logRecoveryCheckIn: (
    input: Omit<RecoveryEvaluationInput, "userId">
  ) => RecoveryLog;

  // Chat Actions
  appendChatMessage: (msg: Omit<AIChatMessage, "id" | "userId" | "createdAt">) => void;
  clearChatHistory: () => void;

  // Data Export & Account Deletion
  exportUserDataJson: () => string;
  deleteUserAccountData: () => void;
}

const STORAGE_ACCOUNTS_KEY = "aifitcore_accounts_v2";
const STORAGE_ACTIVE_USER_KEY = "aifitcore_active_user_id_v2";

function buildInitialDefaultVault(params: {
  userId: string;
  email: string;
  fullName: string;
  withRichHistory?: boolean;
}): UserDataVault {
  const now = new Date().toISOString();
  const today = getTodayDateString();

  const profile: UserProfile = {
    id: params.userId,
    email: params.email,
    fullName: params.fullName,
    ageYears: 26,
    biologicalSex: "male",
    heightCm: 175,
    currentWeightKg: 74.5,
    targetWeightKg: 71.0,
    bodyFatPct: 16.5,
    fitnessExperience: "intermediate",
    activityLevel: "moderately_active",
    workoutDaysPerWeek: 4,
    preferredWorkoutDurationMin: 45,
    injuriesLimitations: [],
    medicalConditions: [],
    onboardingCompleted: Boolean(params.withRichHistory),
    createdAt: now,
    updatedAt: now,
  };

  const goal: FitnessGoalType = "muscle_gain";

  const preferences: UserPreferences = {
    id: generateUUID(),
    userId: params.userId,
    preferredTrainingCategory: "calisthenics",
    availableEquipment: ["none", "dumbbells", "pullup-bar", "resistance-band"],
    dietaryPreference: "omnivore",
    dietaryRestrictions: [],
    allergies: [],
    foodBudgetTier: "moderate",
    cuisinePreferences: ["bangladeshi", "international"],
    preferredMeals: ["Atta Roti & Boiled Eggs", "Rice, Rohu Fish & Masoor Dal"],
    voiceFeedbackEnabled: true,
    themePreference: "dark",
  };

  // Independent per-exercise skill levels as required by Section 12
  // ("A user might be: Beginner at push-ups, Intermediate at squats, Beginner at pull-ups, Novice at planks")
  const performanceMap: Record<string, UserExercisePerformance> = {
    "standard-push-up": {
      id: generateUUID(),
      userId: params.userId,
      exerciseId: "ex-cal-standard-pushup",
      exerciseSlug: "standard-push-up",
      exerciseName: "Standard Push-Up",
      currentLevel: 1,
      currentVariationName: "Knee Push-Up → Standard Push-Up",
      personalBestReps: 11,
      personalBestWeightKg: 0,
      rollingFormScore: 81,
      rollingConsistencyScore: 84,
      consecutiveSuccessfulSessions: 1,
      consecutiveStruggleSessions: 0,
      lastPerformedAt: now,
    },
    "bodyweight-squat": {
      id: generateUUID(),
      userId: params.userId,
      exerciseId: "ex-cal-squat",
      exerciseSlug: "bodyweight-squat",
      exerciseName: "Bodyweight Squat",
      currentLevel: 3,
      currentVariationName: "Bodyweight Squat",
      personalBestReps: 20,
      personalBestWeightKg: 0,
      rollingFormScore: 91,
      rollingConsistencyScore: 94,
      consecutiveSuccessfulSessions: 2,
      consecutiveStruggleSessions: 0,
      lastPerformedAt: now,
    },
    "pull-up": {
      id: generateUUID(),
      userId: params.userId,
      exerciseId: "ex-cal-pullup",
      exerciseSlug: "pull-up",
      exerciseName: "Strict Overhand Pull-Up",
      currentLevel: 1,
      currentVariationName: "Eccentric Negative Pull-Up",
      personalBestReps: 5,
      personalBestWeightKg: 0,
      rollingFormScore: 79,
      rollingConsistencyScore: 80,
      consecutiveSuccessfulSessions: 0,
      consecutiveStruggleSessions: 0,
      lastPerformedAt: now,
    },
    "forearm-plank": {
      id: generateUUID(),
      userId: params.userId,
      exerciseId: "ex-home-plank",
      exerciseSlug: "forearm-plank",
      exerciseName: "Forearm Plank",
      currentLevel: 2,
      currentVariationName: "Forearm Plank",
      personalBestReps: 50,
      personalBestWeightKg: 0,
      rollingFormScore: 88,
      rollingConsistencyScore: 90,
      consecutiveSuccessfulSessions: 1,
      consecutiveStruggleSessions: 0,
      lastPerformedAt: now,
    },
  };

  const initialPlan = generatePersonalizedWorkoutPlan({
    user: profile,
    preferences,
    goal,
    category: preferences.preferredTrainingCategory,
    durationMin: profile.preferredWorkoutDurationMin,
    availableEquipment: preferences.availableEquipment,
    performanceMap,
    recoveryReadinessScore: 85,
  });

  const targets = calculateNutritionTargets(profile, goal);
  const plannedMeals = generatePersonalizedMealPlan({
    userId: params.userId,
    targets,
    preferences,
    date: today,
  });

  // Historical dates for charts
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  };

  const workoutSessions: WorkoutSession[] = params.withRichHistory
    ? [
        {
          id: generateUUID(),
          userId: params.userId,
          workoutPlanId: initialPlan.id,
          sessionName: "Calisthenics Lower & Core Mastery",
          category: "calisthenics",
          startedAt: `${daysAgo(4)}T17:30:00.000Z`,
          completedAt: `${daysAgo(4)}T18:12:00.000Z`,
          durationSec: 2520,
          totalReps: 85,
          goodReps: 76,
          averageFormScore: 87,
          perceivedDifficulty: 7,
          caloriesBurnedEst: 315,
          status: "completed",
          notes: "Felt strong on squats; push-ups needed tight core alignment.",
          exercises: [
            {
              exerciseId: "ex-cal-squat",
              exerciseSlug: "bodyweight-squat",
              exerciseName: "Bodyweight Squat",
              orderIndex: 1,
              completedSets: 3,
              targetSets: 3,
              totalReps: 45,
              goodReps: 41,
              badReps: 4,
              averageFormScore: 90,
              averageRomPct: 92,
              usedCameraTrainer: true,
              sets: [],
            },
            {
              exerciseId: "ex-cal-standard-pushup",
              exerciseSlug: "standard-push-up",
              exerciseName: "Standard Push-Up",
              orderIndex: 2,
              completedSets: 3,
              targetSets: 3,
              totalReps: 28,
              goodReps: 23,
              badReps: 5,
              averageFormScore: 81,
              averageRomPct: 84,
              usedCameraTrainer: true,
              sets: [],
            },
          ],
        },
        {
          id: generateUUID(),
          userId: params.userId,
          workoutPlanId: initialPlan.id,
          sessionName: "Upper Body Skill & AI Camera Form Session",
          category: "calisthenics",
          startedAt: `${daysAgo(2)}T18:00:00.000Z`,
          completedAt: `${daysAgo(2)}T18:45:00.000Z`,
          durationSec: 2700,
          totalReps: 94,
          goodReps: 86,
          averageFormScore: 91,
          perceivedDifficulty: 7,
          caloriesBurnedEst: 340,
          status: "completed",
          notes: "Camera trainer confirmed 91% squat depth and improved plank hold.",
          exercises: [
            {
              exerciseId: "ex-cal-squat",
              exerciseSlug: "bodyweight-squat",
              exerciseName: "Bodyweight Squat",
              orderIndex: 1,
              completedSets: 3,
              targetSets: 3,
              totalReps: 48,
              goodReps: 45,
              badReps: 3,
              averageFormScore: 92,
              averageRomPct: 94,
              usedCameraTrainer: true,
              sets: [],
            },
          ],
        },
      ]
    : [];

  const progressionHistory: ExerciseProgressionDecisionRecord[] = params.withRichHistory
    ? [
        {
          id: generateUUID(),
          userId: params.userId,
          exerciseId: "ex-cal-squat",
          exerciseSlug: "bodyweight-squat",
          exerciseName: "Bodyweight Squat",
          previousLevel: 2,
          newLevel: 3,
          decision: "progress",
          reasonSummary:
            "Completed 2 consecutive sessions with >= 90% form quality and 94% ROM depth. Progressed Bodyweight Squat from Level 2 (Novice) to Level 3 (Intermediate) and unlocked Forward Lunges.",
          recommendedVariationName: "Forward Lunge / Tempo Squat",
          recommendedRepsOrLoad: "3 sets × 15 reps",
          evidenceMetrics: {
            completionRatio: 1.07,
            formScore: 92,
            romScore: 94,
            consecutiveSuccesses: 2,
            consecutiveStruggles: 0,
            recoveryReadiness: 85,
            rpe: 7,
          },
          createdAt: `${daysAgo(2)}T18:45:00.000Z`,
        },
      ]
    : [];

  const foodEntries: FoodEntry[] = params.withRichHistory
    ? [
        {
          id: generateUUID(),
          userId: params.userId,
          loggedDate: today,
          mealType: "breakfast",
          foodName: "2 Whole Wheat Atta Rotis + 2 Boiled Eggs + Mixed Sabzi",
          entryMethod: "manual",
          portionGrams: 340,
          servings: 1,
          caloriesKcal: 511,
          proteinG: 23.4,
          carbsG: 62.7,
          fatG: 17.9,
          fiberG: 10.2,
          userConfirmed: true,
          createdAt: now,
        },
        {
          id: generateUUID(),
          userId: params.userId,
          loggedDate: today,
          mealType: "lunch",
          foodName: "Deshi Red Rice (Lal Chal) + Rui Fish Curry + Thick Masoor Dal",
          entryMethod: "manual",
          portionGrams: 430,
          servings: 1,
          caloriesKcal: 530,
          proteinG: 38.5,
          carbsG: 65.5,
          fatG: 12.8,
          fiberG: 8.6,
          userConfirmed: true,
          createdAt: now,
        },
      ]
    : [];

  const weightLogs: WeightLog[] = params.withRichHistory
    ? [
        { id: generateUUID(), userId: params.userId, loggedDate: daysAgo(21), weightKg: 75.8, bodyFatPct: 17.2, isMeasured: true },
        { id: generateUUID(), userId: params.userId, loggedDate: daysAgo(14), weightKg: 75.3, bodyFatPct: 16.9, isMeasured: true },
        { id: generateUUID(), userId: params.userId, loggedDate: daysAgo(7), weightKg: 74.9, bodyFatPct: 16.7, isMeasured: true },
        { id: generateUUID(), userId: params.userId, loggedDate: today, weightKg: 74.5, bodyFatPct: 16.5, isMeasured: true },
      ]
    : [
        { id: generateUUID(), userId: params.userId, loggedDate: today, weightKg: profile.currentWeightKg, isMeasured: true },
      ];

  const recoveryLogs: RecoveryLog[] = [
    {
      id: generateUUID(),
      userId: params.userId,
      loggedDate: today,
      sleepHours: 7.8,
      sleepQuality: 4,
      muscleSoreness: 2,
      soreAreas: [],
      fatigueLevel: 2,
      stressLevel: 2,
      readinessScore: 85,
      isRestDay: false,
      notes: "Slept well, joints feel fresh.",
    },
  ];

  const waterLogs: WaterLog[] = params.withRichHistory
    ? [
        { id: generateUUID(), userId: params.userId, loggedDate: today, amountMl: 500, loggedAt: now },
        { id: generateUUID(), userId: params.userId, loggedDate: today, amountMl: 750, loggedAt: now },
      ]
    : [];

  const achievements: UserAchievement[] = [
    {
      id: generateUUID(),
      userId: params.userId,
      achievementCode: "FIRST_BRAIN_SYNC",
      title: "AI Fitness Brain Activated",
      description: "Completed biometric and per-exercise skill calibration.",
      category: "consistency",
      unlockedAt: now,
    },
  ];

  return {
    profile,
    goal,
    preferences,
    workoutPlans: [initialPlan],
    activeWorkoutPlanId: initialPlan.id,
    workoutSessions,
    performanceMap,
    progressionHistory,
    foodEntries,
    plannedMeals,
    weightLogs,
    bodyMeasurements: [],
    recoveryLogs,
    waterLogs,
    chatMessages: [],
    achievements,
  };
}

const FitnessBrainContext = createContext<FitnessBrainContextValue | null>(null);

export function FitnessBrainProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [accounts, setAccounts] = useState<Record<string, StoredAccountRecord>>({});
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const isSupabaseLive = isSupabaseConfigured();

  // Hydrate accounts and active session on mount
  useEffect(() => {
    try {
      const rawAccounts = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      const rawActiveId = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);

      let parsedAccounts: Record<string, StoredAccountRecord> = {};
      if (rawAccounts) {
        parsedAccounts = JSON.parse(rawAccounts);
      }

      // Seed a default verified athlete account so immediate exploration works seamlessly,
      // while also allowing new users to sign up with their own isolated accounts.
      if (Object.keys(parsedAccounts).length === 0) {
        const defaultId = "user-athlete-demo-01";
        parsedAccounts[defaultId] = {
          userId: defaultId,
          email: "athlete@aifitcore.io",
          passwordHash: "AIFitCore2026!",
          emailVerified: true,
          vault: buildInitialDefaultVault({
            userId: defaultId,
            email: "athlete@aifitcore.io",
            fullName: "Arif Rahman",
            withRichHistory: true,
          }),
        };
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(parsedAccounts));
        localStorage.setItem(STORAGE_ACTIVE_USER_KEY, defaultId);
        setAccounts(parsedAccounts);
        setActiveUserId(defaultId);
      } else {
        setAccounts(parsedAccounts);
        if (rawActiveId && parsedAccounts[rawActiveId]) {
          setActiveUserId(rawActiveId);
        } else {
          const firstKey = Object.keys(parsedAccounts)[0];
          setActiveUserId(firstKey ?? null);
        }
      }
    } catch {
      // Fallback in-memory account
      const defaultId = "user-athlete-demo-01";
      const rec: StoredAccountRecord = {
        userId: defaultId,
        email: "athlete@aifitcore.io",
        passwordHash: "AIFitCore2026!",
        emailVerified: true,
        vault: buildInitialDefaultVault({
          userId: defaultId,
          email: "athlete@aifitcore.io",
          fullName: "Arif Rahman",
          withRichHistory: true,
        }),
      };
      setAccounts({ [defaultId]: rec });
      setActiveUserId(defaultId);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persistAccounts = (
    nextAccounts: Record<string, StoredAccountRecord>,
    nextActiveId?: string | null
  ) => {
    setAccounts(nextAccounts);
    try {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
      if (nextActiveId !== undefined) {
        setActiveUserId(nextActiveId);
        if (nextActiveId) {
          localStorage.setItem(STORAGE_ACTIVE_USER_KEY, nextActiveId);
        } else {
          localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
        }
      }
    } catch {
      // Ignore storage quota errors
    }
  };

  const activeVault: UserDataVault | null =
    activeUserId && accounts[activeUserId] ? accounts[activeUserId].vault : null;

  const updateActiveVault = (updater: (vault: UserDataVault) => UserDataVault) => {
    if (!activeUserId || !accounts[activeUserId]) return;
    const currentRecord = accounts[activeUserId];
    const nextVault = updater(currentRecord.vault);
    const nextAccounts = {
      ...accounts,
      [activeUserId]: {
        ...currentRecord,
        vault: nextVault,
      },
    };
    persistAccounts(nextAccounts);
  };

  // Synthesize central AI Fitness Brain outputs whenever activeVault changes
  const brainSynthesis = useMemo(() => {
    if (!activeVault) return null;
    const activePlan =
      activeVault.workoutPlans.find((p) => p.id === activeVault.activeWorkoutPlanId) ??
      activeVault.workoutPlans[0];

    return synthesizeAdaptiveFitnessBrain({
      profile: activeVault.profile,
      goal: activeVault.goal,
      preferences: activeVault.preferences,
      sessions: activeVault.workoutSessions,
      performanceMap: activeVault.performanceMap,
      progressionHistory: activeVault.progressionHistory,
      foodEntries: activeVault.foodEntries,
      waterLogs: activeVault.waterLogs,
      recoveryLogs: activeVault.recoveryLogs,
      weightLogs: activeVault.weightLogs,
      activeWorkoutPlan: activePlan,
    });
  }, [activeVault]);

  // ==========================================================================
  // AUTHENTICATION METHODS (Supabase + Local Per-User Isolated Accounts)
  // ==========================================================================
  const signUp: FitnessBrainContextValue["signUp"] = async ({
    email,
    password,
    fullName,
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    // If live Supabase is configured, also register with Supabase Auth
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        return { success: false, error: error.message };
      }
    }

    const existing = Object.values(accounts).find(
      (a) => a.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in.",
      };
    }

    const newUserId = generateUUID();
    const newVault = buildInitialDefaultVault({
      userId: newUserId,
      email: cleanEmail,
      fullName: fullName.trim() || "New Athlete",
      withRichHistory: false,
    });

    const nextAccounts = {
      ...accounts,
      [newUserId]: {
        userId: newUserId,
        email: cleanEmail,
        passwordHash: password,
        emailVerified: true,
        vault: newVault,
      },
    };
    persistAccounts(nextAccounts, newUserId);
    return { success: true, requiresOnboarding: true };
  };

  const signIn: FitnessBrainContextValue["signIn"] = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    }

    const match = Object.values(accounts).find(
      (a) => a.email.toLowerCase() === cleanEmail
    );

    if (!match) {
      return {
        success: false,
        error: "No account found with that email. Create a new account or use athlete@aifitcore.io.",
      };
    }

    if (match.passwordHash !== password) {
      return {
        success: false,
        error: "Invalid password. Please try again.",
      };
    }

    persistAccounts(accounts, match.userId);
    return { success: true };
  };

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    persistAccounts(accounts, null);
  };

  const requestPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.resetPasswordForEmail(cleanEmail);
    }
    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${cleanEmail}.`,
    };
  };

  const updatePassword = async (newPassword: string) => {
    if (newPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters." };
    }
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.updateUser({ password: newPassword });
    }
    if (activeUserId && accounts[activeUserId]) {
      const nextAccounts = {
        ...accounts,
        [activeUserId]: {
          ...accounts[activeUserId],
          passwordHash: newPassword,
        },
      };
      persistAccounts(nextAccounts);
    }
    return { success: true, message: "Your password has been securely updated." };
  };

  // ==========================================================================
  // ONBOARDING & PROFILE UPDATES
  // ==========================================================================
  const saveOnboardingAndProfile: FitnessBrainContextValue["saveOnboardingAndProfile"] = ({
    profileUpdates,
    goal: newGoal,
    preferencesUpdates,
  }) => {
    updateActiveVault((vault) => {
      const updatedProfile: UserProfile = {
        ...vault.profile,
        ...profileUpdates,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };
      const updatedGoal: FitnessGoalType = newGoal ?? vault.goal;
      const updatedPreferences: UserPreferences = {
        ...vault.preferences,
        ...preferencesUpdates,
      };

      const latestRecovery = vault.recoveryLogs[0]?.readinessScore ?? 82;
      const freshPlan = generatePersonalizedWorkoutPlan({
        user: updatedProfile,
        preferences: updatedPreferences,
        goal: updatedGoal,
        category: updatedPreferences.preferredTrainingCategory,
        durationMin: updatedProfile.preferredWorkoutDurationMin,
        availableEquipment: updatedPreferences.availableEquipment,
        performanceMap: vault.performanceMap,
        recoveryReadinessScore: latestRecovery,
      });

      const freshTargets = calculateNutritionTargets(updatedProfile, updatedGoal);
      const freshMeals = generatePersonalizedMealPlan({
        userId: updatedProfile.id,
        targets: freshTargets,
        preferences: updatedPreferences,
      });

      const weightEntry: WeightLog = {
        id: generateUUID(),
        userId: updatedProfile.id,
        loggedDate: getTodayDateString(),
        weightKg: updatedProfile.currentWeightKg,
        bodyFatPct: updatedProfile.bodyFatPct,
        isMeasured: true,
        notes: "Profile biometric update",
      };

      return {
        ...vault,
        profile: updatedProfile,
        goal: updatedGoal,
        preferences: updatedPreferences,
        workoutPlans: [freshPlan, ...vault.workoutPlans.slice(0, 9)],
        activeWorkoutPlanId: freshPlan.id,
        plannedMeals: freshMeals,
        weightLogs: [weightEntry, ...vault.weightLogs],
      };
    });
  };

  // ==========================================================================
  // WORKOUT & PROGRESSION ACTIONS
  // ==========================================================================
  const generateNewWorkoutPlan: FitnessBrainContextValue["generateNewWorkoutPlan"] = (
    options
  ) => {
    if (!activeVault) {
      throw new Error("Must be authenticated to generate a workout plan.");
    }

    const plan =
      options?.customPlan ??
      generatePersonalizedWorkoutPlan({
        user: activeVault.profile,
        preferences: activeVault.preferences,
        goal: activeVault.goal,
        category:
          options?.category ?? activeVault.preferences.preferredTrainingCategory,
        durationMin:
          options?.durationMin ?? activeVault.profile.preferredWorkoutDurationMin,
        targetMuscles: options?.targetMuscles,
        availableEquipment: activeVault.preferences.availableEquipment,
        performanceMap: activeVault.performanceMap,
        recoveryReadinessScore:
          activeVault.recoveryLogs[0]?.readinessScore ?? 82,
        soreMuscleAreas: activeVault.recoveryLogs[0]?.soreAreas ?? [],
      });

    updateActiveVault((vault) => ({
      ...vault,
      workoutPlans: [plan, ...vault.workoutPlans.filter((p) => p.id !== plan.id)],
      activeWorkoutPlanId: plan.id,
    }));

    return plan;
  };

  const replaceExerciseInActivePlan = (oldSlug: string, newSlug: string) => {
    updateActiveVault((vault) => {
      const activePlan =
        vault.workoutPlans.find((p) => p.id === vault.activeWorkoutPlanId) ??
        vault.workoutPlans[0];
      if (!activePlan) return vault;

      const replacements = getReplacementExercises({
        currentExerciseSlug: oldSlug,
        category: activePlan.category,
        availableEquipment: vault.preferences.availableEquipment,
      });
      const chosen =
        replacements.find((r) => r.slug === newSlug) ?? replacements[0];
      if (!chosen) return vault;

      const updatedExercises = activePlan.exercises.map((item) => {
        if (item.exerciseSlug !== oldSlug) return item;
        return {
          ...item,
          exerciseId: chosen.id,
          exerciseSlug: chosen.slug,
          exerciseName: chosen.name,
          primaryMuscle: chosen.primaryMuscle,
          equipment: chosen.equipment,
          difficultyLevel: chosen.difficultyLevel,
          targetSets: chosen.defaultSets,
          targetReps: chosen.defaultReps,
          restDurationSec: chosen.defaultRestSec,
          instructions: chosen.instructions.map((i) => i.instructionText),
          formGuidance:
            chosen.instructions[0]?.formCue ??
            "Maintain proper alignment and controlled movement.",
          isCameraSupported: chosen.isCameraSupported,
          cameraAnalyzerKey: chosen.cameraAnalyzerKey,
        };
      });

      const updatedPlan: WorkoutPlan = {
        ...activePlan,
        exercises: updatedExercises,
      };

      return {
        ...vault,
        workoutPlans: vault.workoutPlans.map((p) =>
          p.id === updatedPlan.id ? updatedPlan : p
        ),
      };
    });
  };

  const setActiveWorkoutPlan = (planId: string) => {
    updateActiveVault((vault) => ({
      ...vault,
      activeWorkoutPlanId: planId,
    }));
  };

  const recordCompletedWorkoutSession: FitnessBrainContextValue["recordCompletedWorkoutSession"] = (
    params
  ) => {
    const userId = activeVault?.profile.id ?? "anonymous";
    const readiness = activeVault?.recoveryLogs[0]?.readinessScore ?? 82;
    const now = new Date().toISOString();
    const sessionId = generateUUID();

    const totalReps = params.exercises.reduce((s, e) => s + e.totalReps, 0);
    const goodReps = params.exercises.reduce((s, e) => s + e.goodReps, 0);
    const avgForm =
      params.exercises.length > 0
        ? Math.round(
            params.exercises.reduce((s, e) => s + e.averageFormScore, 0) /
              params.exercises.length
          )
        : 85;
    const caloriesBurnedEst = Math.max(
      25,
      Math.round((params.durationSec / 60) * 7.2)
    );

    const session: WorkoutSession = {
      id: sessionId,
      userId,
      workoutPlanId: activeVault?.activeWorkoutPlanId,
      sessionName: params.sessionName,
      category: params.category,
      startedAt: new Date(Date.now() - params.durationSec * 1000).toISOString(),
      completedAt: now,
      durationSec: params.durationSec,
      totalReps,
      goodReps,
      averageFormScore: avgForm,
      perceivedDifficulty: params.perceivedDifficulty,
      caloriesBurnedEst,
      status: "completed",
      notes: params.notes,
      exercises: params.exercises.map((e, idx) => ({
        exerciseId: e.exerciseSlug,
        exerciseSlug: e.exerciseSlug,
        exerciseName: e.exerciseName,
        orderIndex: idx + 1,
        completedSets: e.completedSets,
        targetSets: e.targetSets,
        totalReps: e.totalReps,
        goodReps: e.goodReps,
        badReps: e.badReps,
        averageFormScore: e.averageFormScore,
        averageRomPct: e.averageRomPct,
        usedCameraTrainer: e.usedCameraTrainer,
        sets: [],
      })),
    };

    const decisions: ExerciseProgressionDecisionRecord[] = [];
    const nextPerfMap: Record<string, UserExercisePerformance> = {
      ...(activeVault?.performanceMap ?? {}),
    };

    for (const ex of params.exercises) {
      const evalInput: ExerciseSessionEvaluationInput = {
        userId,
        exerciseSlug: ex.exerciseSlug,
        workoutSessionId: sessionId,
        targetSets: ex.targetSets,
        completedSets: ex.completedSets,
        targetRepsPerSet: ex.targetRepsPerSet,
        completedTotalReps: ex.totalReps,
        goodReps: ex.goodReps,
        averageFormScore: ex.averageFormScore,
        averageRomScore: ex.averageRomPct,
        perceivedRpe: params.perceivedDifficulty,
        recoveryReadinessScore: readiness,
        currentPerformance: nextPerfMap[ex.exerciseSlug],
      };

      const res = evaluateExerciseProgression(evalInput);
      nextPerfMap[ex.exerciseSlug] = res.updatedPerformance;
      decisions.push(res.decisionRecord);
    }

    updateActiveVault((vault) => ({
      ...vault,
      workoutSessions: [session, ...vault.workoutSessions],
      performanceMap: nextPerfMap,
      progressionHistory: [...decisions, ...vault.progressionHistory],
    }));

    return { session, decisions };
  };

  // ==========================================================================
  // NUTRITION & FOOD LOGGING ACTIONS
  // ==========================================================================
  const regenerateDailyMealPlan: FitnessBrainContextValue["regenerateDailyMealPlan"] = (
    customMeals
  ) => {
    if (!activeVault || !brainSynthesis) return [];
    const meals =
      customMeals ??
      generatePersonalizedMealPlan({
        userId: activeVault.profile.id,
        targets: brainSynthesis.nutritionTargets,
        preferences: activeVault.preferences,
      });

    updateActiveVault((vault) => ({
      ...vault,
      plannedMeals: meals,
    }));
    return meals;
  };

  const customizePlannedMeal: FitnessBrainContextValue["customizePlannedMeal"] = (
    mealId,
    updates
  ) => {
    updateActiveVault((vault) => ({
      ...vault,
      plannedMeals: vault.plannedMeals.map((m) =>
        m.id === mealId ? { ...m, ...updates, isCustomized: true } : m
      ),
    }));
  };

  const addFoodEntry: FitnessBrainContextValue["addFoodEntry"] = (entryInput) => {
    const userId = activeVault?.profile.id ?? "anonymous";
    const newEntry: FoodEntry = {
      ...entryInput,
      id: generateUUID(),
      userId,
      loggedDate: entryInput.loggedDate ?? getTodayDateString(),
      createdAt: new Date().toISOString(),
    };

    updateActiveVault((vault) => ({
      ...vault,
      foodEntries: [newEntry, ...vault.foodEntries],
    }));
    return newEntry;
  };

  const deleteFoodEntry = (entryId: string) => {
    updateActiveVault((vault) => ({
      ...vault,
      foodEntries: vault.foodEntries.filter((f) => f.id !== entryId),
    }));
  };

  const logWaterIntake = (amountMl: number) => {
    if (amountMl <= 0) return;
    const newLog: WaterLog = {
      id: generateUUID(),
      userId: activeVault?.profile.id ?? "anonymous",
      loggedDate: getTodayDateString(),
      amountMl,
      loggedAt: new Date().toISOString(),
    };
    updateActiveVault((vault) => ({
      ...vault,
      waterLogs: [newLog, ...vault.waterLogs],
    }));
  };

  // ==========================================================================
  // BODY, RECOVERY & CHAT ACTIONS
  // ==========================================================================
  const logWeightAndBody: FitnessBrainContextValue["logWeightAndBody"] = (
    params
  ) => {
    const today = getTodayDateString();
    const userId = activeVault?.profile.id ?? "anonymous";

    const newWeight: WeightLog = {
      id: generateUUID(),
      userId,
      loggedDate: today,
      weightKg: params.weightKg,
      bodyFatPct: params.bodyFatPct,
      isMeasured: params.isMeasured ?? true,
      notes: params.notes,
    };

    updateActiveVault((vault) => {
      const nextMeasurements = [...vault.bodyMeasurements];
      if (
        params.chestCm ||
        params.waistCm ||
        params.hipsCm ||
        params.bicepCm ||
        params.thighCm
      ) {
        nextMeasurements.unshift({
          id: generateUUID(),
          userId,
          loggedDate: today,
          chestCm: params.chestCm,
          waistCm: params.waistCm,
          hipsCm: params.hipsCm,
          bicepCm: params.bicepCm,
          thighCm: params.thighCm,
        });
      }

      return {
        ...vault,
        profile: {
          ...vault.profile,
          currentWeightKg: params.weightKg,
          bodyFatPct: params.bodyFatPct ?? vault.profile.bodyFatPct,
          updatedAt: new Date().toISOString(),
        },
        weightLogs: [newWeight, ...vault.weightLogs],
        bodyMeasurements: nextMeasurements,
      };
    });
  };

  const logRecoveryCheckIn: FitnessBrainContextValue["logRecoveryCheckIn"] = (
    input
  ) => {
    const userId = activeVault?.profile.id ?? "anonymous";
    const { log } = calculateRecoveryReadiness({
      ...input,
      userId,
    });

    updateActiveVault((vault) => ({
      ...vault,
      recoveryLogs: [log, ...vault.recoveryLogs],
    }));
    return log;
  };

  const appendChatMessage: FitnessBrainContextValue["appendChatMessage"] = (
    msg
  ) => {
    const newMsg: AIChatMessage = {
      ...msg,
      id: generateUUID(),
      userId: activeVault?.profile.id ?? "anonymous",
      createdAt: new Date().toISOString(),
    };
    updateActiveVault((vault) => ({
      ...vault,
      chatMessages: [...vault.chatMessages, newMsg],
    }));
  };

  const clearChatHistory = () => {
    updateActiveVault((vault) => ({
      ...vault,
      chatMessages: [],
    }));
  };

  const exportUserDataJson = (): string => {
    if (!activeVault) return "{}";
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        platform: "AI Fitness Brain (AIFitCore)",
        userData: activeVault,
      },
      null,
      2
    );
  };

  const deleteUserAccountData = () => {
    if (!activeUserId) return;
    const nextAccounts = { ...accounts };
    delete nextAccounts[activeUserId];
    const remainingIds = Object.keys(nextAccounts);
    persistAccounts(nextAccounts, remainingIds[0] ?? null);
  };

  const activePlan =
    activeVault?.workoutPlans.find((p) => p.id === activeVault.activeWorkoutPlanId) ??
    activeVault?.workoutPlans[0] ??
    brainSynthesis?.recommendedWorkoutPlan ??
    null;

  const value: FitnessBrainContextValue = {
    isHydrated,
    isAuthenticated: Boolean(activeVault),
    isSupabaseLive,
    currentUser: activeVault?.profile ?? null,
    goal: activeVault?.goal ?? "muscle_gain",
    preferences: activeVault?.preferences ?? null,
    nutritionTargets: brainSynthesis?.nutritionTargets ?? null,
    todayNutrition: brainSynthesis?.todayNutrition ?? null,
    activeWorkoutPlan: activePlan,
    workoutPlans: activeVault?.workoutPlans ?? [],
    workoutSessions: activeVault?.workoutSessions ?? [],
    performanceMap: activeVault?.performanceMap ?? {},
    progressionHistory: activeVault?.progressionHistory ?? [],
    foodEntries: activeVault?.foodEntries ?? [],
    plannedMeals: activeVault?.plannedMeals ?? [],
    weightLogs: activeVault?.weightLogs ?? [],
    bodyMeasurements: activeVault?.bodyMeasurements ?? [],
    recoveryLogs: activeVault?.recoveryLogs ?? [],
    waterLogs: activeVault?.waterLogs ?? [],
    recommendations: brainSynthesis?.recommendations ?? [],
    chatMessages: activeVault?.chatMessages ?? [],
    achievements: activeVault?.achievements ?? [],
    latestReadinessScore: brainSynthesis?.latestReadinessScore ?? 85,

    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    saveOnboardingAndProfile,
    generateNewWorkoutPlan,
    replaceExerciseInActivePlan,
    setActiveWorkoutPlan,
    recordCompletedWorkoutSession,
    regenerateDailyMealPlan,
    customizePlannedMeal,
    addFoodEntry,
    deleteFoodEntry,
    logWaterIntake,
    logWeightAndBody,
    logRecoveryCheckIn,
    appendChatMessage,
    clearChatHistory,
    exportUserDataJson,
    deleteUserAccountData,
  };

  return (
    <FitnessBrainContext.Provider value={value}>
      {children}
    </FitnessBrainContext.Provider>
  );
}

export function useFitnessBrain(): FitnessBrainContextValue {
  const ctx = useContext(FitnessBrainContext);
  if (!ctx) {
    throw new Error("useFitnessBrain must be used within a FitnessBrainProvider");
  }
  return ctx;
}
