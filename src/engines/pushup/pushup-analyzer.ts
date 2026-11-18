// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — PUSH-UP ANALYZER
// States: STARTING -> DESCENDING -> BOTTOM -> ASCENDING -> REP_COMPLETE
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

export class PushUpAnalyzer implements IExerciseAnalyzer {
  readonly metadata: ExerciseAnalyzerMetadata = {
    key: "pushup",
    name: "Standard Push-Up",
    targetMuscles: ["Chest (Pectorals)", "Triceps", "Anterior Deltoids", "Core"],
    recommendedCameraView: "Side profile view at floor/mat height (full body shoulder-to-ankle)",
    positioningGuide:
      "Place your camera low to the side so your shoulder, elbow, wrist, hip, and ankle form a clear profile.",
    limitationsNote:
      "Single-camera profile tracks elbow flexion and trunk sag accurately, but scapular winging requires a dorsal overhead view.",
    formRulesSummary: [
      "Elbow angle <= 95° at bottom position for full push-up depth.",
      "Shoulder-Hip-Ankle body alignment angle >= 160° (no hip sag or excessive pike).",
      "Full lockout extension >= 158° at top position.",
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
  private minBodyAlignmentInRep = 180;
  private descentStartTimeMs = 0;
  private lastRepTimestampMs = -1000;

  analyzeFrame(rawLandmarks: PoseLandmarkPoint[], timestampMs = Date.now()): AnalyzerEvaluationFrame {
    const leftCheck = checkRequiredLandmarksVisible(
      rawLandmarks,
      [
        POSE_LANDMARKS.LEFT_SHOULDER,
        POSE_LANDMARKS.LEFT_ELBOW,
        POSE_LANDMARKS.LEFT_WRIST,
        POSE_LANDMARKS.LEFT_HIP,
      ],
      0.45
    );
    const rightCheck = checkRequiredLandmarksVisible(
      rawLandmarks,
      [
        POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.RIGHT_ELBOW,
        POSE_LANDMARKS.RIGHT_WRIST,
        POSE_LANDMARKS.RIGHT_HIP,
      ],
      0.45
    );

    const isVisible = leftCheck.isVisible || rightCheck.isVisible;
    const confidence = Math.max(leftCheck.averageConfidence, rightCheck.averageConfidence);

    if (!isVisible) {
      return {
        exerciseKey: "pushup",
        phase: this.phase,
        totalReps: this.totalReps,
        goodReps: this.goodReps,
        repsNeedingCorrection: this.repsNeedingCorrection,
        currentFormScore: 0,
        averageFormScore: this.getAverageScore(),
        rangeOfMotionPct: 0,
        consistencyScore: 95,
        primaryJointAngle: 180,
        secondaryJointAngle: 180,
        holdDurationSec: 0,
        isBodyVisible: false,
        visibilityConfidence: confidence,
        feedbackMessage: "Position your camera to the side so your arms, torso, and hips are visible.",
        feedbackSeverity: "warning",
        activeAlerts: ["Upper body profile not visible"],
        repJustCompleted: false,
      };
    }

    const landmarks = this.smoother.smooth(rawLandmarks);

    // Primary angle: Shoulder - Elbow - Wrist
    const armSide = selectBestSideJoints(
      landmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST]
    );
    const elbowAngle = calculateJointAngle(armSide.a, armSide.b, armSide.c);

    // Secondary angle: Shoulder - Hip - Ankle (or Knee if ankle less visible)
    const bodySide = selectBestSideJoints(
      landmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_ANKLE]
    );
    const bodyAlignmentAngle = calculateJointAngle(bodySide.a, bodySide.b, bodySide.c);

    const romPct = Math.max(0, Math.min(100, Math.round(((165 - elbowAngle) / 75) * 100)));

    const activeAlerts: string[] = [];
    if (bodyAlignmentAngle < 158) {
      activeAlerts.push("Keep your back straight.");
    }

    let feedbackMessage = "Maintain proper alignment.";
    let feedbackSeverity: AnalyzerEvaluationFrame["feedbackSeverity"] = "info";
    let repJustCompleted = false;
    let lastRepScore: number | undefined;

    if (this.phase === "STARTING" || this.phase === "REP_COMPLETE") {
      if (elbowAngle < 146) {
        this.phase = "DESCENDING";
        this.minElbowAngleInRep = elbowAngle;
        this.minBodyAlignmentInRep = bodyAlignmentAngle;
        this.descentStartTimeMs = timestampMs;
        feedbackMessage = "Control your movement.";
      } else {
        this.phase = "STARTING";
        feedbackMessage = "Plank locked — lower your chest with control.";
      }
    } else if (this.phase === "DESCENDING") {
      this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, elbowAngle);
      this.minBodyAlignmentInRep = Math.min(this.minBodyAlignmentInRep, bodyAlignmentAngle);

      if (elbowAngle <= 102) {
        this.phase = "BOTTOM";
        feedbackMessage =
          elbowAngle <= 95 ? "Bottom position reached — press back up!" : "Go a little deeper.";
        feedbackSeverity = elbowAngle <= 95 ? "good" : "warning";
      } else if (elbowAngle > 158) {
        this.phase = "STARTING";
        feedbackMessage = "Go a little deeper.";
        feedbackSeverity = "correction";
      } else {
        feedbackMessage = activeAlerts[0] ?? "Go a little deeper.";
      }
    } else if (this.phase === "BOTTOM") {
      this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, elbowAngle);
      this.minBodyAlignmentInRep = Math.min(this.minBodyAlignmentInRep, bodyAlignmentAngle);

