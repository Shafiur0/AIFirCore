// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — PERSONALIZED WORKOUT GENERATOR SERVICE
// Connects user profile, owned equipment, injuries, per-exercise history & recovery
// ============================================================================

import {
  ExerciseCatalogItem,
  FitnessGoalType,
  TrainingCategory,
  UserExercisePerformance,
  UserPreferences,
  UserProfile,
  WorkoutPlan,
  WorkoutPlanExerciseItem,
} from "@/types/fitness";
import { EXERCISE_CATALOG, getExerciseBySlug } from "@/services/workout/exercise-catalog";
import { generateUUID } from "@/lib/utils";

export interface WorkoutGenerationRequest {
  user: UserProfile;
  preferences: UserPreferences;
  goal: FitnessGoalType;
  category?: TrainingCategory;
  durationMin?: number;
  targetMuscles?: string[];
  availableEquipment?: string[];
  performanceMap?: Record<string, UserExercisePerformance>;
  recoveryReadinessScore?: number;
  soreMuscleAreas?: string[];
}

const EXPERIENCE_TO_LEVEL: Record<UserProfile["fitnessExperience"], 1 | 2 | 3 | 4 | 5> = {
  beginner: 1,
  novice: 2,
  intermediate: 3,
  advanced: 4,
  expert: 5,
};

/**
 * Checks if the user owns all equipment required by an exercise.
 */
function hasRequiredEquipment(
  exerciseEquipment: string[],
  userOwnedEquipment: string[],
  category: TrainingCategory
): boolean {
  if (
    exerciseEquipment.length === 0 ||
    (exerciseEquipment.length === 1 && exerciseEquipment[0] === "none")
  ) {
    return true;
  }

  // If user selected full commercial gym category, standard gym hardware is available unless explicitly restricted
  if (category === "gym") {
    return true;
  }

  const normalizedOwned = new Set(
    userOwnedEquipment.map((e) => e.toLowerCase().trim())
  );
  if (normalizedOwned.has("full-gym")) return true;

  return exerciseEquipment.every(
    (req) =>
      req === "none" ||
      req === "bodyweight" ||
      normalizedOwned.has(req.toLowerCase())
  );
}

/**
 * Filters out exercises contraindicated by user-disclosed injuries or acute soreness.
 */
