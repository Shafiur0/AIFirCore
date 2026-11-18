// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SQUAT ANALYZER
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

export class SquatAnalyzer implements IExerciseAnalyzer {
  readonly metadata: ExerciseAnalyzerMetadata = {
    key: "squat",
    name: "Bodyweight Squat",
    targetMuscles: ["Quadriceps", "Glutes", "Hamstrings", "Core"],
    recommendedCameraView: "45-degree diagonal or side profile (full body head-to-ankle)",
    positioningGuide:
      "Stand 6-8 feet from the camera at a 45° angle so both hip/knee depth and knee tracking are visible.",
    limitationsNote:
      "Single-camera 2D projection provides an estimated movement-quality indicator and cannot measure internal spinal shear forces or clinical ankle dorsiflexion torque.",
    formRulesSummary: [
      "Knee flexion angle <= 100° at bottom of squat for full depth (100% ROM).",
      "Torso forward lean inclination <= 42° relative to vertical to keep back straight.",
      "Frontal knee-to-hip alignment ratio >= 0.78 to prevent inward knee valgus collapse.",
      "Controlled descent duration >= 350ms to prevent uncontrolled bouncing.",
    ],
    isIsometric: false,
  };

  private smoother = new ExponentialLandmarkSmoother(0.45);
  private phase: MovementPhase = "STANDING";
  private totalReps = 0;
  private goodReps = 0;
  private repsNeedingCorrection = 0;
  private repScores: number[] = [];
  private repDurationsMs: number[] = [];
  private minKneeAngleInRep = 180;
  private maxTorsoLeanInRep = 0;
  private valgusDetectedInRep = false;
  private descentStartTimeMs = 0;
  private lastRepTimestampMs = -1000;

  analyzeFrame(rawLandmarks: PoseLandmarkPoint[], timestampMs = Date.now()): AnalyzerEvaluationFrame {
    const visibility = checkRequiredLandmarksVisible(
      rawLandmarks,
      [
        POSE_LANDMARKS.LEFT_SHOULDER,
        POSE_LANDMARKS.LEFT_HIP,
        POSE_LANDMARKS.LEFT_KNEE,
        POSE_LANDMARKS.LEFT_ANKLE,
      ],
      0.45
    );

    const altVisibility = checkRequiredLandmarksVisible(
      rawLandmarks,
      [
        POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.RIGHT_HIP,
        POSE_LANDMARKS.RIGHT_KNEE,
        POSE_LANDMARKS.RIGHT_ANKLE,
      ],
      0.45
    );

    const isVisible = visibility.isVisible || altVisibility.isVisible;
    const confidence = Math.max(visibility.averageConfidence, altVisibility.averageConfidence);

    if (!isVisible) {
      return {
        exerciseKey: "squat",
        phase: this.phase,
        totalReps: this.totalReps,
        goodReps: this.goodReps,
        repsNeedingCorrection: this.repsNeedingCorrection,
        currentFormScore: 0,
        averageFormScore: this.getAverageScore(),
        rangeOfMotionPct: 0,
        consistencyScore: this.getConsistencyScore(),
        primaryJointAngle: 180,
        secondaryJointAngle: 180,
        holdDurationSec: 0,
        isBodyVisible: false,
        visibilityConfidence: confidence,
        feedbackMessage: "Step back so your shoulders, hips, knees, and ankles are clearly inside the frame.",
        feedbackSeverity: "warning",
        activeAlerts: ["Full lower body not visible"],
        repJustCompleted: false,
      };
    }

    const landmarks = this.smoother.smooth(rawLandmarks);

    // Primary angle: Hip - Knee - Ankle
    const legSide = selectBestSideJoints(
      landmarks,
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
      [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE]
    );
    const kneeAngle = calculateJointAngle(legSide.a, legSide.b, legSide.c);

    // Secondary angle: Shoulder - Hip - Knee (hip flexion)
    const hipSide = selectBestSideJoints(
      landmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
      [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE]
    );
    const hipAngle = calculateJointAngle(hipSide.a, hipSide.b, hipSide.c);

    // Torso inclination from vertical
    const torsoLean = calculateVerticalInclination(hipSide.a, hipSide.b);

    // Knee valgus proxy (when both knees & hips visible in diagonal/frontal view)
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const kneeWidth = Math.abs(leftKnee.x - rightKnee.x);
    const isValgus = hipWidth > 0.08 && kneeAngle < 140 && kneeWidth < hipWidth * 0.72;

    // Range of motion percentage (170° standing = 0%, 90° bottom = 100%)
    const romPct = Math.max(0, Math.min(100, Math.round(((170 - kneeAngle) / 80) * 100)));

    const activeAlerts: string[] = [];
    let feedbackMessage = "Maintain proper alignment.";
    let feedbackSeverity: AnalyzerEvaluationFrame["feedbackSeverity"] = "info";
    let repJustCompleted = false;
    let lastRepScore: number | undefined;

    if (torsoLean > 43) {
      activeAlerts.push("Keep your back straight.");
    }
    if (isValgus) {
      this.valgusDetectedInRep = true;
      activeAlerts.push("Your knees are moving inward.");
    }

    // State Machine Transitions
    if (this.phase === "STANDING" || this.phase === "REP_COMPLETE") {
      if (kneeAngle < 148) {
        this.phase = "DESCENDING";
        this.minKneeAngleInRep = kneeAngle;
        this.maxTorsoLeanInRep = torsoLean;
        this.valgusDetectedInRep = isValgus;
        this.descentStartTimeMs = timestampMs;
        feedbackMessage = "Control your movement.";
      } else {
        this.phase = "STANDING";
        feedbackMessage = "Ready — begin your squat descent with chest up.";
      }
    } else if (this.phase === "DESCENDING") {
      this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, kneeAngle);
      this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);

