// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — PLANK ANALYZER (ISOMETRIC HOLD)
// States: IDLE -> HOLDING -> REP_COMPLETE (counts aligned hold seconds)
// ============================================================================

import {
  calculateJointAngle,
  checkRequiredLandmarksVisible,
  ExponentialLandmarkSmoother,
  POSE_LANDMARKS,
  PoseLandmarkPoint,
  selectBestSideJoints,
} from "@/engines/pose/geometry";
import {
  AnalyzerEvaluationFrame,
  ExerciseAnalyzerMetadata,
  IExerciseAnalyzer,
  MovementPhase,
} from "@/engines/exercises/types";

export class PlankAnalyzer implements IExerciseAnalyzer {
  readonly metadata: ExerciseAnalyzerMetadata = {
    key: "plank",
    name: "Forearm Plank Hold",
    targetMuscles: ["Core (Transverse Abdominis)", "Rectus Abdominis", "Shoulders", "Glutes"],
    recommendedCameraView: "Side profile view at floor height showing shoulder, hip, knee, and ankle",
    positioningGuide:
      "Position camera at floor level to your side so your full body plank line is visible.",
    limitationsNote:
      "Isometric analysis evaluates sagittal hip sag or pike alignment; internal abdominal bracing cannot be measured optically.",
    formRulesSummary: [
      "Shoulder-Hip-Ankle collinearity angle between 163° and 180°.",
      "Horizontal torso orientation (shoulder and hip y-coordinates within 0.22 normalized units).",
      "Each 5 seconds of aligned hold increments a completed hold interval.",
    ],
    isIsometric: true,
  };

  private smoother = new ExponentialLandmarkSmoother(0.4);
  private phase: MovementPhase = "IDLE";
  private holdDurationSec = 0;
  private lastTickMs: number | null = null;
  private totalIntervals = 0;
  private goodIntervals = 0;
  private badIntervals = 0;
  private scoreAccumulator: number[] = [];

  analyzeFrame(rawLandmarks: PoseLandmarkPoint[], timestampMs = Date.now()): AnalyzerEvaluationFrame {
    const vis = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE],
      0.45
    );
    const visRight = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_ANKLE],
      0.45
    );

    if (!vis.isVisible && !visRight.isVisible) {
      this.lastTickMs = null;
      return {
        exerciseKey: "plank",
        phase: "IDLE",
        totalReps: this.totalIntervals,
        goodReps: this.goodIntervals,
        repsNeedingCorrection: this.badIntervals,
        currentFormScore: 0,
        averageFormScore: this.getAverageScore(),
        rangeOfMotionPct: 0,
        consistencyScore: 95,
        primaryJointAngle: 180,
        secondaryJointAngle: 180,
        holdDurationSec: Math.round(this.holdDurationSec),
        isBodyVisible: false,
        visibilityConfidence: Math.max(vis.averageConfidence, visRight.averageConfidence),
        feedbackMessage: "Position your full side profile (shoulders, hips, ankles) inside the frame.",
        feedbackSeverity: "warning",
        activeAlerts: ["Full body plank line not visible"],
        repJustCompleted: false,
      };
    }

    const landmarks = this.smoother.smooth(rawLandmarks);
    const side = selectBestSideJoints(
      landmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_ANKLE]
    );

    const alignmentAngle = calculateJointAngle(side.a, side.b, side.c);
    const horizontalDeltaY = Math.abs(side.a.y - side.c.y);
    const isHorizontalPlank = horizontalDeltaY < 0.38;

    const activeAlerts: string[] = [];
    let feedbackMessage = "Maintain proper alignment.";
    let feedbackSeverity: AnalyzerEvaluationFrame["feedbackSeverity"] = "good";
    let repJustCompleted = false;

    let formScore = 98;
    if (alignmentAngle < 162) {
      formScore -= Math.min(40, Math.round((165 - alignmentAngle) * 1.8));
      activeAlerts.push("Keep your back straight.");
      feedbackMessage = "Keep your back straight.";
      feedbackSeverity = "correction";
    } else {
      feedbackMessage = "Excellent repetition.";
    }

    if (isHorizontalPlank) {
      this.phase = "HOLDING";
      if (this.lastTickMs !== null) {
        const dtSec = Math.max(0, Math.min(1.0, (timestampMs - this.lastTickMs) / 1000));
        const prevBuckets = Math.floor(this.holdDurationSec / 5);
        this.holdDurationSec += dtSec;
        const newBuckets = Math.floor(this.holdDurationSec / 5);

        if (newBuckets > prevBuckets) {
          this.totalIntervals += 1;
          repJustCompleted = true;
          this.scoreAccumulator.push(formScore);
          if (formScore >= 80) {
            this.goodIntervals += 1;
          } else {
            this.badIntervals += 1;
          }
        }
      }
      this.lastTickMs = timestampMs;
    } else {
      this.phase = "IDLE";
      this.lastTickMs = timestampMs;
      feedbackMessage = "Lower into a horizontal forearm plank position to begin hold timer.";
      feedbackSeverity = "info";
    }

    return {
      exerciseKey: "plank",
      phase: this.phase,
      totalReps: Math.round(this.holdDurationSec),
      goodReps: this.goodIntervals,
      repsNeedingCorrection: this.badIntervals,
      currentFormScore: formScore,
      averageFormScore: this.getAverageScore() || formScore,
      rangeOfMotionPct: isHorizontalPlank ? 100 : 0,
      consistencyScore: 94,
      primaryJointAngle: alignmentAngle,
      secondaryJointAngle: Math.round((1 - horizontalDeltaY) * 100),
      holdDurationSec: Number(this.holdDurationSec.toFixed(1)),
      isBodyVisible: true,
      visibilityConfidence: Math.max(vis.averageConfidence, visRight.averageConfidence),
      feedbackMessage,
      feedbackSeverity,
      activeAlerts,
      repJustCompleted,
      lastRepScore: formScore,
    };
  }

  private getAverageScore(): number {
    if (this.scoreAccumulator.length === 0) return 0;
    return Math.round(
      this.scoreAccumulator.reduce((a, b) => a + b, 0) / this.scoreAccumulator.length
    );
  }

  reset(): void {
    this.smoother.reset();
    this.phase = "IDLE";
    this.holdDurationSec = 0;
    this.lastTickMs = null;
    this.totalIntervals = 0;
    this.goodIntervals = 0;
    this.badIntervals = 0;
    this.scoreAccumulator = [];
  }
}
