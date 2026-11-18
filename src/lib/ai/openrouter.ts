// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SERVER-SIDE OPENROUTER AI SERVICE
// Implements all 7 required AI functions with Zod validation, timeouts,
// usage monitoring, and deterministic engine fallback.
// ============================================================================

import {
  AIFoodVisionResponseSchema,
  AIMealPlanResponseSchema,
  AIWorkoutPlanResponseSchema,
  AIHistoryAnalysisResponseSchema,
  AINutritionAdviceResponseSchema,
  AIProgressSummaryResponseSchema,
} from "@/lib/validations/schemas";
import {
  ExerciseProgressionDecisionRecord,
  FitnessGoalType,
  FoodEntry,
  NutritionTargets,
  PlannedMeal,
  RecoveryLog,
  TrainingCategory,
  UserExercisePerformance,
  UserPreferences,
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
} from "@/types/fitness";
import { EXERCISE_CATALOG, getExerciseBySlug } from "@/services/workout/exercise-catalog";
import {
  generatePersonalizedWorkoutPlan,
  WorkoutGenerationRequest,
} from "@/services/workout/workout-generator";
import {
  generatePersonalizedMealPlan,
  ParsedFoodCandidate,
  parseNaturalFoodDescription,
} from "@/services/nutrition/food-catalog";
import { aggregateDailyNutrition } from "@/lib/calculations/nutrition";
import { generateUUID, getTodayDateString } from "@/lib/utils";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export interface AIUsageLogEntry {
  timestamp: string;
  operation: string;
  model: string;
  mode: "openrouter_ai" | "deterministic_engine";
  latencyMs: number;
  success: boolean;
  tokensUsed?: number;
  error?: string;
}

const recentUsageLogs: AIUsageLogEntry[] = [];

export function getAIUsageLogs(): AIUsageLogEntry[] {
  return [...recentUsageLogs].slice(-50);
}

function recordUsage(entry: AIUsageLogEntry) {
  recentUsageLogs.push(entry);
  if (recentUsageLogs.length > 100) {
    recentUsageLogs.shift();
  }
}

export function isOpenRouterConfigured(): boolean {
  const key = process.env.OPENROUTER_API_KEY;
  return Boolean(
    key &&
      key.trim().length > 10 &&
      !key.includes("your-openrouter-api-key")
  );
}

export function getConfiguredModels() {
  return {
    generalModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    visionModel: process.env.OPENROUTER_VISION_MODEL || "openai/gpt-4o-mini",
    coachModel:
      process.env.OPENROUTER_COACH_MODEL ||
      process.env.OPENROUTER_MODEL ||
      "openai/gpt-4o-mini",
    isLiveKeyConfigured: isOpenRouterConfigured(),
  };
}

async function callOpenRouterCompletion(params: {
  operation: string;
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: unknown }>;
  jsonMode?: boolean;
  timeoutMs?: number;
}): Promise<{ content: string; tokensUsed?: number; modelUsed: string } | null> {
  if (!isOpenRouterConfigured()) {
    return null;
  }

  const startMs = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 18_000);

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Fitness Brain (AIFitCore)",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: 0.35,
        ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "HTTP Error");
      recordUsage({
        timestamp: new Date().toISOString(),
        operation: params.operation,
        model: params.model,
        mode: "openrouter_ai",
        latencyMs: Date.now() - startMs,
        success: false,
        error: `HTTP ${response.status}: ${errText.slice(0, 120)}`,
      });
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const tokensUsed = data?.usage?.total_tokens;

    if (typeof content !== "string" || content.trim().length === 0) {
      return null;
    }

    recordUsage({
      timestamp: new Date().toISOString(),
      operation: params.operation,
      model: data?.model || params.model,
      mode: "openrouter_ai",
      latencyMs: Date.now() - startMs,
      success: true,
      tokensUsed,
    });

    return {
      content,
      tokensUsed,
      modelUsed: data?.model || params.model,
    };
  } catch (err) {
    clearTimeout(timeout);
    recordUsage({
      timestamp: new Date().toISOString(),
      operation: params.operation,
      model: params.model,
      mode: "openrouter_ai",
      latencyMs: Date.now() - startMs,
      success: false,
      error: err instanceof Error ? err.message : "Network or timeout error",
    });
    return null;
  }
}

