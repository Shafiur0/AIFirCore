"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — CAMERA-BASED AI PERSONAL TRAINER (/trainer)
// Local MediaPipe Pose Landmarker + 6 Stateful Exercise Analyzers + Voice Coach
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Info,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Square,
  Timer,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  CAMERA_EXERCISES_METADATA,
  createExerciseAnalyzer,
} from "@/engines/exercises";
import { AnalyzerEvaluationFrame } from "@/engines/exercises/types";
import {
  POSE_LANDMARKS,
  PoseLandmarkPoint,
  SKELETON_CONNECTIONS,
} from "@/engines/pose/geometry";
import {
  CameraExerciseKey,
  ExerciseProgressionDecisionRecord,
} from "@/types/fitness";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import {
  Badge,
  Button,
  Card,
  ProgressBar,
} from "@/components/ui/primitives";
import { formatDuration } from "@/lib/utils";

const EXERCISE_KEY_TO_CATALOG_SLUG: Record<CameraExerciseKey, string> = {
  squat: "bodyweight-squat",
  pushup: "standard-push-up",
  lunge: "forward-lunge",
  plank: "forearm-plank",
  "bicep-curl": "dumbbell-bicep-curl",
  "shoulder-press": "dumbbell-shoulder-press",
};

/**
 * Generates realistic 33-point normalized pose landmark coordinates at phase t
 * for live fallback testing when no physical camera is attached.
 */
function generateKinematicLandmarks(
  exerciseKey: CameraExerciseKey,
  tSeconds: number
): PoseLandmarkPoint[] {
  const pts: PoseLandmarkPoint[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.96,
  }));

  // Smooth sinusoidal repetition cycle (2.6s per rep)
  const cycle = (Math.sin(tSeconds * 2.4 - Math.PI / 2) + 1) / 2; // 0 (start) -> 1 (peak depth) -> 0 (return)

  if (exerciseKey === "squat" || exerciseKey === "lunge") {
    const hipDrop = cycle * 0.22;
    const kneeForward = cycle * 0.12;
    pts[POSE_LANDMARKS.NOSE] = { x: 0.48, y: 0.16 + hipDrop * 0.85, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.47, y: 0.26 + hipDrop * 0.85, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.51, y: 0.26 + hipDrop * 0.85, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.56, y: 0.34 + hipDrop * 0.7, visibility: 0.95 };
    pts[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.58, y: 0.34 + hipDrop * 0.7, visibility: 0.95 };
    pts[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.64, y: 0.32 + hipDrop * 0.6, visibility: 0.95 };
    pts[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.66, y: 0.32 + hipDrop * 0.6, visibility: 0.95 };
    pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.52 + hipDrop, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.48, y: 0.52 + hipDrop, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.52 + kneeForward, y: 0.68 + hipDrop * 0.15, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.55 + kneeForward, y: 0.68 + hipDrop * 0.15, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.48, y: 0.88, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.52, y: 0.88, visibility: 0.98 };
  } else if (exerciseKey === "pushup") {
    const drop = cycle * 0.15;
    pts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.28, y: 0.48 + drop, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.30, y: 0.48 + drop, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.34 + cycle * 0.06, y: 0.58 + drop * 0.4, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.36 + cycle * 0.06, y: 0.58 + drop * 0.4, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.29, y: 0.72, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.31, y: 0.72, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.54, y: 0.56 + drop * 0.55, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.56, y: 0.56 + drop * 0.55, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.68, y: 0.63 + drop * 0.25, visibility: 0.96 };
    pts[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.70, y: 0.63 + drop * 0.25, visibility: 0.96 };
    pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.82, y: 0.70, visibility: 0.96 };
    pts[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.84, y: 0.70, visibility: 0.96 };
  } else if (exerciseKey === "plank") {
    pts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.26, y: 0.55, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.28, y: 0.55, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.26, y: 0.72, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.28, y: 0.72, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.18, y: 0.72, visibility: 0.96 };
    pts[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.20, y: 0.72, visibility: 0.96 };
    pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.54, y: 0.58, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.56, y: 0.58, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.68, y: 0.64, visibility: 0.97 };
    pts[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.70, y: 0.64, visibility: 0.97 };
    pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.82, y: 0.70, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.84, y: 0.70, visibility: 0.98 };
  } else if (exerciseKey === "bicep-curl") {
    // Arm curls from extended (wrist down at y=0.64) to flexed (wrist up near shoulder y=0.31)
    const wristX = 0.52 + Math.sin(cycle * Math.PI) * 0.1;
    const wristY = 0.64 - cycle * 0.33;
    pts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.48, y: 0.28, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.50, y: 0.28, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.49, y: 0.46, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.51, y: 0.46, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_WRIST] = { x: wristX, y: wristY, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_WRIST] = { x: wristX + 0.02, y: wristY, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.48, y: 0.56, visibility: 0.96 };
    pts[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.50, y: 0.56, visibility: 0.96 };
    pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.48, y: 0.73, visibility: 0.95 };
    pts[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.50, y: 0.73, visibility: 0.95 };
    pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.48, y: 0.89, visibility: 0.95 };
    pts[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.50, y: 0.89, visibility: 0.95 };
  } else {
    // Shoulder Press
    const lift = cycle * 0.25;
    pts[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.36, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.36, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.34 + cycle * 0.06, y: 0.40 - lift * 0.7, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.66 - cycle * 0.06, y: 0.40 - lift * 0.7, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.36 + cycle * 0.05, y: 0.32 - lift, visibility: 0.98 };
    pts[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.64 - cycle * 0.05, y: 0.32 - lift, visibility: 0.98 };
    pts[POSE_LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.62, visibility: 0.96 };
    pts[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.56, y: 0.62, visibility: 0.96 };
    pts[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.44, y: 0.76, visibility: 0.95 };
    pts[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.56, y: 0.76, visibility: 0.95 };
    pts[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.44, y: 0.90, visibility: 0.95 };
    pts[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.56, y: 0.90, visibility: 0.95 };
  }

  return pts;
}

