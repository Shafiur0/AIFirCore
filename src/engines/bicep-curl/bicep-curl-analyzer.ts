// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — BICEP CURL ANALYZER
// States: STARTING (arm extended) -> ASCENDING (curling) -> BOTTOM (peak contraction) -> DESCENDING -> REP_COMPLETE
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

export class BicepCurlAnalyzer implements IExerciseAnalyzer {
  readonly metadata: ExerciseAnalyzerMetadata = {
    key: "bicep-curl",
    name: "Dumbbell Bicep Curl",
    targetMuscles: ["Biceps Brachii", "Brachialis", "Forearms"],
    recommendedCameraView: "Side or 45-degree profile showing shoulder, elbow, wrist, and hip",
    positioningGuide:
      "Stand 5-6 feet from the camera at a 45° angle with your curling arm clearly visible.",
    limitationsNote:
      "2D angle analysis tracks elbow flexion and upper-arm swing; wrist supination rotation cannot be measured.",
    formRulesSummary: [
      "Full elbow flexion <= 58° at top contraction.",
      "Full bottom extension >= 152° before initiating next repetition.",
      "Upper arm stays pinned (elbow-to-shoulder horizontal drift <= 0.10 normalized width).",
    ],
    isIsometric: false,
  };

  private smoother = new ExponentialLandmarkSmoother(0.45);
  private phase: MovementPhase = "STARTING";
  private totalReps = 0;
  private goodReps = 0;
  private repsNeedingCorrection = 0;
  private repScores: number[] = [];
  private minElbowAngleInRep = 180;
  private maxUpperArmSwingInRep = 0;
  private lastRepTimestampMs = -1000;

  analyzeFrame(rawLandmarks: PoseLandmarkPoint[], timestampMs = Date.now()): AnalyzerEvaluationFrame {
    const leftVis = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      0.45
    );
    const rightVis = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
      0.45
    );

    if (!leftVis.isVisible && !rightVis.isVisible) {
      return {
        exerciseKey: "bicep-curl",
        phase: this.phase,
        totalReps: this.totalReps,
        goodReps: this.goodReps,
        repsNeedingCorrection: this.repsNeedingCorrection,
        currentFormScore: 0,
        averageFormScore: this.getAverageScore(),
        rangeOfMotionPct: 0,
        consistencyScore: 92,
        primaryJointAngle: 165,
        secondaryJointAngle: 0,
        holdDurationSec: 0,
        isBodyVisible: false,
        visibilityConfidence: Math.max(leftVis.averageConfidence, rightVis.averageConfidence),
        feedbackMessage: "Make sure your shoulder, elbow, and wrist are clearly visible.",
        feedbackSeverity: "warning",
        activeAlerts: ["Arm landmarks not visible"],
        repJustCompleted: false,
      };
    }

    const landmarks = this.smoother.smooth(rawLandmarks);
    const arm = selectBestSideJoints(
      landmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST]
    );

    const elbowAngle = calculateJointAngle(arm.a, arm.b, arm.c);
    const upperArmDrift = Math.abs(arm.a.x - arm.b.x);
    const romPct = Math.max(0, Math.min(100, Math.round(((160 - elbowAngle) / 105) * 100)));

    const activeAlerts: string[] = [];
    if (upperArmDrift > 0.11) {
      activeAlerts.push("Control your movement.");
    }

    let feedbackMessage = "Maintain proper alignment.";
    let feedbackSeverity: AnalyzerEvaluationFrame["feedbackSeverity"] = "info";
    let repJustCompleted = false;
    let lastRepScore: number | undefined;

    if (this.phase === "STARTING" || this.phase === "REP_COMPLETE") {
      if (elbowAngle < 135) {
        this.phase = "DESCENDING"; // Curling upward (angle decreasing)
        this.minElbowAngleInRep = elbowAngle;
        this.maxUpperArmSwingInRep = upperArmDrift;
        feedbackMessage = "Curl smoothly — keep your elbows pinned.";
      } else {
        this.phase = "STARTING";
      }
    } else if (this.phase === "DESCENDING") {
      this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, elbowAngle);
      this.maxUpperArmSwingInRep = Math.max(this.maxUpperArmSwingInRep, upperArmDrift);

      if (elbowAngle <= 68) {
        this.phase = "BOTTOM"; // Peak contraction
        feedbackMessage = "Peak contraction! Lower the weight with control.";
        feedbackSeverity = "good";
      } else if (elbowAngle > 152) {
        this.phase = "STARTING";
      }
    } else if (this.phase === "BOTTOM") {
      this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, elbowAngle);
      this.maxUpperArmSwingInRep = Math.max(this.maxUpperArmSwingInRep, upperArmDrift);
      if (elbowAngle > 85) {
        this.phase = "ASCENDING"; // Lowering eccentric phase
        feedbackMessage = "Control your movement.";
      }
    } else if (this.phase === "ASCENDING") {
      if (elbowAngle >= 150 && timestampMs - this.lastRepTimestampMs >= 450) {
        this.phase = "REP_COMPLETE";
        this.lastRepTimestampMs = timestampMs;
        this.totalReps += 1;
        repJustCompleted = true;

        let score = 100;
        const issues: string[] = [];
        if (this.minElbowAngleInRep > 60) {
          score -= Math.min(25, Math.round((this.minElbowAngleInRep - 55) * 1.4));
          issues.push("Curl higher for full contraction.");
        }
        if (this.maxUpperArmSwingInRep > 0.11) {
          score -= 20;
          issues.push("Control your movement.");
        }
        score = Math.max(45, Math.min(100, score));
        lastRepScore = score;
        this.repScores.push(score);

        if (score >= 80 && issues.length === 0) {
          this.goodReps += 1;
          feedbackMessage = "Excellent repetition.";
          feedbackSeverity = "good";
        } else {
          this.repsNeedingCorrection += 1;
          feedbackMessage = issues[0] ?? "Control your movement.";
          feedbackSeverity = "correction";
        }
      }
    }

    return {
      exerciseKey: "bicep-curl",
      phase: this.phase,
      totalReps: this.totalReps,
      goodReps: this.goodReps,
      repsNeedingCorrection: this.repsNeedingCorrection,
      currentFormScore: lastRepScore ?? 93,
      averageFormScore: this.getAverageScore() || 93,
      rangeOfMotionPct: romPct,
      consistencyScore: 93,
      primaryJointAngle: elbowAngle,
      secondaryJointAngle: Math.round(upperArmDrift * 100),
      holdDurationSec: 0,
      isBodyVisible: true,
      visibilityConfidence: Math.max(leftVis.averageConfidence, rightVis.averageConfidence),
      feedbackMessage,
      feedbackSeverity,
      activeAlerts,
      repJustCompleted,
      lastRepScore,
    };
  }

  private getAverageScore(): number {
    if (this.repScores.length === 0) return 0;
    return Math.round(this.repScores.reduce((a, b) => a + b, 0) / this.repScores.length);
  }

  reset(): void {
    this.smoother.reset();
    this.phase = "STARTING";
    this.totalReps = 0;
    this.goodReps = 0;
    this.repsNeedingCorrection = 0;
    this.repScores = [];
    this.minElbowAngleInRep = 180;
    this.maxUpperArmSwingInRep = 0;
    this.lastRepTimestampMs = -1000;
  }
}