function extractJsonObject(raw: string): unknown {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ============================================================================
// 1. generateWorkout()
// ============================================================================
export async function generateWorkout(
  req: WorkoutGenerationRequest
): Promise<WorkoutPlan> {
  // Always compute baseline valid plan first to guarantee valid catalog slugs
  const deterministicPlan = generatePersonalizedWorkoutPlan(req);
  const models = getConfiguredModels();

  if (!models.isLiveKeyConfigured) {
    return deterministicPlan;
  }

  const validSlugs = EXERCISE_CATALOG.map(
    (e) => `${e.slug} (${e.name}, category:${e.category}, equipment:${e.equipment.join("/")}, level:${e.difficultyLevel})`
  ).join("\n");

  const systemPrompt = `You are the AI Fitness Brain Workout Intelligence Engine.
You MUST ONLY select exercises using exact exerciseSlug values from this verified database catalog:
${validSlugs}

Return strict JSON matching:
{
  "name": "string",
  "description": "string",
  "aiRationale": "string",
  "exercises": [
    {
      "exerciseSlug": "exact-catalog-slug",
      "targetSets": 3,
      "targetReps": "10-12",
      "restDurationSec": 60,
      "progressionRecommendation": "string"
    }
  ]
}`;

  const userPrompt = JSON.stringify({
    profile: {
      experience: req.user.fitnessExperience,
      injuries: req.user.injuriesLimitations,
      durationMin: req.durationMin ?? req.user.preferredWorkoutDurationMin,
    },
    goal: req.goal,
    category: req.category ?? req.preferences.preferredTrainingCategory,
    availableEquipment: req.availableEquipment ?? req.preferences.availableEquipment,
    targetMuscles: req.targetMuscles,
    recoveryReadinessScore: req.recoveryReadinessScore ?? 80,
  });

  const aiRes = await callOpenRouterCompletion({
    operation: "generateWorkout",
    model: models.generalModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    jsonMode: true,
  });

  if (!aiRes) {
    return deterministicPlan;
  }

  try {
    const parsed = AIWorkoutPlanResponseSchema.parse(extractJsonObject(aiRes.content));
    const validatedExercises = parsed.exercises
      .map((item, idx) => {
        const catalogEx = getExerciseBySlug(item.exerciseSlug);
        if (!catalogEx) return null;
        return {
          id: generateUUID(),
          exerciseId: catalogEx.id,
          exerciseSlug: catalogEx.slug,
          exerciseName: catalogEx.name,
          primaryMuscle: catalogEx.primaryMuscle,
          equipment: catalogEx.equipment,
          difficultyLevel: catalogEx.difficultyLevel,
          orderIndex: idx + 1,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          restDurationSec: item.restDurationSec,
          instructions: catalogEx.instructions.map((i) => i.instructionText),
          formGuidance:
            catalogEx.instructions[0]?.formCue ??
            "Maintain neutral spine alignment and controlled tempo.",
          progressionRecommendation: item.progressionRecommendation,
          isCameraSupported: catalogEx.isCameraSupported,
          cameraAnalyzerKey: catalogEx.cameraAnalyzerKey,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (validatedExercises.length < 2) {
      return deterministicPlan;
    }

    return {
      ...deterministicPlan,
      name: parsed.name,
      description: parsed.description,
      aiRationale: parsed.aiRationale,
      generationMode: "openrouter_ai",
      exercises: validatedExercises,
    };
  } catch {
    return deterministicPlan;
  }
}

// ============================================================================
// 2. generateMealPlan()
// ============================================================================
export async function generateMealPlan(params: {
  userId: string;
  targets: NutritionTargets;
  preferences?: Partial<UserPreferences>;
  date?: string;
}): Promise<{
  meals: PlannedMeal[];
  mode: "openrouter_ai" | "deterministic_engine";
}> {
  const deterministicMeals = generatePersonalizedMealPlan(params);
  const models = getConfiguredModels();

  if (!models.isLiveKeyConfigured) {
    return { meals: deterministicMeals, mode: "deterministic_engine" };
  }

  const systemPrompt = `You are the AI Fitness Brain Nutritionist.
Generate a 4-meal daily plan (breakfast, lunch, snack, dinner) matching the user's daily calorie and macro targets.
Include Bangladeshi staple foods (Rice/Bhat, Red Rice/Lal Chal, Atta Roti, Eggs/Dim, Chicken/Murgi, Rohu/Tilapia Fish, Masoor Dal, Sabzi/Vegetables, Shak, Milk/Dudh, Tok Doi, Banana, Guava, Papaya) alongside user preferences.
Return strict JSON:
{
  "meals": [
    {
      "mealType": "breakfast" | "lunch" | "snack" | "dinner",
      "title": "string",
      "description": "string",
      "itemsSummary": ["string"],
      "totalCalories": 500,
      "proteinG": 35,
      "carbsG": 55,
      "fatG": 14,
      "fiberG": 8
    }
  ]
}`;

  const aiRes = await callOpenRouterCompletion({
    operation: "generateMealPlan",
    model: models.generalModel,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          targets: {
            calories: params.targets.dailyCalorieTarget,
            proteinG: params.targets.proteinTargetG,
            carbsG: params.targets.carbsTargetG,
            fatG: params.targets.fatTargetG,
          },
          preferences: params.preferences,
        }),
      },
    ],
    jsonMode: true,
  });

  if (!aiRes) {
    return { meals: deterministicMeals, mode: "deterministic_engine" };
  }

  try {
    const parsed = AIMealPlanResponseSchema.parse(extractJsonObject(aiRes.content));
    const planDate = params.date ?? getTodayDateString();
    const meals: PlannedMeal[] = parsed.meals.map((m) => ({
      id: generateUUID(),
      userId: params.userId,
      planDate,
      mealType: m.mealType,
      title: m.title,
      description: m.description,
      itemsSummary: m.itemsSummary,
      totalCalories: Math.round(m.totalCalories),
      proteinG: Math.round(m.proteinG),
      carbsG: Math.round(m.carbsG),
      fatG: Math.round(m.fatG),
      fiberG: Math.round(m.fiberG),
      cuisineTag: "bangladeshi",
      isCustomized: false,
    }));
    return { meals, mode: "openrouter_ai" };
  } catch {
    return { meals: deterministicMeals, mode: "deterministic_engine" };
  }
}

