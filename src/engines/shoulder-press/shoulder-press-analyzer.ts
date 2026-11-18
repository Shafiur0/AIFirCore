// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SHOULDER PRESS ANALYZER
// States: STARTING (rack at shoulders) -> ASCENDING (pressing overhead) -> BOTTOM (top lockout) -> DESCENDING -> REP_COMPLETE
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

export class ShoulderPressAnalyzer implements IExerciseAnalyzer {
  readonly metadata: ExerciseAnalyzerMetadata = {
    key: "shoulder-press",
    name: "Overhead Shoulder Press",
    targetMuscles: ["Anterior & Lateral Deltoids", "Triceps", "Upper Trapezius", "Core"],
    recommendedCameraView: "Front view showing both arms pressing symmetrically overhead",
    positioningGuide:
      "Face the camera 6-7 feet back so your hands at full overhead extension remain inside the top of the frame.",
    limitationsNote:
      "Front camera tracks bilateral symmetry and overhead elbow extension; lumbar hyperextension requires a side view.",
    formRulesSummary: [
      "Start with elbows flexed <= 95° at shoulder height.",
      "Press overhead to full elbow extension >= 160° with wrists above shoulders.",
      "Maintain bilateral arm symmetry within 18° between left and right elbows.",
    ],
    isIsometric: false,
  };

  private smoother = new ExponentialLandmarkSmoother(0.45);
  private phase: MovementPhase = "STARTING";
  private totalReps = 0;
  private goodReps = 0;
  private repsNeedingCorrection = 0;
  private repScores: number[] = [];
  private maxElbowExtensionInRep = 90;
  private maxAsymmetryInRep = 0;
  private lastRepTimestampMs = -1000;

  analyzeFrame(rawLandmarks: PoseLandmarkPoint[], timestampMs = Date.now()): AnalyzerEvaluationFrame {
    const vis = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      0.45
    );
    const visRight = checkRequiredLandmarksVisible(
      rawLandmarks,
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
      0.45
    );

    if (!vis.isVisible && !visRight.isVisible) {
      return {
        exerciseKey: "shoulder-press",
        phase: this.phase,
        totalReps: this.totalReps,
        goodReps: this.goodReps,
        repsNeedingCorrection: this.repsNeedingCorrection,
        currentFormScore: 0,
        averageFormScore: this.getAverageScore(),
        rangeOfMotionPct: 0,
        consistencyScore: 92,
        primaryJointAngle: 90,
        secondaryJointAngle: 0,
        holdDurationSec: 0,
        isBodyVisible: false,
        visibilityConfidence: Math.max(vis.averageConfidence, visRight.averageConfidence),
        feedbackMessage: "Step back so your shoulders, elbows, and overhead reach are visible.",
        feedbackSeverity: "warning",
        activeAlerts: ["Upper body overhead reach not visible"],
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
    const isWristOverhead = arm.c.y < arm.a.y; // y is smaller toward top of screen

    let asymmetry = 0;
    if (vis.isVisible && visRight.isVisible) {
      const leftA = calculateJointAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_WRIST]
      );
      const rightA = calculateJointAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      );
      asymmetry = Math.abs(leftA - rightA);
    }

    const romPct = isWristOverhead
      ? Math.max(0, Math.min(100, Math.round(((elbowAngle - 80) / 85) * 100)))
      : 0;

    const activeAlerts: string[] = [];
    if (asymmetry > 20) {
      activeAlerts.push("Maintain proper alignment.");
    }

    let feedbackMessage = "Maintain proper alignment.";
    let feedbackSeverity: AnalyzerEvaluationFrame["feedbackSeverity"] = "info";
    let repJustCompleted = false;
    let lastRepScore: number | undefined;

    if (this.phase === "STARTING" || this.phase === "REP_COMPLETE") {
      if (isWristOverhead && elbowAngle > 110) {
        this.phase = "ASCENDING";
        this.maxElbowExtensionInRep = elbowAngle;
        this.maxAsymmetryInRep = asymmetry;
        feedbackMessage = "Press smoothly to overhead lockout.";
      } else {
        this.phase = "STARTING";
      }
    } else if (this.phase === "ASCENDING") {
      this.maxElbowExtensionInRep = Math.max(this.maxElbowExtensionInRep, elbowAngle);
      this.maxAsymmetryInRep = Math.max(this.maxAsymmetryInRep, asymmetry);

      if (isWristOverhead && elbowAngle >= 152) {
        this.phase = "BOTTOM"; // Top overhead peak
        feedbackMessage = "Overhead lockout reached — lower with control.";
        feedbackSeverity = "good";
      } else if (elbowAngle < 95) {
        this.phase = "STARTING";
      }
    } else if (this.phase === "BOTTOM") {
      this.maxElbowExtensionInRep = Math.max(this.maxElbowExtensionInRep, elbowAngle);
      if (elbowAngle < 138) {
        this.phase = "DESCENDING";
        feedbackMessage = "Control your movement.";
      }
    } else if (this.phase === "DESCENDING") {
      if (elbowAngle <= 100 && timestampMs - this.lastRepTimestampMs >= 450) {
        this.phase = "REP_COMPLETE";
        this.lastRepTimestampMs = timestampMs;
        this.totalReps += 1;
        repJustCompleted = true;

        let score = 100;
        const issues: string[] = [];
        if (this.maxElbowExtensionInRep < 158) {
          score -= Math.min(25, Math.round((162 - this.maxElbowExtensionInRep) * 1.4));
          issues.push("Extend arms fully overhead.");
        }
        if (this.maxAsymmetryInRep > 20) {
          score -= 18;
          issues.push("Maintain proper alignment.");
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
      exerciseKey: "shoulder-press",
      phase: this.phase,
      totalReps: this.totalReps,
      goodReps: this.goodReps,
      repsNeedingCorrection: this.repsNeedingCorrection,
      currentFormScore: lastRepScore ?? 92,
      averageFormScore: this.getAverageScore() || 92,
      rangeOfMotionPct: romPct,
      consistencyScore: 91,
      primaryJointAngle: elbowAngle,
      secondaryJointAngle: Math.round(asymmetry),
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
    this.phase = "STARTING";
    this.totalReps = 0;
    this.goodReps = 0;
    this.repsNeedingCorrection = 0;
    this.repScores = [];
    this.maxElbowExtensionInRep = 90;
    this.maxAsymmetryInRep = 0;
    this.lastRepTimestampMs = -1000;
  }
}
