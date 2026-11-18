// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — RECOVERY INTELLIGENCE ENGINE
// Computes readiness score (0..100) and training volume adjustments
// ============================================================================

import { RecoveryLog } from "@/types/fitness";
import { generateUUID, getTodayDateString } from "@/lib/utils";

export interface RecoveryEvaluationInput {
  userId: string;
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  muscleSoreness: 1 | 2 | 3 | 4 | 5; // 1 = fresh, 5 = severe soreness
  soreAreas: string[];
  fatigueLevel: 1 | 2 | 3 | 4 | 5; // 1 = energized, 5 = exhausted
  stressLevel: 1 | 2 | 3 | 4 | 5; // 1 = calm, 5 = high stress
  isRestDay?: boolean;
  notes?: string;
}

export interface RecoveryPrescription {
  readinessScore: number; // 0..100
  statusLabel: "Optimal Readiness" | "Moderate Readiness" | "Low Readiness — Active Recovery";
  volumeMultiplier: number; // 0.7 to 1.05
  restBonusSec: number; // +0 to +30s
  coachingAdvice: string;
  avoidMuscleGroups: string[];
}

/**
 * Deterministically computes a 0-100 Readiness Score from sleep, soreness, fatigue, and stress.
 */
export function calculateRecoveryReadiness(input: RecoveryEvaluationInput): {
  log: RecoveryLog;
  prescription: RecoveryPrescription;
} {
  // 1. Sleep duration score (optimal 7.5 - 9.0 hrs = 35 pts)
  const clampedSleep = Math.max(2, Math.min(12, input.sleepHours));
  const sleepDurationPts = Math.min(35, Math.round((clampedSleep / 8.0) * 35));

  // 2. Sleep quality score (1..5 -> up to 15 pts)
  const sleepQualityPts = Math.round((input.sleepQuality / 5) * 15);

  // 3. Muscle soreness penalty (1 = 20 pts, 5 = 3 pts)
  const sorenessPts = Math.round(((6 - input.muscleSoreness) / 5) * 20);

  // 4. Systemic fatigue penalty (1 = 20 pts, 5 = 3 pts)
  const fatiguePts = Math.round(((6 - input.fatigueLevel) / 5) * 20);

  // 5. Stress score (1 = 10 pts, 5 = 2 pts)
  const stressPts = Math.round(((6 - input.stressLevel) / 5) * 10);

  const readinessScore = Math.max(
    15,
    Math.min(100, sleepDurationPts + sleepQualityPts + sorenessPts + fatiguePts + stressPts)
  );

  let statusLabel: RecoveryPrescription["statusLabel"] = "Optimal Readiness";
  let volumeMultiplier = 1.0;
  let restBonusSec = 0;
  let coachingAdvice = "";

  if (readinessScore >= 78) {
    statusLabel = "Optimal Readiness";
    volumeMultiplier = 1.0;
    restBonusSec = 0;
    coachingAdvice =
      "CNS and muscular readiness are high. You are cleared for full working sets and progressive overload targets today.";
  } else if (readinessScore >= 58) {
    statusLabel = "Moderate Readiness";
    volumeMultiplier = 0.88;
    restBonusSec = 15;
    coachingAdvice =
      "Moderate recovery detected. Keep movement quality strict (RPE 7-8), extend rest intervals by +15s, and avoid grinding to failure.";
  } else {
    statusLabel = "Low Readiness — Active Recovery";
    volumeMultiplier = 0.72;
    restBonusSec = 30;
    coachingAdvice =
      "Elevated fatigue or sleep debt detected. Today's workout volume is automatically reduced by ~28% with +30s rest periods to protect joints and prevent overtraining.";
  }

  const avoidMuscleGroups = input.muscleSoreness >= 4 ? input.soreAreas : [];

  const log: RecoveryLog = {
    id: generateUUID(),
    userId: input.userId,
    loggedDate: getTodayDateString(),
    sleepHours: Number(clampedSleep.toFixed(1)),
    sleepQuality: input.sleepQuality,
    muscleSoreness: input.muscleSoreness,
    soreAreas: input.soreAreas,
    fatigueLevel: input.fatigueLevel,
    stressLevel: input.stressLevel,
    readinessScore,
    isRestDay: Boolean(input.isRestDay),
    notes: input.notes,
  };

  return {
    log,
    prescription: {
      readinessScore,
      statusLabel,
      volumeMultiplier,
      restBonusSec,
      coachingAdvice,
      avoidMuscleGroups,
    },
  };
}