      if (elbowAngle > this.minElbowAngleInRep + 12 && elbowAngle > 108) {
        this.phase = "ASCENDING";
        feedbackMessage = activeAlerts[0] ?? "Press strongly to full lockout.";
      }
    } else if (this.phase === "ASCENDING") {
      this.minBodyAlignmentInRep = Math.min(this.minBodyAlignmentInRep, bodyAlignmentAngle);

      if (elbowAngle >= 156) {
        const repDuration = timestampMs - this.descentStartTimeMs;
        const timeSinceLast = timestampMs - this.lastRepTimestampMs;

        if (timeSinceLast >= 450 && repDuration >= 250) {
          this.phase = "REP_COMPLETE";
          this.lastRepTimestampMs = timestampMs;
          this.totalReps += 1;
          repJustCompleted = true;

          let repScore = 100;
          const issues: string[] = [];

          if (this.minElbowAngleInRep > 96) {
            repScore -= Math.min(28, Math.round((this.minElbowAngleInRep - 92) * 1.5));
            issues.push("Go a little deeper.");
          }
          if (this.minBodyAlignmentInRep < 158) {
            repScore -= Math.min(28, Math.round((162 - this.minBodyAlignmentInRep) * 1.3));
            issues.push("Keep your back straight.");
          }
          if (repDuration < 400) {
            repScore -= 12;
            issues.push("Control your movement.");
          }

          repScore = Math.max(40, Math.min(100, repScore));
          lastRepScore = repScore;
          this.repScores.push(repScore);

          if (repScore >= 80 && issues.length === 0) {
            this.goodReps += 1;
            feedbackMessage = "Excellent repetition.";
            feedbackSeverity = "good";
          } else {
            this.repsNeedingCorrection += 1;
            feedbackMessage = issues[0] ?? "Maintain proper alignment.";
            feedbackSeverity = "correction";
          }
        } else {
          this.phase = "STARTING";
        }
      } else if (elbowAngle < 100) {
        this.phase = "BOTTOM";
      }
    }

    let liveScore = 95;
    if (bodyAlignmentAngle < 158) liveScore -= Math.min(25, Math.round(162 - bodyAlignmentAngle));
    liveScore = Math.max(50, Math.min(100, liveScore));

    return {
      exerciseKey: "pushup",
      phase: this.phase,
      totalReps: this.totalReps,
      goodReps: this.goodReps,
      repsNeedingCorrection: this.repsNeedingCorrection,
      currentFormScore: lastRepScore ?? liveScore,
      averageFormScore: this.getAverageScore() || liveScore,
      rangeOfMotionPct: romPct,
      consistencyScore: 92,
      primaryJointAngle: elbowAngle,
      secondaryJointAngle: bodyAlignmentAngle,
      holdDurationSec: 0,
      isBodyVisible: true,
      visibilityConfidence: confidence,
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
    this.minBodyAlignmentInRep = 180;
    this.lastRepTimestampMs = -1000;
  }
}