// ============================================================================
// 3. analyzeFitnessHistory()
// ============================================================================
export async function analyzeFitnessHistory(params: {
  profile: UserProfile;
  sessions: WorkoutSession[];
  performanceMap: Record<string, UserExercisePerformance>;
  progressionHistory: ExerciseProgressionDecisionRecord[];
  recoveryLogs: RecoveryLog[];
}): Promise<{
  summary: string;
  strengths: string[];
  bottlenecks: string[];
  nextAction: string;
  mode: "openrouter_ai" | "deterministic_engine";
}> {
  const completedSessions = params.sessions.filter((s) => s.status === "completed");
  const avgForm =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + s.averageFormScore, 0) /
            completedSessions.length
        )
      : 0;
  const latestRecovery = params.recoveryLogs[0]?.readinessScore ?? 80;
  const perfs = Object.values(params.performanceMap);

  const strengths: string[] = [];
  const bottlenecks: string[] = [];

  if (completedSessions.length >= 3) {
    strengths.push(`Logged ${completedSessions.length} structured training sessions with ${avgForm}% average movement quality.`);
  } else {
    strengths.push("Profile and individualized progression baseline are active.");
  }

  for (const p of perfs) {
    if (p.rollingFormScore >= 84) {
      strengths.push(`${p.exerciseName}: Level ${p.currentLevel}/5 mastery (${Math.round(p.rollingFormScore)}% rolling form, PB ${p.personalBestReps} reps).`);
    } else if (p.consecutiveStruggleSessions >= 1 || p.rollingFormScore < 75) {
      bottlenecks.push(`${p.exerciseName}: Rolling form at ${Math.round(p.rollingFormScore)}%—focus on eccentric tempo before increasing reps.`);
    }
  }

  if (latestRecovery < 65) {
    bottlenecks.push(`Recovery readiness is currently ${latestRecovery}%—prioritize 7.5+ hours of sleep tonight.`);
  }

  const deterministicResult = {
    summary:
      completedSessions.length > 0
        ? `Across ${completedSessions.length} recorded sessions, your average estimated movement quality is ${avgForm}% with a current recovery readiness of ${latestRecovery}%.`
        : "Your individualized baseline is configured. Complete your first AI Camera Trainer or logged workout session to unlock multi-session trend comparison.",
    strengths: strengths.slice(0, 4),
    bottlenecks:
      bottlenecks.length > 0
        ? bottlenecks.slice(0, 3)
        : ["No major biomechanical or recovery bottlenecks detected in recent logs."],
    nextAction:
      latestRecovery < 60
        ? "Execute an active recovery or reduced-volume session today."
        : "Target >= 82% form score on your primary compound lift today to advance your progression counter.",
    mode: "deterministic_engine" as const,
  };

  const models = getConfiguredModels();
  if (!models.isLiveKeyConfigured) {
    return deterministicResult;
  }

  try {
    const systemPrompt = `You are the AI Fitness Brain Biomechanical & Progression Analyst.
Analyze the athlete's real training history, movement form scores, per-exercise levels, and recovery logs.
Return strict JSON matching:
{
  "summary": "1-2 sentence analytical synthesis of their training consistency, form trajectory, and readiness",
  "strengths": ["string", "string"],
  "bottlenecks": ["string", "string"],
  "nextAction": "1 high-priority specific recommendation for their next workout or recovery phase"
}`;

    const userPrompt = JSON.stringify({
      athlete: {
        name: params.profile.fullName,
        experience: params.profile.fitnessExperience,
        weightKg: params.profile.currentWeightKg,
        targetWeightKg: params.profile.targetWeightKg,
      },
      stats: {
        completedSessions: completedSessions.length,
        averageFormScore: avgForm,
        latestRecoveryReadiness: latestRecovery,
      },
      perExerciseMastery: perfs.map((p) => ({
        exercise: p.exerciseName,
        level: p.currentLevel,
        rollingForm: Math.round(p.rollingFormScore),
        pbReps: p.personalBestReps,
      })),
      recentProgressions: params.progressionHistory.slice(0, 3).map((pr) => ({
        exercise: pr.exerciseName,
        decision: pr.decision,
        reason: pr.reasonSummary,
      })),
    });

    const aiRes = await callOpenRouterCompletion({
      operation: "analyzeFitnessHistory",
      model: models.generalModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      jsonMode: true,
    });

    if (aiRes) {
      const parsed = AIHistoryAnalysisResponseSchema.parse(extractJsonObject(aiRes.content));
      return {
        ...parsed,
        mode: "openrouter_ai",
      };
    }
  } catch {
    // Graceful fallback to deterministic analysis
  }

  return deterministicResult;
}

