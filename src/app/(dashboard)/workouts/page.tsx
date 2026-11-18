"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — AI PERSONALIZED WORKOUT GENERATOR & SESSION LOGGER (/workouts)
// Generate, Regenerate, Replace Exercise, Modify Duration/Muscles, Save & Log Live Session
// ============================================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  Clock,
  Dumbbell,
  Play,
  RefreshCw,
  Repeat,
  Save,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { getReplacementExercises } from "@/services/workout/workout-generator";
import {
  ExerciseProgressionDecisionRecord,
  TrainingCategory,
} from "@/types/fitness";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Modal,
  ProgressBar,
} from "@/components/ui/primitives";
import { formatDuration } from "@/lib/utils";

const TARGET_MUSCLE_CHIPS = [
  "chest",
  "back",
  "shoulders",
  "quadriceps",
  "glutes",
  "biceps",
  "triceps",
  "core",
];

export default function WorkoutPlannerPage() {
  const {
    currentUser,
    preferences,
    goal,
    activeWorkoutPlan,
    workoutPlans,
    performanceMap,
    latestReadinessScore,
    generateNewWorkoutPlan,
    replaceExerciseInActivePlan,
    setActiveWorkoutPlan,
    recordCompletedWorkoutSession,
  } = useFitnessBrain();

  const [category, setCategory] = useState<TrainingCategory>(
    activeWorkoutPlan?.category ??
      preferences?.preferredTrainingCategory ??
      "calisthenics"
  );
  const [durationMin, setDurationMin] = useState<number>(
    activeWorkoutPlan?.estimatedDurationMin ??
      currentUser?.preferredWorkoutDurationMin ??
      45
  );
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [swapModalSlug, setSwapModalSlug] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Active Live Workout Session State
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [restTimerSec, setRestTimerSec] = useState(0);
  const [perceivedRpe, setPerceivedRpe] = useState(7);
  const [loggedExerciseState, setLoggedExerciseState] = useState<
    Record<
      string,
      { completedSets: number; repsPerSet: number; formScore: number }
    >
  >({});
  const [sessionDecisions, setSessionDecisions] = useState<
    ExerciseProgressionDecisionRecord[] | null
  >(null);

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      setElapsedSec((s) => s + 1);
      setRestTimerSec((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  const toggleMuscle = (m: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleGenerateWorkout = async () => {
    setIsGeneratingAi(true);
    setSessionDecisions(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateWorkout",
          userId: currentUser?.id,
          payload: {
            user: currentUser,
            preferences,
            goal,
            category,
            durationMin,
            targetMuscles:
              selectedMuscles.length > 0 ? selectedMuscles : undefined,
            availableEquipment: preferences?.availableEquipment,
            performanceMap,
            recoveryReadinessScore: latestReadinessScore,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.plan) {
          generateNewWorkoutPlan({ customPlan: data.plan });
          return;
        }
      }
      // Fallback local generation
      generateNewWorkoutPlan({
        category,
        durationMin,
        targetMuscles: selectedMuscles.length > 0 ? selectedMuscles : undefined,
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleStartLiveSession = () => {
    if (!activeWorkoutPlan) return;
    const initMap: Record<
      string,
      { completedSets: number; repsPerSet: number; formScore: number }
    > = {};
    for (const ex of activeWorkoutPlan.exercises) {
      const parsedReps = parseInt(ex.targetReps, 10) || 12;
      initMap[ex.exerciseSlug] = {
        completedSets: ex.targetSets,
        repsPerSet: parsedReps,
        formScore: 86,
      };
    }
    setLoggedExerciseState(initMap);
    setElapsedSec(0);
    setRestTimerSec(0);
    setSessionDecisions(null);
    setSessionActive(true);
  };

  const handleFinishLiveSession = () => {
    if (!activeWorkoutPlan) return;
    const exercisesPayload = activeWorkoutPlan.exercises.map((ex) => {
      const st = loggedExerciseState[ex.exerciseSlug] ?? {
        completedSets: ex.targetSets,
        repsPerSet: 10,
        formScore: 85,
      };
      const totalReps = st.completedSets * st.repsPerSet;
      const goodReps = Math.round(totalReps * (st.formScore / 100));
      return {
        exerciseSlug: ex.exerciseSlug,
        exerciseName: ex.exerciseName,
        targetSets: ex.targetSets,
        completedSets: st.completedSets,
        targetRepsPerSet: parseInt(ex.targetReps, 10) || 10,
        totalReps,
        goodReps,
        badReps: Math.max(0, totalReps - goodReps),
        averageFormScore: st.formScore,
        averageRomPct: Math.min(100, st.formScore + 3),
        usedCameraTrainer: false,
      };
    });

    const result = recordCompletedWorkoutSession({
      sessionName: activeWorkoutPlan.name,
      category: activeWorkoutPlan.category,
      durationSec: Math.max(300, elapsedSec || activeWorkoutPlan.estimatedDurationMin * 60),
      perceivedDifficulty: perceivedRpe,
      notes: "Completed via AI Workout Session Logger.",
      exercises: exercisesPayload,
    });

    setSessionActive(false);
    setSessionDecisions(result.decisions);
  };

  const replacementOptions = swapModalSlug
    ? getReplacementExercises({
        currentExerciseSlug: swapModalSlug,
        category: activeWorkoutPlan?.category ?? category,
        availableEquipment: preferences?.availableEquipment ?? ["none"],
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lime">Section 9 • AI Personalized Workout Generator</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            AI Workout Planner &amp; Live Session Coach
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Synthesizes your profile, goal ({goal.replace("_", " ")}), owned
            equipment, per-exercise history, and {latestReadinessScore}%
            recovery readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!sessionActive ? (
            <Button variant="primary" onClick={handleStartLiveSession}>
              <Play className="h-4 w-4" />
              Start Live Workout Session
            </Button>
          ) : (
            <Button variant="primary" onClick={handleFinishLiveSession}>
              <CheckCircle2 className="h-4 w-4" />
              Complete &amp; Evaluate Progression
            </Button>
          )}
        </div>
      </div>

      {/* PROGRESSION DECISIONS BANNER AFTER SESSION COMPLETION */}
      {sessionDecisions && (
        <Card className="p-6 border-[#CCFF00] bg-[#CCFF00]/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#CCFF00]" />
              Workout Saved! Per-Exercise Progression Engine Decisions:
            </h3>
            <Badge variant="lime">Personal Memory Updated</Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {sessionDecisions.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-border bg-card p-3.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{d.exerciseName}</span>
                  <Badge
                    variant={
                      d.decision === "progress"
                        ? "lime"
                        : d.decision === "regress"
                        ? "amber"
                        : "outline"
                    }
                    className="uppercase"
                  >
                    {d.decision} (Lvl {d.previousLevel} → {d.newLevel})
                  </Badge>
                </div>
                <p className="text-muted-foreground">{d.reasonSummary}</p>
                <p className="font-semibold text-[#CCFF00]">
                  Next Session Target: {d.recommendedVariationName} (
                  {d.recommendedRepsOrLoad})
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* GENERATOR CONTROLS */}
      <Card className="p-6 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Training Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TrainingCategory)}
              className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
            >
              <option value="gym">Gym Training (Barbell / Dumbbell / Machine)</option>
              <option value="home">Home Workout (Synced to Owned Gear)</option>
              <option value="calisthenics">Calisthenics (Skill Progression)</option>
            </select>
          </div>

          <div>
            <Label>Workout Duration (Minutes)</Label>
            <Input
              type="number"
              min={15}
              max={120}
              step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="mt-1.5"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="primary"
              className="w-full"
              disabled={isGeneratingAi}
              onClick={handleGenerateWorkout}
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingAi ? "Synthesizing Plan..." : "Generate / Regenerate Workout"}
            </Button>
          </div>
        </div>

        <div>
          <Label>Target Muscle Groups (Optional Focus)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {TARGET_MUSCLE_CHIPS.map((m) => {
              const active = selectedMuscles.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMuscle(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                    active
                      ? "bg-[#CCFF00] text-black"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* LIVE WORKOUT TIMER BAR (WHEN ACTIVE) */}
      {sessionActive && (
        <Card className="p-5 border-[#CCFF00] bg-gradient-to-r from-[#CCFF00]/10 to-card flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00] block">
                Active Session Timer
              </span>
              <span className="text-2xl font-black font-mono">
                {formatDuration(elapsedSec)}
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Rest Countdown
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {restTimerSec > 0 ? `${restTimerSec}s` : "Ready"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRestTimerSec(60)}
            >
              <Timer className="h-3.5 w-3.5" />
              Start 60s Rest
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRestTimerSec(90)}
            >
              Start 90s Rest
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <Label>Session RPE (1-10):</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={perceivedRpe}
                onChange={(e) => setPerceivedRpe(Number(e.target.value))}
                className="w-16 h-8 text-center"
              />
            </div>
            <Button size="sm" variant="primary" onClick={handleFinishLiveSession}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finish &amp; Save Session
            </Button>
          </div>
        </Card>
      )}

      {/* ACTIVE WORKOUT PLAN EXERCISES */}
      {activeWorkoutPlan && (
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="lime">
                  {activeWorkoutPlan.generationMode === "openrouter_ai"
                    ? "OpenRouter AI Validated Plan"
                    : "Deterministic Workout Intelligence Engine"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {activeWorkoutPlan.category}
                </Badge>
                <Badge variant="emerald">
                  <Clock className="h-3 w-3" />
                  {activeWorkoutPlan.estimatedDurationMin} Min
                </Badge>
              </div>
              <h2 className="text-xl font-bold">{activeWorkoutPlan.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeWorkoutPlan.aiRationale}
              </p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSavedNotice(
                  `Workout "${activeWorkoutPlan.name}" is saved to your personal plan library.`
                );
                setTimeout(() => setSavedNotice(null), 3000);
              }}
            >
              <Save className="h-3.5 w-3.5 text-[#CCFF00]" />
              Save Workout Plan
            </Button>
          </div>

          {savedNotice && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              {savedNotice}
            </div>
          )}

          <div className="space-y-4">
            {activeWorkoutPlan.exercises.map((ex) => {
              const logState = loggedExerciseState[ex.exerciseSlug] ?? {
                completedSets: ex.targetSets,
                repsPerSet: parseInt(ex.targetReps, 10) || 12,
                formScore: 88,
              };

              return (
                <div
                  key={ex.id}
                  className="rounded-2xl border border-border bg-secondary/25 p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#CCFF00] text-black font-black text-sm">
                        {ex.orderIndex}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold">
                            {ex.exerciseName}
                          </h3>
                          <Badge variant="outline" className="capitalize">
                            {ex.primaryMuscle}
                          </Badge>
                          <Badge variant="lime">
                            Level {ex.difficultyLevel}/5
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Equipment: {ex.equipment.join(", ")} • Rest:{" "}
                          {ex.restDurationSec}s
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#CCFF00] mr-2">
                        {ex.targetSets} Sets × {ex.targetReps}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setSwapModalSlug(ex.exerciseSlug)}
                      >
                        <Repeat className="h-3.5 w-3.5" />
                        Replace
                      </Button>
                      {ex.isCameraSupported && (
                        <Link
                          href={`/trainer?exercise=${ex.cameraAnalyzerKey}`}
                        >
                          <Button size="sm" variant="primary" className="text-xs">
                            <Camera className="h-3.5 w-3.5" />
                            CV Trainer
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-border/60">
                    <div>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">
                          Instructions:
                        </strong>{" "}
                        {ex.instructions.join(" ")}
                      </p>
                      <p className="text-emerald-400 mt-1">
                        <strong>Form Guidance:</strong> {ex.formGuidance}
                      </p>
                    </div>
                    <div className="rounded-xl bg-background/60 p-3 border border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00] block">
                        Adaptive Progression Note
                      </span>
                      <p className="text-muted-foreground mt-0.5">
                        {ex.progressionRecommendation}
                      </p>
                    </div>
                  </div>

                  {/* LIVE SESSION SET LOGGER INPUTS */}
                  {sessionActive && (
                    <div className="rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/5 p-3.5 grid sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Completed Sets</Label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={logState.completedSets}
                          onChange={(e) =>
                            setLoggedExerciseState({
                              ...loggedExerciseState,
                              [ex.exerciseSlug]: {
                                ...logState,
                                completedSets: Number(e.target.value),
                              },
                            })
                          }
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label>Reps Achieved / Set</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={logState.repsPerSet}
                          onChange={(e) =>
                            setLoggedExerciseState({
                              ...loggedExerciseState,
                              [ex.exerciseSlug]: {
                                ...logState,
                                repsPerSet: Number(e.target.value),
                              },
                            })
                          }
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label>Estimated Form Score (%)</Label>
                        <Input
                          type="number"
                          min={40}
                          max={100}
                          value={logState.formScore}
                          onChange={(e) =>
                            setLoggedExerciseState({
                              ...loggedExerciseState,
                              [ex.exerciseSlug]: {
                                ...logState,
                                formScore: Number(e.target.value),
                              },
                            })
                          }
                          className="mt-1 h-8"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* SAVED WORKOUT PLANS HISTORY */}
      {workoutPlans.length > 1 && (
        <Card className="p-6">
          <h3 className="text-base font-bold mb-3">
            Saved Workout Plans Library ({workoutPlans.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workoutPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between ${
                  plan.id === activeWorkoutPlan?.id
                    ? "border-[#CCFF00] bg-[#CCFF00]/10"
                    : "border-border bg-secondary/30"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#CCFF00]">
                    {plan.category} • {plan.estimatedDurationMin} Min
                  </span>
                  <h4 className="font-bold text-sm mt-0.5">{plan.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.exercises.length} exercises
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => setActiveWorkoutPlan(plan.id)}
                >
                  {plan.id === activeWorkoutPlan?.id
                    ? "Currently Active"
                    : "Load This Plan"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* REPLACE EXERCISE MODAL */}
      <Modal
        isOpen={Boolean(swapModalSlug)}
        onClose={() => setSwapModalSlug(null)}
        title="Replace Exercise (Verified Database Alternatives)"
        subtitle="Only valid exercises matching your target muscle group and available equipment are shown."
      >
        <div className="space-y-3">
          {replacementOptions.map((alt) => (
            <div
              key={alt.id}
              className="rounded-xl border border-border bg-secondary/40 p-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-sm font-bold">{alt.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {alt.primaryMuscle.toUpperCase()} • Equipment:{" "}
                  {alt.equipment.join(", ")} • Level {alt.difficultyLevel}/5
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (swapModalSlug) {
                    replaceExerciseInActivePlan(swapModalSlug, alt.slug);
                    setSwapModalSlug(null);
                  }
                }}
              >
                Select Replacement
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
