"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — MODULE A: GYM TRAINING (/gym)
// Chest, Back, Shoulder, Arm, Leg, Core, Full-Body; Barbell, Dumbbell, Machine
// ============================================================================

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Dumbbell,
  Flame,
  Info,
  Play,
  Sparkles,
} from "lucide-react";
import { EXERCISE_CATALOG, getExerciseBySlug } from "@/services/workout/exercise-catalog";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { ExerciseCatalogItem } from "@/types/fitness";
import {
  Badge,
  Button,
  Card,
  Modal,
} from "@/components/ui/primitives";
import { getLevelLabel } from "@/lib/utils";

const MUSCLE_FILTERS = [
  { id: "all", label: "All Muscle Groups" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms (Biceps & Triceps)" },
  { id: "legs", label: "Legs (Quads & Hamstrings)" },
  { id: "core", label: "Core" },
];

const EQUIPMENT_FILTERS = [
  { id: "all", label: "All Equipment" },
  { id: "barbell", label: "Barbell" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "cable-machine", label: "Cable Machine" },
  { id: "machine", label: "Gym Machine" },
];

const PROGRAM_TRACKS = [
  {
    id: "strength",
    name: "Maximal Strength Program",
    focus: "5–8 reps • 90–120s rest • Compound Barbell & Dumbbell Lifts",
    muscles: ["chest", "back", "quadriceps", "shoulders"],
  },
  {
    id: "hypertrophy",
    name: "Hypertrophy & Muscle Mass Program",
    focus: "8–12 reps • 60–90s rest • High Mechanical Tension & Isolation",
    muscles: ["chest", "back", "shoulders", "biceps", "triceps", "quadriceps"],
  },
  {
    id: "fat-loss",
    name: "Metabolic Resistance Fat-Loss Program",
    focus: "12–15 reps • 45–60s rest • Compound Multi-Joint Density",
    muscles: ["quadriceps", "back", "chest", "core"],
  },
];

export default function GymTrainingPage() {
  const router = useRouter();
  const { performanceMap, generateNewWorkoutPlan } = useFitnessBrain();
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [inspectedExercise, setInspectedExercise] =
    useState<ExerciseCatalogItem | null>(null);

  const gymExercises = useMemo(() => {
    return EXERCISE_CATALOG.filter((ex) => {
      const isGymRelevant =
        ex.category === "gym" ||
        ex.equipment.includes("dumbbells") ||
        ex.equipment.includes("barbell") ||
        ex.equipment.includes("pullup-bar");
      if (!isGymRelevant) return false;

      if (selectedMuscle !== "all") {
        if (selectedMuscle === "arms") {
          if (ex.primaryMuscle !== "biceps" && ex.primaryMuscle !== "triceps")
            return false;
        } else if (selectedMuscle === "legs") {
          if (
            ex.primaryMuscle !== "quadriceps" &&
            ex.primaryMuscle !== "hamstrings" &&
            ex.primaryMuscle !== "glutes"
          )
            return false;
        } else if (ex.primaryMuscle !== selectedMuscle) {
          return false;
        }
      }

      if (
        selectedEquipment !== "all" &&
        !ex.equipment.includes(selectedEquipment)
      ) {
        return false;
      }

      if (
        selectedProgram !== "all" &&
        !ex.programTags.includes(selectedProgram)
      ) {
        return false;
      }

      return true;
    });
  }, [selectedMuscle, selectedEquipment, selectedProgram]);

  const handleLaunchGymProgram = (trackMuscles?: string[]) => {
    generateNewWorkoutPlan({
      category: "gym",
      targetMuscles:
        trackMuscles ??
        (selectedMuscle !== "all" ? [selectedMuscle] : undefined),
    });
    router.push("/workouts");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lime">Module A • Gym Resistance Intelligence</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Gym Training &amp; Resistance Programs
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Barbell, Dumbbell, Cable, and Machine exercises with individualized
            sets, reps, rest timers, form cues, and progression pathways.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => handleLaunchGymProgram()}
        >
          <Sparkles className="h-4 w-4" />
          Generate Personalized Gym Workout
        </Button>
      </div>

      {/* 3 GYM PROGRAM TRACKS */}
      <div className="grid md:grid-cols-3 gap-4">
        {PROGRAM_TRACKS.map((track) => {
          const active = selectedProgram === track.id;
          return (
            <Card
              key={track.id}
              className={`p-5 flex flex-col justify-between transition ${
                active ? "border-[#CCFF00]" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="lime" className="uppercase">
                    {track.id} Track
                  </Badge>
                  <Dumbbell className="h-4 w-4 text-[#CCFF00]" />
                </div>
                <h3 className="text-base font-bold">{track.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  {track.focus}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={active ? "primary" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() =>
                    setSelectedProgram(active ? "all" : track.id)
                  }
                >
                  {active ? "Filtering Active" : "Filter Exercises"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => handleLaunchGymProgram(track.muscles)}
                >
                  <Play className="h-3.5 w-3.5 text-[#CCFF00]" />
                  Build Plan
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MUSCLE & EQUIPMENT FILTER BAR */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Muscle:
          </span>
          {MUSCLE_FILTERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMuscle(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedMuscle === m.id
                  ? "bg-[#CCFF00] text-black"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Equipment:
          </span>
          {EQUIPMENT_FILTERS.map((eq) => (
            <button
              key={eq.id}
              onClick={() => setSelectedEquipment(eq.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedEquipment === eq.id
                  ? "bg-emerald-400 text-black"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {eq.label}
            </button>
          ))}
        </div>
      </Card>

      {/* EXERCISE CATALOG GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gymExercises.map((ex) => {
          const userPerf = performanceMap[ex.slug];
          const userLevel = userPerf?.currentLevel ?? ex.difficultyLevel;
          return (
            <Card
              key={ex.id}
              className="p-5 flex flex-col justify-between hover:border-[#CCFF00]/50 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
                      {ex.primaryMuscle} • {ex.equipment.join(" / ")}
                    </span>
                    <h3 className="text-base font-bold mt-0.5">{ex.name}</h3>
                  </div>
                  <Badge variant="outline">Level {userLevel}/5</Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {ex.description}
                </p>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary/40 p-2.5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Sets
                    </span>
                    <span className="font-bold">{ex.defaultSets}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Reps
                    </span>
                    <span className="font-bold text-[#CCFF00]">
                      {ex.defaultReps}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Rest
                    </span>
                    <span className="font-bold">{ex.defaultRestSec}s</span>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1">
                  <p>
                    <strong className="text-foreground">Form Cue:</strong>{" "}
                    {ex.instructions[0]?.formCue}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => setInspectedExercise(ex)}
                >
                  <Info className="h-3.5 w-3.5" />
                  Instructions &amp; Progression
                </Button>
                {ex.isCameraSupported && (
                  <Link href={`/trainer?exercise=${ex.cameraAnalyzerKey}`}>
                    <Button size="sm" variant="primary" className="text-xs">
                      <Camera className="h-3.5 w-3.5" />
                      CV
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* EXERCISE DETAIL MODAL */}
      <Modal
        isOpen={Boolean(inspectedExercise)}
        onClose={() => setInspectedExercise(null)}
        title={inspectedExercise?.name ?? ""}
        subtitle={
          inspectedExercise
            ? `${getLevelLabel(inspectedExercise.difficultyLevel)} • Target: ${inspectedExercise.primaryMuscle.toUpperCase()}`
            : ""
        }
      >
        {inspectedExercise && (
          <div className="space-y-4 text-xs">
            <p className="text-sm text-muted-foreground">
              {inspectedExercise.description}
            </p>

            <div className="grid grid-cols-3 gap-3 rounded-xl bg-secondary/50 p-3">
              <div>
                <span className="text-muted-foreground block">
                  Recommended Sets
                </span>
                <span className="text-base font-bold">
                  {inspectedExercise.defaultSets} Sets
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  Target Repetitions
                </span>
                <span className="text-base font-bold text-[#CCFF00]">
                  {inspectedExercise.defaultReps}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  Rest Duration
                </span>
                <span className="text-base font-bold">
                  {inspectedExercise.defaultRestSec} Seconds
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-foreground">
                Step-by-Step Execution &amp; Form Guidance
              </h4>
              {inspectedExercise.instructions.map((step) => (
                <div
                  key={step.stepNumber}
                  className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1"
                >
                  <p className="font-semibold text-foreground">
                    Step {step.stepNumber}: {step.instructionText}
                  </p>
                  <p className="text-emerald-400">
                    ✓ Form Cue: {step.formCue}
                  </p>
                  <p className="text-amber-300">
                    ⚠ Avoid: {step.commonMistake}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/5 p-3 space-y-1">
              <h4 className="font-bold text-foreground">
                Suitable Progression &amp; Regression Options
              </h4>
              <p className="text-muted-foreground">
                Easier Variation:{" "}
                <strong className="text-foreground">
                  {inspectedExercise.progressionOptions.easierVariationSlug
                    ? getExerciseBySlug(
                        inspectedExercise.progressionOptions.easierVariationSlug
                      )?.name
                    : "Reduce load by 10–15% or elevate angle"}
                </strong>
              </p>
              <p className="text-muted-foreground">
                Harder Progression:{" "}
                <strong className="text-[#CCFF00]">
                  {inspectedExercise.progressionOptions.harderVariationSlug
                    ? getExerciseBySlug(
                        inspectedExercise.progressionOptions.harderVariationSlug
                      )?.name
                    : "Add +2.5 kg load or +2 reps per set once form >= 82%"}
                </strong>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
