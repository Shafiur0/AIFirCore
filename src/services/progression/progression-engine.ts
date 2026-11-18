// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — PROGRESSIVE OVERLOAD & ADAPTIVE DIFFICULTY ENGINE
// Tracks level (1..5) independently per exercise and evaluates progression
// ============================================================================

import {
  ExerciseProgressionDecisionRecord,
  ProgressionDecisionType,
  UserExercisePerformance,
} from "@/types/fitness";
import { getExerciseBySlug } from "@/services/workout/exercise-catalog";
import { generateUUID } from "@/lib/utils";

export interface ExerciseSessionEvaluationInput {
  userId: string;
  exerciseSlug: string;
  workoutSessionId?: string;
  targetSets: number;
  completedSets: number;
  targetRepsPerSet: number;
  completedTotalReps: number;
  goodReps: number;
  averageFormScore: number; // 0 - 100
  averageRomScore: number; // 0 - 100
  perceivedRpe: number; // 1 - 10
  recoveryReadinessScore: number; // 0 - 100
  currentPerformance?: UserExercisePerformance;
}

export interface ProgressionEvaluationResult {
  updatedPerformance: UserExercisePerformance;
  decisionRecord: ExerciseProgressionDecisionRecord;
}

/**
 * Evaluates a completed exercise session and outputs an evidence-based
 * progression decision (PROGRESS, MAINTAIN, or REGRESS).
 *
 * Core safeguards enforced:
 * 1. Independent level per exercise (never uses a global user level).
 * 2. Never progresses simply because days have passed.
 * 3. Never penalizes or regresses a user for missing workouts.
 * 4. Never regresses a user based on a single poor session (requires >= 2 consecutive struggle sessions).
 * 5. Requires >= 2 consecutive successful high-form sessions AND adequate recovery (>= 60) to progress.
 */
