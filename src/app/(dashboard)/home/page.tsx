"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — MODULE B: HOME WORKOUT (/home)
// Equipment-aware routines adapting to what the user actually owns at home
// ============================================================================

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Home,
  Play,
  Sliders,
  Sparkles,
} from "lucide-react";
import { EXERCISE_CATALOG } from "@/services/workout/exercise-catalog";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { Badge, Button, Card } from "@/components/ui/primitives";

const HOME_GEAR_ITEMS = [
  { id: "none", label: "No Equipment (Bodyweight)" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "resistance-band", label: "Resistance Bands" },
  { id: "pullup-bar", label: "Doorway Pull-Up Bar" },
];

const HOME_ROUTINES = [
  {
    id: "beginner",
    title: "Beginner Foundation Home Routine",
    duration: 25,
    focus: "Joint-friendly full-body movements requiring zero gym machines.",
    muscles: ["chest", "quadriceps", "glutes", "core"],
  },
  {
    id: "full-body",
    title: "Full-Body Home Conditioning",
    duration: 35,
    focus: "Balanced push, pull, squat, lunge, and core stability.",
    muscles: ["quadriceps", "chest", "back", "core"],
  },
  {
    id: "upper-body",
    title: "Home Upper-Body Sculpt",
    duration: 30,
    focus: "Chest, back, shoulders, and biceps using your owned home gear.",
    muscles: ["chest", "back", "biceps", "shoulders"],
  },
  {
    id: "lower-body",
    title: "Lower-Body & Glute Builder",
    duration: 30,
    focus: "Squats, lunges, and hip hinge movements for leg strength.",
    muscles: ["quadriceps", "glutes"],
  },
  {
    id: "fat-loss",
    title: "High-Density Home Fat-Loss Circuit",
    duration: 30,
    focus: "Short rest intervals and dynamic core conditioning.",
    muscles: ["core", "quadriceps", "chest"],
  },
];

export default function HomeWorkoutPage() {
  const router = useRouter();
  const {
    preferences,
    saveOnboardingAndProfile,
    generateNewWorkoutPlan,
  } = useFitnessBrain();

  const ownedGear = preferences?.availableEquipment ?? ["none"];
  const [routineFilter, setRoutineFilter] = useState("all");

  const toggleHomeGear = (gearId: string) => {
    const next = ownedGear.includes(gearId)
      ? ownedGear.filter((g) => g !== gearId)
      : [...ownedGear, gearId];
    const safeNext = next.length > 0 ? next : ["none"];
    saveOnboardingAndProfile({
      profileUpdates: {},
      preferencesUpdates: {
        availableEquipment: safeNext,
        preferredTrainingCategory: "home",
      },
    });
  };

  const eligibleExercises = useMemo(() => {
    return EXERCISE_CATALOG.filter((ex) => {
      if (ex.category !== "home" && ex.category !== "calisthenics") return false;
      const hasGear = ex.equipment.every(
        (req) => req === "none" || ownedGear.includes(req)
      );
      if (!hasGear) return false;
      if (routineFilter !== "all" && !ex.programTags.includes(routineFilter)) {
        return false;
      }
      return true;
    });
  }, [ownedGear, routineFilter]);

  const handleStartHomeRoutine = (durationMin: number, muscles: string[]) => {
    generateNewWorkoutPlan({
      category: "home",
      durationMin,
      targetMuscles: muscles,
    });
    router.push("/workouts");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald">Module B • Equipment-Synced Home Training</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Home Workout Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            The AI strictly filters exercises to match the exact equipment you
            own at home.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => handleStartHomeRoutine(35, ["chest", "quadriceps", "back", "core"])}
        >
          <Sparkles className="h-4 w-4" />
          Generate Custom Home Workout
        </Button>
      </div>

      {/* INTERACTIVE OWNED EQUIPMENT SELECTOR */}
      <Card className="p-5 border-emerald-500/30 bg-emerald-500/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#CCFF00]" />
            <h2 className="text-sm font-bold">
              Equipment I Actually Own at Home (Live Filter)
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {eligibleExercises.length} compatible exercises unlocked
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {HOME_GEAR_ITEMS.map((item) => {
            const active = ownedGear.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleHomeGear(item.id)}
                className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border-[#CCFF00] bg-[#CCFF00]/15 text-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span>{item.label}</span>
                {active && <CheckCircle2 className="h-4 w-4 text-[#CCFF00]" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* CURATED HOME ROUTINES */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {HOME_ROUTINES.map((routine) => (
          <Card key={routine.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="lime">{routine.duration} Min</Badge>
                <Home className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold">{routine.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {routine.focus}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() =>
                  setRoutineFilter(
                    routineFilter === routine.id ? "all" : routine.id
                  )
                }
              >
                {routineFilter === routine.id ? "Showing All" : "Preview Moves"}
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="text-xs"
                onClick={() =>
                  handleStartHomeRoutine(routine.duration, routine.muscles)
                }
              >
                <Play className="h-3.5 w-3.5" />
                Start
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* COMPATIBLE HOME EXERCISES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Exercises Matched to Your Home Equipment ({eligibleExercises.length})
          </h2>
          {routineFilter !== "all" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRoutineFilter("all")}
            >
              Clear Filter
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eligibleExercises.map((ex) => (
            <Card key={ex.id} className="p-5 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">
                    {ex.equipment.join(", ")}
                  </Badge>
                  <Badge variant="lime">Level {ex.difficultyLevel}/5</Badge>
                </div>
                <h3 className="text-base font-bold">{ex.name}</h3>
                <p className="text-xs text-muted-foreground">{ex.description}</p>
                <p className="text-xs font-semibold text-[#CCFF00]">
                  {ex.defaultSets} Sets × {ex.defaultReps} (Rest {ex.defaultRestSec}s)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  <strong>Form Guidance:</strong> {ex.instructions[0]?.formCue}
                </p>
              </div>
              {ex.isCameraSupported && (
                <div className="mt-4 pt-3 border-t border-border">
                  <Link href={`/trainer?exercise=${ex.cameraAnalyzerKey}`}>
                    <Button size="sm" variant="secondary" className="w-full text-xs">
                      <Camera className="h-3.5 w-3.5 text-[#CCFF00]" />
                      Analyze Live with AI Camera Trainer
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
