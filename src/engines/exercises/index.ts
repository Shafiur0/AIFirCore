// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — EXERCISE ANALYZER FACTORY & REGISTRY
// ============================================================================

import { CameraExerciseKey } from "@/types/fitness";
import { ExerciseAnalyzerMetadata, IExerciseAnalyzer } from "@/engines/exercises/types";
import { SquatAnalyzer } from "@/engines/squat/squat-analyzer";
import { PushUpAnalyzer } from "@/engines/pushup/pushup-analyzer";
import { LungeAnalyzer } from "@/engines/lunge/lunge-analyzer";
import { PlankAnalyzer } from "@/engines/plank/plank-analyzer";
import { BicepCurlAnalyzer } from "@/engines/bicep-curl/bicep-curl-analyzer";
import { ShoulderPressAnalyzer } from "@/engines/shoulder-press/shoulder-press-analyzer";

export function createExerciseAnalyzer(key: CameraExerciseKey): IExerciseAnalyzer {
  switch (key) {
    case "squat":
      return new SquatAnalyzer();
    case "pushup":
      return new PushUpAnalyzer();
    case "lunge":
      return new LungeAnalyzer();
    case "plank":
      return new PlankAnalyzer();
    case "bicep-curl":
      return new BicepCurlAnalyzer();
    case "shoulder-press":
      return new ShoulderPressAnalyzer();
    default:
      return new SquatAnalyzer();
  }
}

export const CAMERA_EXERCISES_METADATA: ExerciseAnalyzerMetadata[] = [
  new SquatAnalyzer().metadata,
  new PushUpAnalyzer().metadata,
  new LungeAnalyzer().metadata,
  new PlankAnalyzer().metadata,
  new BicepCurlAnalyzer().metadata,
  new ShoulderPressAnalyzer().metadata,
];