// ============================================================================
// 4. generateNutritionAdvice()
// ============================================================================
export async function generateNutritionAdvice(params: {
  profile: UserProfile;
  goal: FitnessGoalType;
  targets: NutritionTargets;
  todayEntries: FoodEntry[];
}): Promise<{
  headline: string;
  adviceBullets: string[];
  postWorkoutSuggestion: string;
  mode: "openrouter_ai" | "deterministic_engine";
}> {
  const daily = aggregateDailyNutrition({
    date: getTodayDateString(),
    entries: params.todayEntries,
    waterLogs: [],
    targets: params.targets,
  });

  const remCal = daily.remainingCalories;
  const remProt = daily.protein.remainingG;

  const bullets: string[] = [
    `Remaining today: ${Math.max(0, remCal)} kcal and ${remProt}g protein (Target: ${params.targets.dailyCalorieTarget} kcal / ${params.targets.proteinTargetG}g protein).`,
    `Hydration target: ${params.targets.waterTargetMl} ml/day based on your ${params.profile.currentWeightKg} kg body weight and ${params.profile.workoutDaysPerWeek}x/week training frequency.`,
  ];

  let postWorkoutSuggestion =
    "150g Grilled Chicken or Rui/Tilapia Fish + 150g Steamed Lal Chal (Red Rice) + 1 cup Masoor Dal (~45g protein, ~520 kcal).";
  if (remCal < 350) {
    postWorkoutSuggestion =
      "2 Boiled Eggs + 1 Bowl Plain Tok Doi (Sour Yogurt) or 1 Scoop Whey Isolate (~26g protein, ~230 kcal) to hit protein targets within your remaining calorie budget.";
  } else if (remProt > 45) {
    postWorkoutSuggestion =
      "150g Deshi Chicken Curry or Grilled Chicken Breast + 2 Atta Rotis + 1 Cup Thick Masoor Dal (~48g protein, ~540 kcal).";
  }

  const deterministicResult = {
    headline:
      remProt > 25
        ? `Prioritize ${remProt}g more protein across your remaining meals today.`
        : "Your protein intake is right on track for muscle recovery today.",
    adviceBullets: bullets,
    postWorkoutSuggestion,
    mode: "deterministic_engine" as const,
  };

  const models = getConfiguredModels();
  if (!models.isLiveKeyConfigured) {
    return deterministicResult;
  }

  try {
    const systemPrompt = `You are the AI Fitness Brain Nutritionist.
Provide tailored nutritional advice based on the athlete's daily intake, remaining calories/protein, hydration, and goal.
Include practical Bangladeshi (Rice/Bhat, Roti, Eggs, Fish, Chicken, Dal, Tok Doi) and balanced international meal suggestions.
Return strict JSON:
{
  "headline": "Action-oriented 1-sentence headline for today's intake",
  "adviceBullets": ["Practical tip 1", "Practical tip 2", "Hydration tip"],
  "postWorkoutSuggestion": "Specific meal description with estimated protein and calorie values"
}`;

    const userPrompt = JSON.stringify({
      goal: params.goal,
      currentWeightKg: params.profile.currentWeightKg,
      dailyCalorieTarget: params.targets.dailyCalorieTarget,
      consumedCalories: daily.consumedCalories,
      remainingCalories: remCal,
      proteinTargetG: params.targets.proteinTargetG,
      proteinConsumedG: daily.protein.consumedG,
      proteinRemainingG: remProt,
      waterTargetMl: params.targets.waterTargetMl,
      mealsLoggedCount: params.todayEntries.length,
    });

    const aiRes = await callOpenRouterCompletion({
      operation: "generateNutritionAdvice",
      model: models.generalModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      jsonMode: true,
    });

    if (aiRes) {
      const parsed = AINutritionAdviceResponseSchema.parse(extractJsonObject(aiRes.content));
      return {
        ...parsed,
        mode: "openrouter_ai",
      };
    }
  } catch {
    // Graceful fallback
  }

  return deterministicResult;
}