export default function AICameraTrainerPage() {
  const { preferences, recordCompletedWorkoutSession } = useFitnessBrain();

  const [selectedExercise, setSelectedExercise] =
    useState<CameraExerciseKey>("squat");
  const [cameraConsentGiven, setCameraConsentGiven] = useState(true);
  const [sourceMode, setSourceMode] = useState<"idle" | "webcam" | "simulation">(
    "idle"
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [voiceEnabled, setVoiceEnabled] = useState(
    preferences?.voiceFeedbackEnabled ?? true
  );
  const [mediapipeStatus, setMediapipeStatus] = useState<
    "standby" | "loading" | "ready" | "fallback"
  >("standby");

  // Live Workout Session Tracking
  const [currentSet, setCurrentSet] = useState(1);
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(12);
  const [sessionDurationSec, setSessionDurationSec] = useState(0);
  const [restCountdownSec, setRestCountdownSec] = useState(0);
  const [evaluationFrame, setEvaluationFrame] =
    useState<AnalyzerEvaluationFrame | null>(null);
  const [savedDecisions, setSavedDecisions] = useState<
    ExerciseProgressionDecisionRecord[] | null
  >(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const poseLandmarkerRef = useRef<any>(null);
  const analyzerRef = useRef(createExerciseAnalyzer("squat"));
  const lastSpokenRef = useRef<{ text: string; time: number }>({
    text: "",
    time: 0,
  });

  const activeMetadata =
    CAMERA_EXERCISES_METADATA.find((m) => m.key === selectedExercise) ??
    CAMERA_EXERCISES_METADATA[0];

  // Switch analyzer when selectedExercise changes
  useEffect(() => {
    analyzerRef.current = createExerciseAnalyzer(selectedExercise);
    setEvaluationFrame(null);
    setSavedDecisions(null);
    if (selectedExercise === "plank") {
      setTargetReps(45); // 45s hold target
    } else {
      setTargetReps(12);
    }
  }, [selectedExercise]);

  // Session & Rest timers
  useEffect(() => {
    if (sourceMode === "idle") return;
    const timer = setInterval(() => {
      setSessionDurationSec((s) => s + 1);
      setRestCountdownSec((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sourceMode]);

  // Browser Web Speech Voice Feedback
  const speakFeedback = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;
      const now = Date.now();
      if (
        now - lastSpokenRef.current.time < 3200 ||
        lastSpokenRef.current.text === text
      ) {
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
        lastSpokenRef.current = { text, time: now };
      } catch {
        // Ignore speech synthesis errors
      }
    },
    [voiceEnabled]
  );

  // Draw 33-point skeleton and joint angles onto canvas overlay
  const drawSkeletonOverlay = useCallback(
    (landmarks: PoseLandmarkPoint[], frameResult: AnalyzerEvaluationFrame) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (sourceMode === "simulation") {
        // Draw dark telemetry grid background
        ctx.fillStyle = "#080A10";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Draw bones
      ctx.lineWidth = 3.5;
      ctx.strokeStyle =
        frameResult.feedbackSeverity === "correction"
          ? "#F59E0B"
          : "#CCFF00";

      for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
        const p1 = landmarks[startIdx];
        const p2 = landmarks[endIdx];
        if (!p1 || !p2) continue;
        if ((p1.visibility ?? 1) < 0.35 || (p2.visibility ?? 1) < 0.35) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }

      // Draw joints
      for (let i = 11; i <= 28; i++) {
        const pt = landmarks[i];
        if (!pt || (pt.visibility ?? 1) < 0.35) continue;
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#090A0F";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#10B981";
        ctx.stroke();
      }

      // HUD telemetry overlay inside canvas
      ctx.fillStyle = "rgba(9, 10, 15, 0.78)";
      ctx.fillRect(14, 14, 245, 70);
      ctx.strokeStyle = "rgba(204, 255, 0, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, 245, 70);

      ctx.fillStyle = "#CCFF00";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`PHASE: ${frameResult.phase}`, 24, 36);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(
        `PRIMARY ANGLE: ${frameResult.primaryJointAngle}°`,
        24,
        54
      );
      ctx.fillStyle = "#10B981";
      ctx.fillText(
        `EST. FORM QUALITY: ${frameResult.currentFormScore}%`,
        24,
        72
      );
    },
    [sourceMode]
  );

  // Stop all active camera tracks and animation frames
  const stopCameraAndLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setSourceMode("idle");
  }, []);

  useEffect(() => {
    return () => {
      stopCameraAndLoop();
    };
  }, [stopCameraAndLoop]);

  // Initialize MediaPipe PoseLandmarker on demand
  const ensurePoseLandmarkerLoaded = async () => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;
    setMediapipeStatus("loading");
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
      );
      const landmarker = await vision.PoseLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        }
      );
      poseLandmarkerRef.current = landmarker;
      setMediapipeStatus("ready");
      return landmarker;
    } catch {
      setMediapipeStatus("fallback");
      return null;
    }
  };

  // Start Live Browser Camera Session
  const handleStartLiveWebcam = async () => {
    if (!cameraConsentGiven) {
      setCameraError(
        "Please check the camera privacy consent box before starting your camera."
      );
      return;
    }

    stopCameraAndLoop();
    setCameraError(null);
    analyzerRef.current.reset();
    setSessionDurationSec(0);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Browser camera API is unavailable in this environment. Launching Live Kinematic Pose Analyzer Mode so you can test the full 33-landmark analyzer!"
      );
      handleStartSimulationMode();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setSourceMode("webcam");
      const landmarker = await ensurePoseLandmarkerLoaded();

      const startTime = performance.now();
      const processVideoFrame = () => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;

        const nowMs = performance.now();
        let landmarks: PoseLandmarkPoint[] | null = null;

        if (landmarker && video.readyState >= 2) {
          try {
            const result = landmarker.detectForVideo(video, nowMs);
            if (result?.landmarks && result.landmarks.length > 0) {
              landmarks = result.landmarks[0];
            }
          } catch {
            // Fallback kinematic landmarks if WebGL context unavailable
          }
        }

        // Never substitute synthetic landmarks for a live camera feed.
        // If no body is detected, the analyzer receives an empty frame and reports "not visible".
        if (!landmarks) {
          void startTime;
          const evaluatedEmpty = analyzerRef.current.analyzeFrame([], Date.now());
          setEvaluationFrame({
            ...evaluatedEmpty,
            feedbackMessage: landmarker
              ? "No body detected — step back so your full body is inside the frame."
              : "Pose model failed to load (WebGL/network). Rep counting is paused; try reloading or use the labeled simulator.",
          });
          const c = canvasRef.current?.getContext("2d");
          if (c && canvasRef.current) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          rafRef.current = requestAnimationFrame(processVideoFrame);
          return;
        }

        const evaluated = analyzerRef.current.analyzeFrame(
          landmarks,
          Date.now()
        );
        setEvaluationFrame(evaluated);
        drawSkeletonOverlay(landmarks, evaluated);

        if (evaluated.repJustCompleted) {
          speakFeedback(evaluated.feedbackMessage);
        }

        rafRef.current = requestAnimationFrame(processVideoFrame);
      };

      rafRef.current = requestAnimationFrame(processVideoFrame);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Camera permission denied or no webcam found.";
      const isPermission = /denied|NotAllowed|Permission/i.test(msg);
      const isMissing = /NotFound|Requested device not found|no webcam/i.test(msg);
      setCameraError(
        isPermission
          ? "Camera permission was denied. Allow camera access in your browser's site settings, then press Start Live Camera again."
          : isMissing
          ? "No camera was found on this device. Connect a webcam, or use the clearly labeled Pose Simulator to explore the analyzer."
          : `Camera could not start (${msg}). You can retry, or use the labeled Pose Simulator.`
      );
      stopCameraAndLoop();
    }
  };

  // Start Live 33-Landmark Kinematic Pose Simulation (runs exact same analyzer state machine)
  const handleStartSimulationMode = () => {
    stopCameraAndLoop();
    analyzerRef.current.reset();
    setSessionDurationSec(0);
    setSourceMode("simulation");

    const startTime = performance.now();
    const tick = () => {
      const elapsedSec = (performance.now() - startTime) / 1000;
      const landmarks = generateKinematicLandmarks(
        selectedExercise,
        elapsedSec
      );
      const evaluated = analyzerRef.current.analyzeFrame(landmarks, Date.now());
      setEvaluationFrame(evaluated);
      drawSkeletonOverlay(landmarks, evaluated);

      if (evaluated.repJustCompleted) {
        speakFeedback(evaluated.feedbackMessage);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleCompleteSetAndRest = () => {
    if (currentSet < targetSets) {
      setCurrentSet((s) => s + 1);
      setRestCountdownSec(60);
      speakFeedback(`Set ${currentSet} complete. Rest 60 seconds.`);
    }
  };

  const handleSaveSessionToHistory = () => {
    const frame = evaluationFrame;
    if (sourceMode === "simulation") {
      setCameraError(
        "Simulator sessions are demonstrations only and are not saved to your fitness history."
      );
      stopCameraAndLoop();
      return;
    }
    const totalReps = frame?.totalReps ?? 0;
    const goodReps = frame?.goodReps ?? 0;
    if (!frame || totalReps === 0) {
      setCameraError(
        "No repetitions were detected in this session, so nothing was saved."
      );
      stopCameraAndLoop();
      return;
    }
    const avgForm = frame.averageFormScore;
    const slug = EXERCISE_KEY_TO_CATALOG_SLUG[selectedExercise];

    stopCameraAndLoop();

    const res = recordCompletedWorkoutSession({
      sessionName: `AI Camera Trainer: ${activeMetadata.name}`,
      category: "calisthenics",
      durationSec: Math.max(1, sessionDurationSec),
      perceivedDifficulty: 7,
      notes: `Completed via MediaPipe Pose Landmarker Camera Trainer (${avgForm}% estimated movement quality).`,
      exercises: [
        {
          exerciseSlug: slug,
          exerciseName: activeMetadata.name,
          targetSets,
          completedSets: currentSet,
          targetRepsPerSet: targetReps,
          totalReps,
          goodReps,
          badReps: Math.max(0, totalReps - goodReps),
          averageFormScore: avgForm,
          averageRomPct: frame.rangeOfMotionPct,
          usedCameraTrainer: true,
        },
      ],
    });

    setSavedDecisions(res.decisions);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="lime">Section 10 &amp; 11 • MediaPipe Pose Landmarker</Badge>
            <Badge variant="emerald">100% Client-Side Processing</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            AI Camera Personal Trainer
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time 33-point body landmark tracking, joint angle measurement,
            automatic rep counting, and movement-quality scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-[#CCFF00]" />
                Voice On
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-muted-foreground" />
                Voice Muted
              </>
            )}
          </Button>

          {sourceMode === "idle" ? (
            <>
              <Button variant="primary" onClick={handleStartLiveWebcam}>
                <Camera className="h-4 w-4" />
                Start Live Camera
              </Button>
              <Button variant="secondary" onClick={handleStartSimulationMode}>
                <Sparkles className="h-4 w-4 text-[#CCFF00]" />
                Pose Simulator (Demo Data)
              </Button>
            </>
          ) : (
            <>
              <Button variant="danger" onClick={stopCameraAndLoop}>
                <Square className="h-4 w-4" />
                Stop Camera
              </Button>
              <Button variant="primary" onClick={handleSaveSessionToHistory}>
                <CheckCircle2 className="h-4 w-4" />
                Finish &amp; Save Session
              </Button>
            </>
          )}
        </div>
      </div>

      {/* SAVED PROGRESSION DECISION BANNER */}
      {savedDecisions && (
        <Card className="p-5 border-[#CCFF00] bg-[#CCFF00]/10 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#CCFF00] flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Camera Session Saved to Personal Memory!
            </h3>
            <Badge variant="lime">Progression Evaluated</Badge>
          </div>
          {savedDecisions.map((d) => (
            <p key={d.id} className="text-xs text-foreground">
              <strong>
                {d.exerciseName} ({d.decision.toUpperCase()}):
              </strong>{" "}
              {d.reasonSummary}
            </p>
          ))}
        </Card>
      )}

      {/* 6 CAMERA EXERCISE SELECTOR TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CAMERA_EXERCISES_METADATA.map((item) => {
          const active = selectedExercise === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSelectedExercise(item.key)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[#CCFF00] bg-[#CCFF00]/15 shadow-[0_0_20px_-6px_rgba(204,255,0,0.4)]"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-[#CCFF00] block">
                {item.isIsometric ? "Isometric" : "Dynamic"}
              </span>
              <span className="text-xs font-bold block mt-0.5 truncate">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {cameraError && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* MAIN CAMERA + LIVE TELEMETRY GRID */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLS: VIDEO & SKELETON OVERLAY CANVAS */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    sourceMode !== "idle"
                      ? "bg-[#CCFF00] animate-ping"
                      : "bg-muted-foreground"
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {sourceMode === "webcam"
                    ? `Live Camera Stream (${mediapipeStatus.toUpperCase()})`
                    : sourceMode === "simulation"
                    ? "SIMULATED DEMO DATA � not your movement, not saved"
                    : "Camera Standby"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setFacingMode((f) =>
                      f === "user" ? "environment" : "user"
                    )
                  }
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Camera: {facingMode === "user" ? "Front" : "Rear"}
                </button>
                <Badge variant="outline">
                  Recommended: {activeMetadata.recommendedCameraView}
                </Badge>
              </div>
            </div>

            {/* Viewport Container */}
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-border bg-[#07090E] flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover ${
                  sourceMode === "webcam" ? "block" : "hidden"
                }`}
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="relative z-10 h-full w-full object-contain"
              />

              {sourceMode === "idle" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-sm space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CCFF00]/15 text-[#CCFF00]">
                    <Camera className="h-7 w-7" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-base font-bold text-white">
                      Position Your Body for {activeMetadata.name}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {activeMetadata.positioningGuide}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cameraConsentGiven}
                      onChange={(e) => setCameraConsentGiven(e.target.checked)}
                      className="accent-[#CCFF00]"
                    />
                    <span>
                      I consent to local browser camera analysis (zero video
                      frames are uploaded or stored).
                    </span>
                  </label>

                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="primary" onClick={handleStartLiveWebcam}>
                      <Camera className="h-4 w-4" />
                      Allow Camera &amp; Start Session
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleStartSimulationMode}
                    >
                      <Play className="h-4 w-4 text-[#CCFF00]" />
                      Pose Simulator (Demo Data, Not Saved)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE COACHING FEEDBACK BANNER */}
            <div
              className={`mt-3 rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                evaluationFrame?.feedbackSeverity === "correction"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-[#CCFF00]/40 bg-[#CCFF00]/10 text-[#CCFF00]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  {evaluationFrame?.feedbackMessage ??
                    "Select an exercise and start the camera or pose simulator to receive real-time form feedback."}
                </span>
              </div>
              <Badge variant="outline" className="shrink-0">
                Confidence: {evaluationFrame?.visibilityConfidence ?? 0}%
              </Badge>
            </div>
          </Card>

          {/* CAMERA LIMITATIONS & PRIVACY DISCLOSURE */}
          <Card className="p-4 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <ShieldCheck className="h-4 w-4 text-[#CCFF00]" />
              <span>
                Biomechanical Scope &amp; Local Privacy Guarantee
              </span>
            </div>
            <p>{activeMetadata.limitationsNote}</p>
            <p className="text-[11px]">
              All scores are labeled as{" "}
              <strong>Estimated Movement-Quality Indicators</strong> based on
              explicit joint-angle rules—not clinical biomechanics or medical
              injury prevention diagnostics.
            </p>
          </Card>
        </div>

        {/* RIGHT 5 COLS: LIVE REP COUNTER, FORM SCORE & RULES */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
                  Live Session Telemetry
                </span>
                <h2 className="text-lg font-bold">{activeMetadata.name}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">
                  Duration
                </span>
                <span className="font-mono font-bold text-sm">
                  {formatDuration(sessionDurationSec)}
                </span>
              </div>
            </div>

            {/* REP & SET COUNTERS */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 p-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  {activeMetadata.isIsometric ? "Hold Sec" : "Total Reps"}
                </span>
                <span className="text-3xl font-black text-[#CCFF00]">
                  {evaluationFrame?.totalReps ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Target: {targetReps}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Good Reps
                </span>
                <span className="text-3xl font-black text-emerald-400">
                  {evaluationFrame?.goodReps ?? 0}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Needs Fix: {evaluationFrame?.repsNeedingCorrection ?? 0}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Current Set
                </span>
                <span className="text-3xl font-black">
                  {currentSet}/{targetSets}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Rest: {restCountdownSec > 0 ? `${restCountdownSec}s` : "Ready"}
                </span>
              </div>
            </div>

            {/* MOVEMENT QUALITY & ROM BARS */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    Estimated Movement-Quality Score
                  </span>
                  <span className="font-bold text-[#CCFF00]">
                    {evaluationFrame?.averageFormScore ?? 0}%
                  </span>
                </div>
                <ProgressBar value={evaluationFrame?.averageFormScore ?? 0} />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    Range of Motion (ROM)
                  </span>
                  <span className="font-bold text-emerald-400">
                    {evaluationFrame?.rangeOfMotionPct ?? 0}%
                  </span>
                </div>
                <ProgressBar
                  value={evaluationFrame?.rangeOfMotionPct ?? 0}
                  colorClass="bg-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    Repetition Consistency
                  </span>
                  <span className="font-bold">
                    {evaluationFrame?.consistencyScore ?? 0}%
                  </span>
                </div>
                <ProgressBar
                  value={evaluationFrame?.consistencyScore ?? 0}
                  colorClass="bg-sky-400"
                />
              </div>
            </div>

            {/* SET & REST CONTROLS */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCompleteSetAndRest}
              >
                <Timer className="h-3.5 w-3.5" />
                Log Set &amp; 60s Rest
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  analyzerRef.current.reset();
                  setEvaluationFrame(null);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Rep Counter
              </Button>
            </div>
          </Card>

          {/* EXPLICIT DOCUMENTED FORM SCORING RULES */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#CCFF00]" />
                Explicit Biomechanical Form Rules
              </h3>
              <Badge variant="outline">Deterministic Scoring</Badge>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {activeMetadata.formRulesSummary.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#CCFF00] font-bold">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