      if (kneeAngle <= 108) {
        this.phase = "BOTTOM";
        feedbackMessage =
          kneeAngle <= 98 ? "Great squat depth! Drive up through your heels." : "Go a little deeper.";
        feedbackSeverity = kneeAngle <= 98 ? "good" : "warning";
      } else if (kneeAngle > 158) {
        // Aborted shallow descent before reaching bottom threshold
        this.phase = "STANDING";
        feedbackMessage = "Go a little deeper.";
        feedbackSeverity = "correction";
      } else {
        feedbackMessage = activeAlerts[0] ?? "Go a little deeper.";
        feedbackSeverity = activeAlerts.length > 0 ? "correction" : "info";
      }
    } else if (this.phase === "BOTTOM") {
      this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, kneeAngle);
      this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);

      if (kneeAngle > this.minKneeAngleInRep + 12 && kneeAngle > 112) {
        this.phase = "ASCENDING";
        feedbackMessage = activeAlerts[0] ?? "Drive upward smoothly — keep your back straight.";
      } else {
        feedbackMessage =
          this.minKneeAngleInRep <= 98
            ? "Bottom reached — drive up steadily."
            : "Go a little deeper.";
      }
    } else if (this.phase === "ASCENDING") {
      this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);

      if (kneeAngle >= 158) {
        const repDuration = timestampMs - this.descentStartTimeMs;
        const timeSinceLastRep = timestampMs - this.lastRepTimestampMs;

        // Safeguard against duplicate bounce counting
        if (timeSinceLastRep >= 450 && repDuration >= 250) {
          this.phase = "REP_COMPLETE";
          this.lastRepTimestampMs = timestampMs;
          this.totalReps += 1;
          repJustCompleted = true;

          // Rule-based Form Score Calculation (0 - 100)
          let repScore = 100;
          const issues: string[] = [];

          // 1. Depth rule (ideal <= 98 deg)
          if (this.minKneeAngleInRep > 100) {
            const penalty = Math.min(28, Math.round((this.minKneeAngleInRep - 98) * 1.4));
            repScore -= penalty;
            issues.push("Go a little deeper.");
          }

          // 2. Back alignment rule (ideal <= 40 deg torso inclination)
          if (this.maxTorsoLeanInRep > 42) {
            const penalty = Math.min(25, Math.round((this.maxTorsoLeanInRep - 40) * 1.3));
            repScore -= penalty;
            issues.push("Keep your back straight.");
          }

          // 3. Knee valgus rule
          if (this.valgusDetectedInRep) {
            repScore -= 20;
            issues.push("Your knees are moving inward.");
          }

          // 4. Tempo control rule (too fast < 450ms)
          if (repDuration < 450) {
            repScore -= 12;
            issues.push("Control your movement.");
          }

          repScore = Math.max(40, Math.min(100, repScore));
          lastRepScore = repScore;
          this.repScores.push(repScore);
          this.repDurationsMs.push(repDuration);

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
          this.phase = "STANDING";
        }
      } else if (kneeAngle < 105) {
        this.phase = "BOTTOM";
      }
    }

    // Live instant form indicator
    let liveFormScore = 95;
    if (torsoLean > 42) liveFormScore -= Math.min(25, Math.round(torsoLean - 40));
    if (isValgus) liveFormScore -= 20;
    if (this.phase === "BOTTOM" && kneeAngle > 102) liveFormScore -= 12;
    liveFormScore = Math.max(45, Math.min(100, liveFormScore));

    return {
      exerciseKey: "squat",
      phase: this.phase,
      totalReps: this.totalReps,
      goodReps: this.goodReps,
      repsNeedingCorrection: this.repsNeedingCorrection,
      currentFormScore: lastRepScore ?? liveFormScore,
      averageFormScore: this.getAverageScore() || liveFormScore,
      rangeOfMotionPct: romPct,
      consistencyScore: this.getConsistencyScore(),
      primaryJointAngle: kneeAngle,
      secondaryJointAngle: hipAngle,
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
    const sum = this.repScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.repScores.length);
  }

  private getConsistencyScore(): number {
    if (this.repScores.length < 2) return 95;
    const avg = this.getAverageScore();
    const variance =
      this.repScores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) /
      this.repScores.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(50, Math.min(100, Math.round(100 - stdDev * 1.5)));
  }

  reset(): void {
    this.smoother.reset();
    this.phase = "STANDING";
    this.totalReps = 0;
    this.goodReps = 0;
    this.repsNeedingCorrection = 0;
    this.repScores = [];
    this.repDurationsMs = [];
    this.minKneeAngleInRep = 180;
    this.maxTorsoLeanInRep = 0;
    this.valgusDetectedInRep = false;
    this.lastRepTimestampMs = -1000;
  }
}