// ============================================================================
// 5. generateProgressSummary()
// ============================================================================
export async function generateProgressSummary(params: {
  profile: UserProfile;
  goal: FitnessGoalType;
  sessions: WorkoutSession[];
  progressionHistory: ExerciseProgressionDecisionRecord[];
}): Promise<{
  reportTitle: string;
  narrative: string;
  keyMilestones: string[];
  mode: "openrouter_ai" | "deterministic_engine";
}> {
  const totalReps = params.sessions.reduce((s, w) => s + w.totalReps, 0);
  const totalMinutes = Math.round(
    params.sessions.reduce((s, w) => s + w.durationSec, 0) / 60
  );
  const progressions = params.progressionHistory.filter((p) => p.decision === "progress");

  const deterministicResult = {
    reportTitle: `${params.profile.fullName || "Athlete"}'s Adaptive Progress Synthesis`,
    narrative: `You have completed ${params.sessions.length} workout sessions totaling ${totalMinutes} minutes and ${totalReps} tracked repetitions. The Progression Engine has recorded ${progressions.length} verified level-ups based on multi-session form and completion evidence.`,
    keyMilestones: [
      `${params.sessions.length} Workouts Logged (${totalMinutes} active training minutes)`,
      `${totalReps} Total Repetitions Tracked`,
      `${progressions.length} Evidence-Based Exercise Level Progressions`,
    ],
    mode: "deterministic_engine" as const,
  };

  const models = getConfiguredModels();
  if (!models.isLiveKeyConfigured) {
    return deterministicResult;
  }

  try {
    const systemPrompt = `You are the AI Fitness Brain Progress Analyst.
Generate an encouraging, data-backed executive progress synthesis for the athlete based on their real workout history and progression record.
Return strict JSON:
{
  "reportTitle": "Title of report with athlete name",
  "narrative": "2-3 sentence progress synthesis referencing their numbers",
  "keyMilestones": ["Milestone 1", "Milestone 2", "Milestone 3"]
}`;

    const userPrompt = JSON.stringify({
      athleteName: params.profile.fullName,
      goal: params.goal,
      currentWeightKg: params.profile.currentWeightKg,
      targetWeightKg: params.profile.targetWeightKg,
      totalSessions: params.sessions.length,
      totalMinutes,
      totalReps,
      progressionsCount: progressions.length,
      progressionDetails: progressions.slice(0, 3).map((p) => `${p.exerciseName}: Level ${p.previousLevel} -> ${p.newLevel}`),
    });

    const aiRes = await callOpenRouterCompletion({
      operation: "generateProgressSummary",
      model: models.generalModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      jsonMode: true,
    });

    if (aiRes) {
      const parsed = AIProgressSummaryResponseSchema.parse(extractJsonObject(aiRes.content));
      return {
        ...parsed,
        mode: "openrouter_ai",
      };
    }
  } catch {
    // Graceful fallback
  }

  return deterministicResult;
}

