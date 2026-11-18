// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — LUNGE ANALYZER
// States: STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> REP_COMPLETE
// ============================================================================

import {
  calculateJointAngle,
  calculateVerticalInclination,
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

export class LungeAnalyzer implements IExerciseAnalyzer {
  readonly metadata: ExerciseAnalyzerMetadata = {
    key: "lunge",
    name: "Forward Lunge",
    targetMuscles: ["Quadriceps", "Glutes", "Hamstrings", "Calves"],
    recommendedCameraView: "Side profile view showing lead and trailing leg knee flexion",
    positioningGuide:
      "Stand sideways 7-9 feet from the camera so both legs remain in frame when stepping forward.",
    limitationsNote:
      "Side profile accurately assesses knee flexion and trunk verticality; frontal view is required to evaluate medial knee drift.",
    formRulesSummary: [
      "Lead knee flexion <= 102° at bottom of lunge.",
      "Torso remains upright with vertical inclination <= 25°.",
      "Controlled step return to full hip and knee extension (>= 158°).",
    ],
    isIsometric: false,
  };

  private smoother = new ExponentialLandmarkSmoother(0.45);
  private phase: MovementPhase = "STANDING";
  private totalReps = 0;
  private goodReps = 0;
  private repsNeedingCorrection = 0;
  private repScores: number[] = [];
  private minKneeAngleInRep = 180;
  private maxTorsoLeanInRep = 0;
  private lastRepTimestampMs = -1000;

  analyzeFrame(rawLandmarks: PoseLandmarkPoint[], timestampMs = Date.now()): AnalyzerEvaluationFrame {
    const vis = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
      0.45
    );
    const visRight = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
      0.45
    );

    if (!vis.isVisible && !visRight.isVisible) {
      return {
        exerciseKey: "lunge",
        phase: this.phase,
        totalReps: this.totalReps,
        goodReps: this.goodReps,
        repsNeedingCorrection: this.repsNeedingCorrection,
        currentFormScore: 0,
        averageFormScore: this.getAverageScore(),
        rangeOfMotionPct: 0,
        consistencyScore: 90,
        primaryJointAngle: 180,
        secondaryJointAngle: 0,
        holdDurationSec: 0,
        isBodyVisible: false,
        visibilityConfidence: Math.max(vis.averageConfidence, visRight.averageConfidence),
        feedbackMessage: "Ensure your hips, knees, and ankles are visible in side profile.",
        feedbackSeverity: "warning",
        activeAlerts: ["Legs not fully visible"],
        repJustCompleted: false,
      };
    }

    const landmarks = this.smoother.smooth(rawLandmarks);

    const leftKneeAngle = calculateJointAngle(
      landmarks[POSE_LANDMARKS.LEFT_HIP],
      landmarks[POSE_LANDMARKS.LEFT_KNEE],
      landmarks[POSE_LANDMARKS.LEFT_ANKLE]
    );
    const rightKneeAngle = calculateJointAngle(
      landmarks[POSE_LANDMARKS.RIGHT_HIP],
      landmarks[POSE_LANDMARKS.RIGHT_KNEE],
      landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
    );

    // Track whichever knee is flexing deepest as the lead lunge leg
    const kneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

    const trunkSide = selectBestSideJoints(
      landmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE]
    );
    const torsoLean = calculateVerticalInclination(trunkSide.a, trunkSide.b);

    const romPct = Math.max(0, Math.min(100, Math.round(((170 - kneeAngle) / 78) * 100)));
    const activeAlerts: string[] = [];
    if (torsoLean > 26) {
      activeAlerts.push("Keep your back straight.");
    }

    let feedbackMessage = "Maintain proper alignment.";
    let feedbackSeverity: AnalyzerEvaluationFrame["feedbackSeverity"] = "info";
    let repJustCompleted = false;
    let lastRepScore: number | undefined;

    if (this.phase === "STANDING" || this.phase === "REP_COMPLETE") {
      if (kneeAngle < 146) {
        this.phase = "DESCENDING";
        this.minKneeAngleInRep = kneeAngle;
        this.maxTorsoLeanInRep = torsoLean;
        feedbackMessage = "Control your movement.";
      } else {
        this.phase = "STANDING";
      }
    } else if (this.phase === "DESCENDING") {
      this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, kneeAngle);
      this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);
      if (kneeAngle <= 108) {
        this.phase = "BOTTOM";
        feedbackMessage = kneeAngle <= 98 ? "90° lunge depth reached — push back up!" : "Go a little deeper.";
      } else if (kneeAngle > 158) {
        this.phase = "STANDING";
      }
    } else if (this.phase === "BOTTOM") {
      this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, kneeAngle);
      this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);
      if (kneeAngle > this.minKneeAngleInRep + 12 && kneeAngle > 115) {
        this.phase = "ASCENDING";
      }
    } else if (this.phase === "ASCENDING") {
      if (kneeAngle >= 158 && timestampMs - this.lastRepTimestampMs >= 450) {
        this.phase = "REP_COMPLETE";
        this.lastRepTimestampMs = timestampMs;
        this.totalReps += 1;
        repJustCompleted = true;

        let score = 100;
        const issues: string[] = [];
        if (this.minKneeAngleInRep > 100) {
          score -= Math.min(25, Math.round((this.minKneeAngleInRep - 96) * 1.4));
          issues.push("Go a little deeper.");
        }
        if (this.maxTorsoLeanInRep > 26) {
          score -= Math.min(22, Math.round((this.maxTorsoLeanInRep - 24) * 1.4));
          issues.push("Keep your back straight.");
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
          feedbackMessage = issues[0] ?? "Maintain proper alignment.";
          feedbackSeverity = "correction";
        }
      }
    }

    return {
      exerciseKey: "lunge",
      phase: this.phase,
      totalReps: this.totalReps,
      goodReps: this.goodReps,
      repsNeedingCorrection: this.repsNeedingCorrection,
      currentFormScore: lastRepScore ?? 92,
      averageFormScore: this.getAverageScore() || 92,
      rangeOfMotionPct: romPct,
      consistencyScore: 90,
      primaryJointAngle: kneeAngle,
      secondaryJointAngle: torsoLean,
      holdDurationSec: 0,
      isBodyVisible: true,
      visibilityConfidence: Math.max(vis.averageConfidence, visRight.averageConfidence),
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
    this.phase = "STANDING";
    this.totalReps = 0;
    this.goodReps = 0;
    this.repsNeedingCorrection = 0;
    this.repScores = [];
    this.minKneeAngleInRep = 180;
    this.maxTorsoLeanInRep = 0;
    this.lastRepTimestampMs = -1000;
  }
}