function isSafeForUserInjuries(
  exercise: ExerciseCatalogItem,
  injuries: string[]
): boolean {
  const normalized = injuries.map((i) => i.toLowerCase());
  if (normalized.length === 0) return true;

  for (const injury of normalized) {
    if (
      injury.includes("knee") &&
      exercise.difficultyLevel >= 3 &&
      (exercise.slug.includes("barbell-back-squat") || exercise.slug.includes("lunge"))
    ) {
      return false;
    }
    if (
      injury.includes("shoulder") &&
      exercise.difficultyLevel >= 3 &&
      (exercise.slug.includes("handstand") ||
        exercise.slug.includes("muscle-up") ||
        exercise.slug.includes("parallel-bar-dip"))
    ) {
      return false;
    }
    if (
      (injury.includes("lower back") || injury.includes("spine")) &&
      exercise.slug.includes("romanian-deadlift")
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Generates an individualized, validated WorkoutPlan strictly using catalog exercises
 * adapted to the user's per-exercise levels, recovery state, equipment, and duration.
 */
export function generatePersonalizedWorkoutPlan(
  req: WorkoutGenerationRequest
): WorkoutPlan {
  const category: TrainingCategory =
    req.category ?? req.preferences.preferredTrainingCategory ?? "gym";
  const durationMin = Math.max(
    15,
    Math.min(120, req.durationMin ?? req.user.preferredWorkoutDurationMin ?? 45)
  );
  const ownedEquipment =
    req.availableEquipment ?? req.preferences.availableEquipment ?? ["none"];
  const baselineLevel = EXPERIENCE_TO_LEVEL[req.user.fitnessExperience] ?? 2;
  const readiness = req.recoveryReadinessScore ?? 82;
  const performanceMap = req.performanceMap ?? {};
  const targetMuscles = (req.targetMuscles ?? []).map((m) => m.toLowerCase());

  // 1. Filter eligible catalog exercises
  let pool = EXERCISE_CATALOG.filter((ex) => {
    const categoryMatch =
      ex.category === category ||
      (category === "home" &&
        ex.category === "calisthenics" &&
        ex.difficultyLevel <= 2) ||
      (category === "calisthenics" &&
        ex.equipment.includes("none") &&
        ex.movementPattern !== "machine");

    if (!categoryMatch) return false;
    if (!hasRequiredEquipment(ex.equipment, ownedEquipment, category)) return false;
    if (!isSafeForUserInjuries(ex, req.user.injuriesLimitations ?? [])) return false;

    // Never recommend an advanced skill (Level 4-5) unless the user has verified performance history or baseline prerequisite
    const userExPerf = performanceMap[ex.slug];
    const effectiveUserLevelForEx = userExPerf?.currentLevel ?? baselineLevel;
    if (ex.difficultyLevel > effectiveUserLevelForEx + 1) {
      return false;
    }
    if (ex.difficultyLevel >= 4 && !userExPerf && baselineLevel < 4) {
      return false;
    }

    return true;
  });

  // Fallback if equipment filter was ultra-restrictive: use bodyweight exercises
  if (pool.length < 3) {
    pool = EXERCISE_CATALOG.filter(
      (ex) => ex.equipment.includes("none") && ex.difficultyLevel <= baselineLevel + 1
    );
  }

  // 2. Prioritize requested target muscles while keeping balanced movement patterns
  const scoredPool = pool.map((ex) => {
    let score = 10;
    const perf = performanceMap[ex.slug];
    const exTargetLevel = perf?.currentLevel ?? baselineLevel;

    // Match difficulty closely to user's per-exercise level
    const levelDiff = Math.abs(ex.difficultyLevel - exTargetLevel);
    score += Math.max(0, 6 - levelDiff * 3);

    if (targetMuscles.length > 0) {
      if (
        targetMuscles.includes(ex.primaryMuscle.toLowerCase()) ||
        targetMuscles.includes("full-body")
      ) {
        score += 12;
      } else if (
        ex.secondaryMuscles.some((sm) => targetMuscles.includes(sm.toLowerCase()))
      ) {
        score += 5;
      }
    }

    // Bonus for AI Camera Trainer support so user can verify form live
    if (ex.isCameraSupported) {
      score += 3;
    }

    // Penalize acutely sore muscles
    if (
      (req.soreMuscleAreas ?? []).some(
        (s) => s.toLowerCase() === ex.primaryMuscle.toLowerCase()
      )
    ) {
      score -= 8;
    }

    return { ex, score };
  });

  scoredPool.sort((a, b) => b.score - a.score);

  // 3. Determine exercise count from workout duration (approx 1 exercise per 8-9 mins)
  const targetExerciseCount = Math.max(3, Math.min(7, Math.round(durationMin / 8.5)));

  const selectedExercises: ExerciseCatalogItem[] = [];
  const usedPatterns = new Set<string>();

  // First pass: pick top scoring exercises across distinct movement patterns
  for (const candidate of scoredPool) {
    if (selectedExercises.length >= targetExerciseCount) break;
    if (!usedPatterns.has(candidate.ex.movementPattern)) {
      selectedExercises.push(candidate.ex);
      usedPatterns.add(candidate.ex.movementPattern);
    }
  }

  // Second pass: fill remaining slots
  for (const candidate of scoredPool) {
    if (selectedExercises.length >= targetExerciseCount) break;
    if (!selectedExercises.some((s) => s.slug === candidate.ex.slug)) {
      selectedExercises.push(candidate.ex);
    }
  }

  // 4. Customize sets, reps, rest, and progression note per exercise based on goal, readiness & history
  const volumeScale = readiness < 60 ? 0.75 : readiness < 75 ? 0.9 : 1.0;
  const restBonus = readiness < 60 ? 25 : readiness < 75 ? 10 : 0;

  const planExercises: WorkoutPlanExerciseItem[] = selectedExercises.map((ex, idx) => {
    const perf = performanceMap[ex.slug];
    const exLevel = perf?.currentLevel ?? ex.difficultyLevel;

    let sets = Math.max(2, Math.round(ex.defaultSets * volumeScale));
    let reps = ex.defaultReps;
    let restSec = ex.defaultRestSec + restBonus;

    if (req.goal === "strength" && !ex.defaultReps.includes("sec")) {
      sets = Math.max(3, Math.round(4 * volumeScale));
      reps = ex.category === "gym" ? "5-8" : "6-10";
      restSec = Math.max(90, restSec + 20);
    } else if (req.goal === "fat_loss" || req.goal === "endurance") {
      reps = ex.defaultReps.includes("sec") ? "45 sec" : "12-16";
      restSec = Math.max(40, restSec - 10);
    } else if (req.goal === "muscle_gain") {
      sets = Math.max(3, Math.round((ex.defaultSets + 1) * volumeScale));
      reps = ex.defaultReps.includes("sec") ? ex.defaultReps : "10-12";
    }

    let progressionNote = `Independent Exercise Level ${exLevel}/5. Maintain >= 82% form quality across all ${sets} sets to progress.`;
    if (perf) {
      progressionNote = `Personal Best: ${perf.personalBestReps} reps (${Math.round(
        perf.rollingFormScore
      )}% rolling form, Level ${perf.currentLevel}/5). ${
        perf.consecutiveSuccessfulSessions >= 1
          ? "1 more high-quality session unlocks your next variation!"
          : "Focus on full range of motion and controlled tempo."
      }`;
    }

    return {
      id: generateUUID(),
      exerciseId: ex.id,
      exerciseSlug: ex.slug,
      exerciseName: ex.name,
      primaryMuscle: ex.primaryMuscle,
      equipment: ex.equipment,
      difficultyLevel: exLevel,
      orderIndex: idx + 1,
      targetSets: sets,
      targetReps: reps,
      restDurationSec: restSec,
      instructions: ex.instructions.map((i) => i.instructionText),
      formGuidance:
        ex.instructions[0]?.formCue ??
        "Maintain neutral spine alignment and controlled eccentric lowering.",
      progressionRecommendation: progressionNote,
      isCameraSupported: ex.isCameraSupported,
      cameraAnalyzerKey: ex.cameraAnalyzerKey,
    };
  });

  const derivedMuscles = Array.from(
    new Set(planExercises.map((e) => e.primaryMuscle))
  );

  const categoryTitle =
    category === "gym"
      ? "Gym Resistance"
      : category === "home"
      ? "Home Equipment-Synced"
      : "Calisthenics Skill";

  const goalTitle = req.goal.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: generateUUID(),
    userId: req.user.id,
    name: `${categoryTitle} ${goalTitle} Protocol (${durationMin} Min)`,
    description: `Personalized for ${req.user.fullName || "Athlete"} based on ${
      req.user.fitnessExperience
    } profile, ${ownedEquipment.join(", ")} equipment, and ${readiness}% recovery readiness.`,
    category,
    goalFocus: req.goal,
    difficultyLevel: baselineLevel,
    estimatedDurationMin: durationMin,
    targetMuscles: derivedMuscles,
    generatedByAi: true,
    generationMode: "deterministic_engine",
    aiRationale: `Selected ${planExercises.length} movements matched to your per-exercise skill levels, ${readiness}% readiness score, and ${goalTitle.toLowerCase()} adaptation targets.`,
    exercises: planExercises,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Returns valid replacement exercises from the database matching the target muscle or movement pattern
 * and the user's owned equipment.
 */
export function getReplacementExercises(params: {
  currentExerciseSlug: string;
  category: TrainingCategory;
  availableEquipment: string[];
}): ExerciseCatalogItem[] {
  const current = getExerciseBySlug(params.currentExerciseSlug);
  if (!current) return EXERCISE_CATALOG.slice(0, 4);

  return EXERCISE_CATALOG.filter((ex) => {
    if (ex.slug === current.slug) return false;
    const sameMuscleOrPattern =
      ex.primaryMuscle === current.primaryMuscle ||
      ex.movementPattern === current.movementPattern;
    if (!sameMuscleOrPattern) return false;
    return hasRequiredEquipment(
      ex.equipment,
      params.availableEquipment,
      params.category
    );
  });
}