// ============================================================================
// 6. fitnessChat() — Context-Grounded Conversational AI Coach
// ============================================================================
export async function fitnessChat(params: {
  userMessage: string;
  profile: UserProfile;
  goal: FitnessGoalType;
  preferences: UserPreferences;
  targets: NutritionTargets;
  todayEntries: FoodEntry[];
  sessions: WorkoutSession[];
  performanceMap: Record<string, UserExercisePerformance>;
  progressionHistory: ExerciseProgressionDecisionRecord[];
  recoveryLogs: RecoveryLog[];
  activeWorkoutPlan?: WorkoutPlan;
}): Promise<{
  reply: string;
  modelUsed: string;
  mode: "openrouter_ai" | "deterministic_engine";
}> {
  const dailyNutrition = aggregateDailyNutrition({
    date: getTodayDateString(),
    entries: params.todayEntries,
    waterLogs: [],
    targets: params.targets,
  });

  const latestRecovery = params.recoveryLogs[0];
  const latestProgression = params.progressionHistory[0];
  const models = getConfiguredModels();

  const contextSnapshot = {
    athlete: {
      name: params.profile.fullName,
      age: params.profile.ageYears,
      weightKg: params.profile.currentWeightKg,
      targetWeightKg: params.profile.targetWeightKg,
      experience: params.profile.fitnessExperience,
      goal: params.goal,
      category: params.preferences.preferredTrainingCategory,
      equipment: params.preferences.availableEquipment,
      injuries: params.profile.injuriesLimitations,
    },
    todayNutrition: {
      targetCalories: dailyNutrition.targetCalories,
      consumedCalories: dailyNutrition.consumedCalories,
      remainingCalories: dailyNutrition.remainingCalories,
      proteinConsumedG: dailyNutrition.protein.consumedG,
      proteinRemainingG: dailyNutrition.protein.remainingG,
      carbsRemainingG: dailyNutrition.carbs.remainingG,
      fatRemainingG: dailyNutrition.fat.remainingG,
    },
    exerciseLevels: Object.values(params.performanceMap).map((p) => ({
      exercise: p.exerciseName,
      level: p.currentLevel,
      pbReps: p.personalBestReps,
      rollingFormPct: p.rollingFormScore,
    })),
    latestProgressionDecision: latestProgression
      ? {
          exercise: latestProgression.exerciseName,
          decision: latestProgression.decision,
          previousLevel: latestProgression.previousLevel,
          newLevel: latestProgression.newLevel,
          reason: latestProgression.reasonSummary,
        }
      : null,
    latestRecovery: latestRecovery
      ? {
          readinessScore: latestRecovery.readinessScore,
          sleepHours: latestRecovery.sleepHours,
          soreness: latestRecovery.muscleSoreness,
          fatigue: latestRecovery.fatigueLevel,
        }
      : null,
    totalWorkoutsCompleted: params.sessions.length,
    activeWorkoutPlanName: params.activeWorkoutPlan?.name ?? "None selected",
  };

  if (models.isLiveKeyConfigured) {
    const systemPrompt = `You are the AI Fitness Brain Personal Coach & Nutritionist.
Always ground your answer in the athlete's real retrieved database context below. Never invent metrics that were not saved.
Retrieved Athlete Context:
${JSON.stringify(contextSnapshot, null, 2)}

Guidelines:
- Cite specific numbers from their profile, remaining calories/protein, per-exercise levels, progression decisions, and recovery readiness.
- Suggest practical Bangladeshi (Rice/Bhat, Roti, Eggs, Chicken, Rohu/Tilapia Fish, Masoor Dal, Sabzi, Tok Doi, Fruit) and international food options when asked about meals.
- Remember all calorie/BMR/form numbers are estimates, never medical prescriptions.`;

    const aiRes = await callOpenRouterCompletion({
      operation: "fitnessChat",
      model: models.coachModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: params.userMessage },
      ],
    });

    if (aiRes) {
      return {
        reply: aiRes.content,
        modelUsed: aiRes.modelUsed,
        mode: "openrouter_ai",
      };
    }
  }

  // Context-grounded deterministic coach response using retrieved user records
  const q = params.userMessage.toLowerCase();
  let reply = "";

  if (q.includes("eat") || q.includes("meal") || q.includes("food") || q.includes("post-workout") || q.includes("after my workout") || q.includes("calorie") || q.includes("protein")) {
    const remCal = Math.max(0, dailyNutrition.remainingCalories);
    const remProt = dailyNutrition.protein.remainingG;
    reply = `Based on your live nutrition log today, you have **${remCal} kcal** and **${remProt}g protein** remaining toward your **${dailyNutrition.targetCalories} kcal** (${params.goal.replace("_", " ")}) target.\n\n**Recommended Post-Workout / Next Meal (${params.preferences.foodBudgetTier} budget):**\n- **Option 1 (Bangladeshi High-Protein Plate):** 150g Homestyle Chicken Curry (*Murgi Jhol*) or Tilapia/Rui Fish + 150g Deshi Red Rice (*Lal Chal Bhat*) or 2 Whole Wheat *Atta Rotis* + 1 cup thick *Masoor Dal* (~44g protein, ~510 kcal).\n- **Option 2 (Quick Refuel):** 2 Boiled Eggs (*Siddho Dim*) + 1 Bowl Plain *Tok Doi* (150g) + 1 Medium *Sagor Banana* (~21g protein, ~355 kcal).\n\nDon't forget hydration—your daily target is **${params.targets.waterTargetMl} ml**.`;
  } else if (q.includes("push-up") || q.includes("pushup") || q.includes("cannot complete") || q.includes("hard") || q.includes("struggle")) {
    const pushPerf =
      params.performanceMap["standard-push-up"] ||
      params.performanceMap["knee-push-up"] ||
      params.performanceMap["incline-push-up"];
    reply = `I reviewed your push-up performance record${
      pushPerf
        ? ` (Current Level **${pushPerf.currentLevel}/5**, Personal Best **${pushPerf.personalBestReps} reps**, Rolling Form **${Math.round(pushPerf.rollingFormScore)}%**)`
        : ""
    }.\n\n**How we adapt your Push-Up Pathway:**\n1. **Immediate Regression Option:** Switch to **Incline Push-Ups** (hands elevated on a bench/table) or **Knee Push-Ups** for 3 sets of 10–12 controlled reps. This reduces lever load by ~25–35% while letting you achieve full 90° elbow depth and >= 82% form score.\n2. **Sub-Maximal Volume Strategy:** Instead of 1 set to failure at 7 reps, perform **4 sets of 6 strict reps** with 75 seconds rest.\n3. **No Penalty Rule:** Our Progression Engine never punishes you for a tough set—once you hit 2 consecutive sessions at >= 82% form on Knee/Incline Push-Ups, we will smoothly transition you back to Standard Push-Ups.`;
  } else if (q.includes("why did my workout change") || q.includes("why") || q.includes("changed") || q.includes("progression")) {
    if (latestProgression) {
      reply = `Here is the exact evidence behind your latest workout adjustment on **${latestProgression.exerciseName}**:\n\n- **Decision:** \`${latestProgression.decision.toUpperCase()}\` (Level ${latestProgression.previousLevel} $\\rightarrow$ Level ${latestProgression.newLevel})\n- **Evidence Metrics:** ${Math.round(latestProgression.evidenceMetrics.completionRatio * 100)}% target rep completion, **${latestProgression.evidenceMetrics.formScore}%** estimated movement quality, **${latestProgression.evidenceMetrics.romScore}%** range of motion, RPE ${latestProgression.evidenceMetrics.rpe}/10, and **${latestProgression.evidenceMetrics.recoveryReadiness}%** recovery readiness.\n- **Rationale:** ${latestProgression.reasonSummary}\n- **New Prescription:** ${latestProgression.recommendedVariationName} (${latestProgression.recommendedRepsOrLoad}).`;
    } else {
      const readiness = latestRecovery?.readinessScore ?? 82;
      reply = `Your current workout plan (**${contextSnapshot.activeWorkoutPlanName}**) is dynamically calibrated to:\n1. **Profile & Goal:** ${params.profile.fitnessExperience} experience targeting **${params.goal.replace("_", " ")}** (${params.profile.preferredWorkoutDurationMin} min sessions).\n2. **Available Equipment:** ${params.preferences.availableEquipment.join(", ")}.\n3. **Recovery Readiness:** **${readiness}%** readiness score${
        readiness < 65
          ? " (volume automatically scaled down to prevent overtraining)"
          : " (cleared for full working volume)"
      }.\n\nLog a workout or AI Camera Trainer session to generate your first per-exercise progression audit entry!`;
    }
  } else if (q.includes("progress") || q.includes("how am i") || q.includes("history") || q.includes("summary")) {
    const totalSessions = params.sessions.length;
    const totalReps = params.sessions.reduce((s, w) => s + w.totalReps, 0);
    const avgForm =
      totalSessions > 0
        ? Math.round(
            params.sessions.reduce((s, w) => s + w.averageFormScore, 0) /
              totalSessions
          )
        : 0;
    reply = `### Your Progress Summary (${params.profile.fullName || "Athlete"})\n- **Completed Workouts:** ${totalSessions} sessions (${totalReps} total reps logged, **${avgForm}%** average movement quality)\n- **Body Metrics:** Current weight **${params.profile.currentWeightKg} kg** $\\rightarrow$ Goal **${params.profile.targetWeightKg} kg** (${params.goal.replace("_", " ")})\n- **Per-Exercise Skill Levels:**\n${
      contextSnapshot.exerciseLevels.length > 0
        ? contextSnapshot.exerciseLevels
            .map(
              (e) =>
                `  - **${e.exercise}**: Level ${e.level}/5 (PB: ${e.pbReps} reps, Rolling Form: ${Math.round(e.rollingFormPct)}%)`
            )
            .join("\n")
        : "  - Complete your first session to record per-exercise levels."
    }\n- **Today's Nutrition Adherence:** ${dailyNutrition.consumedCalories} / ${dailyNutrition.targetCalories} kcal (${dailyNutrition.protein.consumedG}g / ${params.targets.proteinTargetG}g protein).`;
  } else {
    reply = `Hello **${params.profile.fullName || "Athlete"}**! I have your live profile loaded:\n- **Goal:** ${params.goal.replace("_", " ").toUpperCase()} (${params.profile.currentWeightKg} kg $\\rightarrow$ ${params.profile.targetWeightKg} kg)\n- **Today's Nutrition:** ${dailyNutrition.consumedCalories} / ${dailyNutrition.targetCalories} kcal consumed (**${Math.max(0, dailyNutrition.remainingCalories)} kcal** and **${dailyNutrition.protein.remainingG}g protein** remaining)\n- **Recovery Readiness:** ${latestRecovery?.readinessScore ?? 82}%\n- **Active Plan:** ${contextSnapshot.activeWorkoutPlanName}\n\nAsk me *"What should I eat after my workout?"*, *"I cannot complete 10 push-ups"*, *"Why did my workout change?"*, or *"How am I progressing?"* for evidence-backed guidance!`;
  }

  return {
    reply,
    modelUsed: "AIFitCore Context-Grounded Deterministic Coach",
    mode: "deterministic_engine",
  };
}

