// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — POSE LANDMARK GEOMETRY & SMOOTHING ENGINE
// Client-side biomechanical vector math for MediaPipe Pose Landmarker (33 pts)
// ============================================================================

export interface PoseLandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Standard MediaPipe Pose Landmarker 33-point indices
 */
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export const SKELETON_CONNECTIONS: Array<[number, number]> = [
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
];

/**
 * Calculates the interior 2D angle (in degrees, 0..180) at vertex B formed by A-B-C.
 */
export function calculateJointAngle(
  a: PoseLandmarkPoint,
  b: PoseLandmarkPoint,
  c: PoseLandmarkPoint
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle * 10) / 10;
}

/**
 * Calculates trunk inclination relative to vertical axis (0 deg = upright vertical, 90 deg = horizontal).
 */
export function calculateVerticalInclination(
  topPoint: PoseLandmarkPoint,
  bottomPoint: PoseLandmarkPoint
): number {
  const dx = topPoint.x - bottomPoint.x;
  const dy = bottomPoint.y - topPoint.y; // y grows downward in normalized screen space
  if (Math.abs(dy) < 1e-5 && Math.abs(dx) < 1e-5) return 0;
  const angleRad = Math.atan2(Math.abs(dx), Math.max(1e-5, Math.abs(dy)));
  return Math.round(((angleRad * 180) / Math.PI) * 10) / 10;
}

/**
 * Checks whether all required landmark indices meet the minimum visibility threshold.
 */
export function checkRequiredLandmarksVisible(
  landmarks: PoseLandmarkPoint[],
  requiredIndices: number[],
  minVisibility = 0.5
): { isVisible: boolean; averageConfidence: number; missingCount: number } {
  if (!landmarks || landmarks.length < 29) {
    return { isVisible: false, averageConfidence: 0, missingCount: requiredIndices.length };
  }

  let totalConfidence = 0;
  let missingCount = 0;

  for (const idx of requiredIndices) {
    const pt = landmarks[idx];
    const vis = pt?.visibility ?? 0;
    totalConfidence += vis;
    if (!pt || vis < minVisibility) {
      missingCount += 1;
    }
  }

  const averageConfidence =
    requiredIndices.length > 0
      ? Math.round((totalConfidence / requiredIndices.length) * 100)
      : 0;

  return {
    isVisible: missingCount === 0,
    averageConfidence,
    missingCount,
  };
}

/**
 * Selects the dominant / higher-visibility body side (left vs right) or averages both if equally visible.
 */
export function selectBestSideJoints(
  landmarks: PoseLandmarkPoint[],
  leftTriplet: [number, number, number],
  rightTriplet: [number, number, number]
): {
  a: PoseLandmarkPoint;
  b: PoseLandmarkPoint;
  c: PoseLandmarkPoint;
  confidence: number;
  side: "left" | "right";
} {
  const leftVis =
    ((landmarks[leftTriplet[0]]?.visibility ?? 0) +
      (landmarks[leftTriplet[1]]?.visibility ?? 0) +
      (landmarks[leftTriplet[2]]?.visibility ?? 0)) /
    3;
  const rightVis =
    ((landmarks[rightTriplet[0]]?.visibility ?? 0) +
      (landmarks[rightTriplet[1]]?.visibility ?? 0) +
      (landmarks[rightTriplet[2]]?.visibility ?? 0)) /
    3;

  if (leftVis >= rightVis) {
    return {
      a: landmarks[leftTriplet[0]],
      b: landmarks[leftTriplet[1]],
      c: landmarks[leftTriplet[2]],
      confidence: leftVis,
      side: "left",
    };
  }
  return {
    a: landmarks[rightTriplet[0]],
    b: landmarks[rightTriplet[1]],
    c: landmarks[rightTriplet[2]],
    confidence: rightVis,
    side: "right",
  };
}

/**
 * Exponential Moving Average (EMA) landmark smoother to remove single-frame jitter
 */
export class ExponentialLandmarkSmoother {
  private previous: PoseLandmarkPoint[] | null = null;
  private readonly alpha: number;

  constructor(alpha = 0.4) {
    this.alpha = Math.max(0.05, Math.min(1.0, alpha));
  }

  smooth(landmarks: PoseLandmarkPoint[]): PoseLandmarkPoint[] {
    if (!this.previous || this.previous.length !== landmarks.length) {
      this.previous = landmarks.map((pt) => ({ ...pt }));
      return this.previous;
    }

    const smoothed = landmarks.map((pt, i) => {
      const prev = this.previous![i];
      return {
        x: this.alpha * pt.x + (1 - this.alpha) * prev.x,
        y: this.alpha * pt.y + (1 - this.alpha) * prev.y,
        z:
          typeof pt.z === "number" && typeof prev.z === "number"
            ? this.alpha * pt.z + (1 - this.alpha) * prev.z
            : pt.z,
        visibility:
          typeof pt.visibility === "number" && typeof prev.visibility === "number"
            ? this.alpha * pt.visibility + (1 - this.alpha) * prev.visibility
            : pt.visibility,
      };
    });

    this.previous = smoothed;
    return smoothed;
  }

  reset(): void {
    this.previous = null;
  }
}
