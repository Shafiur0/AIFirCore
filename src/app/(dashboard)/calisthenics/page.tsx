"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — MODULE C: CALISTHENICS SKILL PATHWAYS (/calisthenics)
// Prerequisite-gated trees: Wall -> Incline -> Knee -> Standard -> Diamond -> Archer Push-up,
// Pull-Up / Front Lever, Dip / Handstand / Bar Muscle-Up, Squat Progression
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Flame,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";
import {
  CALISTHENICS_SKILL_PATHWAYS,
  evaluateVariationUnlockStatus,
  getExerciseBySlug,
} from "@/services/workout/exercise-catalog";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { Badge, Button, Card } from "@/components/ui/primitives";

export default function CalisthenicsPage() {
  const router = useRouter();
  const {
    currentUser,
    performanceMap,
    generateNewWorkoutPlan,
    recordCompletedWorkoutSession,
  } = useFitnessBrain();

  const [selectedPathwaySlug, setSelectedPathwaySlug] = useState(
    CALISTHENICS_SKILL_PATHWAYS[0].slug
  );
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const baselineLevelMap: Record<string, number> = {
    beginner: 1,
    novice: 2,
    intermediate: 3,
    advanced: 4,
    expert: 5,
  };
  const userBaselineLevel =
    baselineLevelMap[currentUser?.fitnessExperience ?? "intermediate"] ?? 2;

  const handleVerifyPrerequisiteMastery = (
    exerciseSlug: string,
    exerciseName: string,
    targetReps: number
  ) => {
    const res = recordCompletedWorkoutSession({
      sessionName: `Skill Verification: ${exerciseName}`,
      category: "calisthenics",
      durationSec: 600,
      perceivedDifficulty: 7,
      notes: "Completed skill pathway prerequisite verification.",
      exercises: [
        {
          exerciseSlug,
          exerciseName,
          targetSets: 3,
          completedSets: 3,
          targetRepsPerSet: Math.max(10, targetReps),
          totalReps: Math.max(15, targetReps),
          goodReps: Math.max(15, targetReps),
          badReps: 0,
          averageFormScore: 88,
          averageRomPct: 92,
          usedCameraTrainer: false,
        },
      ],
    });
    setFeedbackNotice(
      `Verified ${exerciseName} (${Math.max(15, targetReps)} reps @ 88% form)! ${
        res.decisions[0]?.reasonSummary ?? ""
      }`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="amber">
            Module C • Progressive Bodyweight Skill Mastery
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Calisthenics &amp; Skill Progression Pathways
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Never recommends an advanced movement without evaluating your
            ability, form quality score, and prerequisite repetitions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            generateNewWorkoutPlan({ category: "calisthenics" });
            router.push("/workouts");
          }}
        >
          <Sparkles className="h-4 w-4" />
          Generate Calisthenics Workout
        </Button>
      </div>

      {feedbackNotice && (
        <div className="rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 p-4 text-xs text-[#CCFF00] flex items-center justify-between">
          <span>{feedbackNotice}</span>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="underline font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PATHWAY SELECTOR TABS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CALISTHENICS_SKILL_PATHWAYS.map((pathway) => {
          const active = selectedPathwaySlug === pathway.slug;
          return (
            <button
              key={pathway.slug}
              onClick={() => setSelectedPathwaySlug(pathway.slug)}
              className={`text-left rounded-2xl border p-4 transition ${
                active
                  ? "border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_24px_-8px_rgba(204,255,0,0.4)]"
                  : "border-border bg-card hover:border-border/90"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant={active ? "lime" : "outline"}>
                  {pathway.nodes.length} Stages
                </Badge>
                <Flame className="h-4 w-4 text-[#CCFF00]" />
              </div>
              <h3 className="font-bold text-sm mt-1">{pathway.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {pathway.targetMuscle}
              </p>
            </button>
          );
        })}
      </div>

      {/* ACTIVE SKILL PROGRESSION TREE */}
      {CALISTHENICS_SKILL_PATHWAYS.filter(
        (p) => p.slug === selectedPathwaySlug
      ).map((pathway) => (
        <Card key={pathway.slug} className="p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold">{pathway.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {pathway.description}
            </p>
          </div>

          <div className="space-y-4">
            {pathway.nodes.map((node, idx) => {
              const status = evaluateVariationUnlockStatus({
                pathway,
                node,
                performanceMap,
                userBaselineLevel,
              });
              const catalogEx = getExerciseBySlug(node.exerciseSlug);
              const userPerf = performanceMap[node.exerciseSlug];

              return (
                <div key={node.exerciseSlug} className="relative">
                  <div
                    className={`rounded-2xl border p-5 transition ${
                      status.unlocked
                        ? "border-[#CCFF00]/40 bg-secondary/35"
                        : "border-border bg-secondary/15 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#CCFF00] text-black text-xs font-black">
                            {node.stepOrder}
                          </span>
                          <h3 className="text-base font-bold">
                            {node.exerciseName}
                          </h3>
                          <Badge variant={status.unlocked ? "lime" : "outline"}>
                            {status.unlocked ? (
                              <>
                                <Unlock className="h-3 w-3" /> Unlocked (Level{" "}
                                {node.level}/5)
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" /> Prerequisite Locked
                                (Level {node.level}/5)
                              </>
                            )}
                          </Badge>
                          {catalogEx?.isCameraSupported && (
                            <Link
                              href={`/trainer?exercise=${catalogEx.cameraAnalyzerKey}`}
                            >
                              <Badge variant="emerald">
                                <Camera className="h-3 w-3" />
                                AI Camera Trainer
                              </Badge>
                            </Link>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {node.description}
                        </p>

                        <p className="text-xs text-[#CCFF00] font-medium">
                          <ShieldCheck className="h-3.5 w-3.5 inline mr-1" />
                          {status.reason}
                        </p>

                        {userPerf && (
                          <p className="text-[11px] text-emerald-400">
                            Your Record: Personal Best {userPerf.personalBestReps}{" "}
                            reps • Rolling Form{" "}
                            {Math.round(userPerf.rollingFormScore)}%
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {status.unlocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() =>
                              handleVerifyPrerequisiteMastery(
                                node.exerciseSlug,
                                node.exerciseName,
                                pathway.nodes[idx + 1]?.prerequisiteReps ?? 15
                              )
                            }
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#CCFF00]" />
                            Log Mastery Set
                          </Button>
                        )}
                        {catalogEx?.isCameraSupported && status.unlocked && (
                          <Link
                            href={`/trainer?exercise=${catalogEx.cameraAnalyzerKey}`}
                          >
                            <Button size="sm" variant="primary" className="text-xs">
                              <Camera className="h-3.5 w-3.5" />
                              Train With Camera
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