// ============================================================================
// 7. analyzeFoodImage() — Vision Food Recognition with User Confirmation Step
// ============================================================================
export async function analyzeFoodImage(params: {
  imageBase64OrUrl: string;
  userHintText?: string;
}): Promise<{
  detectedItems: ParsedFoodCandidate[];
  uncertaintyNotice: string;
  mode: "openrouter_ai" | "deterministic_engine";
}> {
  const models = getConfiguredModels();
  const defaultNotice =
    "Visual portion sizes and cooking oil density cannot be weighed exactly from a 2D photograph. Please review and adjust the estimated grams and calories below before confirming your food log.";

  if (
    models.isLiveKeyConfigured &&
    (params.imageBase64OrUrl.startsWith("data:image") ||
      params.imageBase64OrUrl.startsWith("http"))
  ) {
    const systemPrompt = `You are a nutritional vision analyzer. Identify the food items in the image, paying special attention to South Asian / Bangladeshi dishes (Rice/Bhat, Roti, Dal, Fish Curry, Chicken Curry, Eggs, Sabzi, Shak, Chola, Fruits) as well as international meals.
Estimate portion grams, calories, protein, carbs, fat, fiber, and confidence (0..1).
Return strict JSON:
{
  "detectedItems": [
    {
      "foodName": "string",
      "portionGrams": 150,
      "servings": 1,
      "caloriesKcal": 210,
      "proteinG": 18,
      "carbsG": 22,
      "fatG": 6,
      "fiberG": 3,
      "confidence": 0.82
    }
  ],
  "uncertaintyNotice": "string"
}`;

    const aiRes = await callOpenRouterCompletion({
      operation: "analyzeFoodImage",
      model: models.visionModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: params.userHintText
                ? `Analyze this meal photo. User label/hint: ${params.userHintText}`
                : "Analyze this meal photo and estimate food items, portions, and macros.",
            },
            {
              type: "image_url",
              image_url: { url: params.imageBase64OrUrl },
            },
          ],
        },
      ],
      jsonMode: true,
    });

    if (aiRes) {
      try {
        const parsed = AIFoodVisionResponseSchema.parse(extractJsonObject(aiRes.content));
        return {
          detectedItems: parsed.detectedItems,
          uncertaintyNotice: parsed.uncertaintyNotice || defaultNotice,
          mode: "openrouter_ai",
        };
      } catch {
        // Fall through to deterministic hint/plate estimator
      }
    }
  }

  // Deterministic plate recognition using filename / hint text or balanced Bangladeshi meal plate template
  const hint = params.userHintText?.trim() || "Steamed Rice, Chicken Curry, Masoor Dal & Mixed Vegetables";
  const parsedFromHint = parseNaturalFoodDescription(hint);

  return {
    detectedItems: parsedFromHint,
    uncertaintyNotice: defaultNotice,
    mode: "deterministic_engine",
  };
}