export function evaluateExerciseProgression(
  input: ExerciseSessionEvaluationInput
): ProgressionEvaluationResult {
  const catalogEx = getExerciseBySlug(input.exerciseSlug);
  const exerciseName = catalogEx?.name ?? input.exerciseSlug;
  const exerciseId = catalogEx?.id ?? input.exerciseSlug;

  const prevLevel: 1 | 2 | 3 | 4 | 5 =
    input.currentPerformance?.currentLevel ?? catalogEx?.difficultyLevel ?? 1;

  const targetTotalReps = Math.max(1, input.targetSets * input.targetRepsPerSet);
  const completionRatio = Number((input.completedTotalReps / targetTotalReps).toFixed(2));
  const formScore = Math.max(0, Math.min(100, Math.round(input.averageFormScore)));
  const romScore = Math.max(0, Math.min(100, Math.round(input.averageRomScore)));
  const rpe = Math.max(1, Math.min(10, input.perceivedRpe));
  const readiness = Math.max(0, Math.min(100, input.recoveryReadinessScore));

  const prevRollingForm = input.currentPerformance?.rollingFormScore ?? formScore;
  const newRollingForm = Math.round(prevRollingForm * 0.4 + formScore * 0.6);

  const prevRollingConsistency = input.currentPerformance?.rollingConsistencyScore ?? 85;
  const sessionConsistency = Math.min(100, Math.round(completionRatio * 100));
  const newRollingConsistency = Math.round(prevRollingConsistency * 0.4 + sessionConsistency * 0.6);

  // Determine whether this session was a high-quality success or a struggle
  const isHighQualitySuccess =
    completionRatio >= 1.0 &&
    input.completedSets >= input.targetSets &&
    formScore >= 82 &&
    romScore >= 80 &&
    rpe <= 8;

  const isStruggleSession =
    completionRatio < 0.65 || formScore < 62 || (rpe >= 10 && completionRatio < 0.8);

  let consecutiveSuccesses = input.currentPerformance?.consecutiveSuccessfulSessions ?? 0;
  let consecutiveStruggles = input.currentPerformance?.consecutiveStruggleSessions ?? 0;

  if (isHighQualitySuccess) {
    consecutiveSuccesses += 1;
    consecutiveStruggles = 0;
  } else if (isStruggleSession) {
    consecutiveStruggles += 1;
    consecutiveSuccesses = 0;
  } else {
    // Solid maintenance session resets extreme streak counters without penalty
    consecutiveStruggles = 0;
  }

  let decision: ProgressionDecisionType = "maintain";
  let newLevel: 1 | 2 | 3 | 4 | 5 = prevLevel;
  let reasonSummary = "";
  let recommendedVariationName =
    input.currentPerformance?.currentVariationName ?? exerciseName;
  let recommendedRepsOrLoad = `${input.targetSets} sets × ${input.targetRepsPerSet} reps`;

  // DECISION 1: PROGRESS
  if (consecutiveSuccesses >= 2 && readiness >= 60) {
    decision = "progress";
    const harderSlug = catalogEx?.progressionOptions?.harderVariationSlug;
    const harderEx = harderSlug ? getExerciseBySlug(harderSlug) : undefined;

    if (prevLevel < 5) {
      newLevel = (prevLevel + 1) as 1 | 2 | 3 | 4 | 5;
    }

    if (harderEx) {
      recommendedVariationName = harderEx.name;
      recommendedRepsOrLoad = `${harderEx.defaultSets} sets × ${harderEx.defaultReps}`;
      reasonSummary = `Completed ${consecutiveSuccesses} consecutive high-quality sessions (${Math.round(
        completionRatio * 100
      )}% target volume, ${formScore}% form quality, ${romScore}% ROM, RPE ${rpe}/10) with ${readiness}% recovery readiness. Ready to progress from ${exerciseName} to ${harderEx.name} (Level ${newLevel}).`;
    } else {
      const nextReps = input.targetRepsPerSet + 2;
      recommendedRepsOrLoad = `${input.targetSets} sets × ${nextReps} reps (or +2.5 kg load)`;
      reasonSummary = `Sustained mastery across ${consecutiveSuccesses} consecutive sessions (${formScore}% form score, ${romScore}% ROM). Applying progressive overload: increase target to ${recommendedRepsOrLoad} (Level ${newLevel}).`;
    }
    // Reset counter after level up so next level requires fresh evidence
    consecutiveSuccesses = 0;
  }
  // DECISION 2: REGRESS (Requires >= 2 consecutive struggle sessions — never regresses on 1 bad day!)
  else if (consecutiveStruggles >= 2) {
    decision = "regress";
    const easierSlug = catalogEx?.progressionOptions?.easierVariationSlug;
    const easierEx = easierSlug ? getExerciseBySlug(easierSlug) : undefined;

    if (prevLevel > 1) {
      newLevel = (prevLevel - 1) as 1 | 2 | 3 | 4 | 5;
    }

    if (easierEx) {
      recommendedVariationName = easierEx.name;
      recommendedRepsOrLoad = `${easierEx.defaultSets} sets × ${easierEx.defaultReps}`;
      reasonSummary = `Detected ${consecutiveStruggles} consecutive sessions below threshold (${Math.round(
        completionRatio * 100
      )}% completion, ${formScore}% form quality, RPE ${rpe}/10). Recommending strategic regression to ${easierEx.name} (Level ${newLevel}) to rebuild clean mechanics and joint confidence.`;
    } else {
      const reducedReps = Math.max(5, input.targetRepsPerSet - 2);
      recommendedRepsOrLoad = `${input.targetSets} sets × ${reducedReps} controlled reps`;
      reasonSummary = `Logged ${consecutiveStruggles} consecutive high-fatigue struggle sessions (${formScore}% form score). Reducing volume target to ${recommendedRepsOrLoad} (Level ${newLevel}) to prioritize movement quality.`;
    }
    consecutiveStruggles = 0;
  }
  // DECISION 3: MAINTAIN
  else {
    decision = "maintain";
    if (isStruggleSession) {
      reasonSummary = `Single challenging session noted (${Math.round(
        completionRatio * 100
      )}% completion, ${formScore}% form score). The AI Progression Engine never regresses on a single off-day—maintaining Level ${prevLevel} (${exerciseName}) for your next workout.`;
    } else if (isHighQualitySuccess && readiness < 60) {
      reasonSummary = `Strong execution (${formScore}% form score), but current recovery readiness is low (${readiness}%). Maintaining current difficulty (Level ${prevLevel}) until recovery rebounds above 60%.`;
    } else if (isHighQualitySuccess) {
      reasonSummary = `Excellent session (${formScore}% form score, ${romScore}% ROM). Complete 1 more consecutive high-quality session to unlock the next progression step.`;
    } else {
      reasonSummary = `Solid training stimulus (${Math.round(
        completionRatio * 100
      )}% completion, ${formScore}% form score). Maintaining Level ${prevLevel} on ${exerciseName} to consolidate form consistency (>= 82% required to progress).`;
    }
  }

  const updatedPerformance: UserExercisePerformance = {
    id: input.currentPerformance?.id ?? generateUUID(),
    userId: input.userId,
    exerciseId,
    exerciseSlug: input.exerciseSlug,
    exerciseName,
    currentLevel: newLevel,
    currentVariationName: recommendedVariationName,
    personalBestReps: Math.max(
      input.currentPerformance?.personalBestReps ?? 0,
      input.completedTotalReps
    ),
    personalBestWeightKg: input.currentPerformance?.personalBestWeightKg ?? 0,
    rollingFormScore: newRollingForm,
    rollingConsistencyScore: newRollingConsistency,
    consecutiveSuccessfulSessions: consecutiveSuccesses,
    consecutiveStruggleSessions: consecutiveStruggles,
    lastPerformedAt: new Date().toISOString(),
  };

  const decisionRecord: ExerciseProgressionDecisionRecord = {
    id: generateUUID(),
    userId: input.userId,
    exerciseId,
    exerciseSlug: input.exerciseSlug,
    exerciseName,
    workoutSessionId: input.workoutSessionId,
    previousLevel: prevLevel,
    newLevel,
    decision,
    reasonSummary,
    recommendedVariationName,
    recommendedRepsOrLoad,
    evidenceMetrics: {
      completionRatio,
      formScore,
      romScore,
      consecutiveSuccesses,
      consecutiveStruggles,
      recoveryReadiness: readiness,
      rpe,
    },
    createdAt: new Date().toISOString(),
  };

  return {
    updatedPerformance,
    decisionRecord,
  };
}
