"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — MAIN COMMAND CENTER DASHBOARD (/dashboard)
// Displays individualized daily targets, active workout, per-exercise levels & AI Brain
// ============================================================================

import React from "react";
import Link from "next/link";
import {
  Activity,
  Apple,
  ArrowRight,
  Bot,
  Brain,
  Camera,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  History,
  LineChart,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UserCheck,
  Utensils,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  Skeleton,
} from "@/components/ui/primitives";
import { getLevelLabel } from "@/lib/utils";

export default function MainDashboardPage() {
  const {
    isHydrated,
    currentUser,
    goal,
    preferences,
    nutritionTargets,
    todayNutrition,
    activeWorkoutPlan,
    workoutSessions,
    performanceMap,
    recommendations,
    latestReadinessScore,
    generateNewWorkoutPlan,
    logWaterIntake,
  } = useFitnessBrain();

  if (!isHydrated || !currentUser || !nutritionTargets || !todayNutrition) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const perExerciseLevels = Object.values(performanceMap);
  const completedWorkoutsCount = workoutSessions.filter(
    (s) => s.status === "completed"
  ).length;
  const averageSessionForm =
    completedWorkoutsCount > 0
      ? Math.round(
          workoutSessions.reduce((a, b) => a + b.averageFormScore, 0) /
            completedWorkoutsCount
        )
      : 0;

  return (
    <div className="space-y-7">
      {/* HERO WELCOME BANNER */}
      <Card className="p-6 sm:p-7 border-[#CCFF00]/30 bg-gradient-to-r from-card via-card to-[#CCFF00]/[0.07]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime">
                <Brain className="h-3.5 w-3.5" />
                AI Fitness Brain Active
              </Badge>
              <Badge variant="outline" className="capitalize">
                Goal: {goal.replace("_", " ")}
              </Badge>
              <Badge variant="emerald" className="capitalize">
                Mode: {preferences?.preferredTrainingCategory ?? "Calisthenics"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {currentUser.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Your plan is dynamically calibrated for{" "}
              <span className="text-foreground font-semibold">
                {currentUser.currentWeightKg} kg → {currentUser.targetWeightKg}{" "}
                kg
              </span>{" "}
              ({nutritionTargets.dailyCalorieTarget} kcal/day via{" "}
              {nutritionTargets.formulaUsed}, {nutritionTargets.proteinTargetG}g
              protein, and {latestReadinessScore}% recovery readiness).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/trainer">
              <Button variant="primary">
                <Camera className="h-4 w-4" />
                Launch AI Camera Trainer
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="outline" size="md">
                <UserCheck className="h-4 w-4" />
                Edit Assessment
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* TOP 4 METRIC CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Calorie & Protein Brain */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold uppercase tracking-wider">
                Daily Calorie Brain
              </span>
              <Flame className="h-4 w-4 text-[#CCFF00]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">
                {todayNutrition.consumedCalories}
              </span>
              <span className="text-xs text-muted-foreground">
                / {todayNutrition.targetCalories} kcal
              </span>
            </div>
            <ProgressBar
              value={todayNutrition.consumedCalories}
              max={todayNutrition.targetCalories}
              className="my-3"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Remaining:{" "}
              <strong className="text-foreground">
                {Math.max(0, todayNutrition.remainingCalories)} kcal
              </strong>
            </span>
            <Link
              href="/food-tracker"
              className="text-[#CCFF00] font-semibold hover:underline"
            >
              Log Food →
            </Link>
          </div>
        </Card>

        {/* 2. Protein & Macro Progress */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold uppercase tracking-wider">
                Protein Synthesis Target
              </span>
              <Utensils className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">
                {todayNutrition.protein.consumedG}g
              </span>
              <span className="text-xs text-muted-foreground">
                / {todayNutrition.protein.targetG}g Protein
              </span>
            </div>
            <ProgressBar
              value={todayNutrition.protein.consumedG}
              max={todayNutrition.protein.targetG}
              colorClass="bg-emerald-400"
              className="my-3"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Carbs: {todayNutrition.carbs.consumedG}/
              {todayNutrition.carbs.targetG}g
            </span>
            <span>
              Fat: {todayNutrition.fat.consumedG}/{todayNutrition.fat.targetG}g
            </span>
          </div>
        </Card>

        {/* 3. Recovery Readiness */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold uppercase tracking-wider">
                Recovery Readiness
              </span>
              <HeartPulse className="h-4 w-4 text-[#CCFF00]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">
                {latestReadinessScore}%
              </span>
              <Badge
                variant={
                  latestReadinessScore >= 75
                    ? "lime"
                    : latestReadinessScore >= 58
                    ? "amber"
                    : "red"
                }
              >
                {latestReadinessScore >= 75
                  ? "Optimal"
                  : latestReadinessScore >= 58
                  ? "Moderate"
                  : "Low — Scaled"}
              </Badge>
            </div>
            <ProgressBar
              value={latestReadinessScore}
              max={100}
              className="my-3"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Avg Form Quality:{" "}
              <strong>
                {completedWorkoutsCount > 0
                  ? `${averageSessionForm}%`
                  : "Pending first session"}
              </strong>
            </span>
            <Link
              href="/recovery"
              className="text-[#CCFF00] font-semibold hover:underline"
            >
              Check-In →
            </Link>
          </div>
        </Card>

        {/* 4. Hydration & Water Tracker */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold uppercase tracking-wider">
                Hydration Target
              </span>
              <Droplets className="h-4 w-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-400">
                {todayNutrition.water.consumedMl}
              </span>
              <span className="text-xs text-muted-foreground">
                / {todayNutrition.water.targetMl} ml
              </span>
            </div>
            <ProgressBar
              value={todayNutrition.water.consumedMl}
              max={todayNutrition.water.targetMl}
              colorClass="bg-sky-400"
              className="my-3"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => logWaterIntake(250)}
            >
              +250 ml Glass
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => logWaterIntake(500)}
            >
              +500 ml Bottle
            </Button>
          </div>
        </Card>
      </div>

      {/* MAIN TWO-COLUMN GRID: ACTIVE WORKOUT + ADAPTIVE BRAIN RECOMMENDATIONS */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLS: TODAY'S PERSONALIZED WORKOUT PLAN */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="lime">Today&apos;s Individualized Workout</Badge>
                  <Badge variant="outline">
                    {activeWorkoutPlan?.estimatedDurationMin ?? 45} Min
                  </Badge>
                </div>
                <h2 className="text-xl font-bold">
                  {activeWorkoutPlan?.name ?? "Personalized Workout Protocol"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeWorkoutPlan?.aiRationale}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateNewWorkoutPlan()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <Link href="/workouts">
                  <Button size="sm" variant="primary">
                    <Play className="h-3.5 w-3.5" />
                    Start Session
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {activeWorkoutPlan?.exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#CCFF00]/15 text-[#CCFF00] text-xs font-bold">
                        {ex.orderIndex}
                      </span>
                      <span className="font-bold text-sm">
                        {ex.exerciseName}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {ex.primaryMuscle}
                      </Badge>
                      {ex.isCameraSupported && (
                        <Link href={`/trainer?exercise=${ex.cameraAnalyzerKey}`}>
                          <Badge variant="lime" className="cursor-pointer">
                            <Camera className="h-3 w-3" />
                            CV Supported
                          </Badge>
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">
                      {ex.progressionRecommendation}
                    </p>
                  </div>
                  <div className="text-right shrink-0 pl-8 sm:pl-0">
                    <span className="text-xs font-extrabold text-[#CCFF00] block">
                      {ex.targetSets} Sets × {ex.targetReps}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Rest: {ex.restDurationSec}s • Level {ex.difficultyLevel}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* INDEPENDENT PER-EXERCISE SKILL LEVELS SNAPSHOT */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold">
                  Independent Per-Exercise Skill Levels (Levels 1–5)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Difficulty is tracked independently per movement—never a
                  single global difficulty level.
                </p>
              </div>
              <Link href="/calisthenics">
                <Button variant="ghost" size="sm">
                  Skill Trees →
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {perExerciseLevels.map((perf) => (
                <div
                  key={perf.id}
                  className="rounded-xl border border-border bg-secondary/25 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {perf.exerciseName}
                    </span>
                    <Badge variant="lime">Level {perf.currentLevel}/5</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {getLevelLabel(perf.currentLevel)}
                  </p>
                  <ProgressBar value={perf.currentLevel * 20} max={100} />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>PB: {perf.personalBestReps} reps</span>
                    <span>Rolling Form: {Math.round(perf.rollingFormScore)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT 5 COLS: ADAPTIVE AI BRAIN RECOMMENDATIONS & MODULE SHORTCUTS */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#CCFF00]" />
                <h2 className="text-base font-bold">
                  Adaptive AI Fitness Brain Decisions
                </h2>
              </div>
              <Badge variant="emerald">Explainable AI</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        rec.priority === "high"
                          ? "amber"
                          : rec.moduleSource === "progression"
                          ? "lime"
                          : "default"
                      }
                      className="uppercase text-[10px]"
                    >
                      {rec.moduleSource} Engine
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Active
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">{rec.summary}</p>
                  <p className="text-[11px] text-muted-foreground/80 border-t border-border/60 pt-1.5 mt-1.5">
                    <strong>Why:</strong> {rec.rationale}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <Link href="/ai-coach">
                <Button variant="secondary" size="sm" className="w-full">
                  <Bot className="h-4 w-4 text-[#CCFF00]" />
                  Ask AI Fitness Coach About These Recommendations
                </Button>
              </Link>
            </div>
          </Card>

          {/* QUICK ACCESS TO TRAINING & NUTRITION MODULES */}
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Training &amp; Intelligence Modules
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Gym Training", href: "/gym", icon: Dumbbell },
                { label: "Home Workout", href: "/home", icon: Activity },
                { label: "Calisthenics", href: "/calisthenics", icon: Flame },
                { label: "Camera Trainer", href: "/trainer", icon: Camera },
                { label: "Meal Planner", href: "/nutrition", icon: Utensils },
                { label: "Calorie Brain", href: "/food-tracker", icon: Apple },
                { label: "Progress Charts", href: "/progress", icon: LineChart },
                { label: "Fitness History", href: "/history", icon: History },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3 text-xs font-semibold hover:border-[#CCFF00]/50 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#CCFF00]" />
                      {m.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
