// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — EXERCISE ANALYZER INTERFACES
// Standardized state machine & form-scoring contract for all 6 CV exercises
// ============================================================================

import { CameraExerciseKey } from "@/types/fitness";
import { PoseLandmarkPoint } from "@/engines/pose/geometry";

export type MovementPhase =
  | "IDLE"
  | "STARTING"
  | "STANDING"
  | "DESCENDING"
  | "BOTTOM"
  | "ASCENDING"
  | "HOLDING"
  | "REP_COMPLETE";

export interface AnalyzerEvaluationFrame {
  exerciseKey: CameraExerciseKey;
  phase: MovementPhase;
  totalReps: number;
  goodReps: number;
  repsNeedingCorrection: number;
  currentFormScore: number; // 0-100 estimated movement-quality indicator
  averageFormScore: number; // 0-100 across completed reps
  rangeOfMotionPct: number; // 0-100
  consistencyScore: number; // 0-100
  primaryJointAngle: number;
  secondaryJointAngle: number;
  holdDurationSec: number;
  isBodyVisible: boolean;
  visibilityConfidence: number;
  feedbackMessage: string;
  feedbackSeverity: "good" | "warning" | "correction" | "info";
  activeAlerts: string[];
  repJustCompleted: boolean;
  lastRepScore?: number;
}

export interface ExerciseAnalyzerMetadata {
  key: CameraExerciseKey;
  name: string;
  targetMuscles: string[];
  recommendedCameraView: string;
  positioningGuide: string;
  limitationsNote: string;
  formRulesSummary: string[];
  isIsometric: boolean;
}

export interface IExerciseAnalyzer {
  readonly metadata: ExerciseAnalyzerMetadata;
  analyzeFrame(landmarks: PoseLandmarkPoint[], timestampMs?: number): AnalyzerEvaluationFrame;
  reset(): void;
}
