"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SECTION 15: FITNESS HISTORY & PERSONAL MEMORY (/history)
// Long-term Workout, Progression, Nutrition, Body Metrics & Recovery Memory
// ============================================================================

import React, { useState } from "react";
import {
  Activity,
  Apple,
  Camera,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  History,
  Plus,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
} from "@/components/ui/primitives";
import { formatDuration } from "@/lib/utils";

export default function FitnessHistoryPage() {
  const {
    currentUser,
    workoutSessions,
    performanceMap,
    progressionHistory,
    foodEntries,
    weightLogs,
    bodyMeasurements,
    recoveryLogs,
    logWeightAndBody,
  } = useFitnessBrain();

  const [activeTab, setActiveTab] = useState<
    "workouts" | "progression" | "nutrition" | "body" | "recovery"
  >("workouts");

  // Quick Body Weight & Measurement Logger state
  const [newWeightKg, setNewWeightKg] = useState(
    currentUser?.currentWeightKg ?? 74.5
  );
  const [newBodyFatPct, setNewBodyFatPct] = useState(
    currentUser?.bodyFatPct ?? 16.5
  );
  const [waistCm, setWaistCm] = useState<string>("81");
  const [chestCm, setChestCm] = useState<string>("98");
  const [bicepCm, setBicepCm] = useState<string>("36");
  const [aiHistoryAnalysis, setAiHistoryAnalysis] = useState<{
    summary: string;
    strengths: string[];
    bottlenecks: string[];
    nextAction: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeHistory = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyzeFitnessHistory",
          userId: currentUser?.id,
          payload: {
            profile: currentUser,
            sessions: workoutSessions,
            performanceMap,
            progressionHistory,
            recoveryLogs,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiHistoryAnalysis(data);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogBodyMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    logWeightAndBody({
      weightKg: Number(newWeightKg),
      bodyFatPct: Number(newBodyFatPct) || undefined,
      isMeasured: true,
      waistCm: Number(waistCm) || undefined,
      chestCm: Number(chestCm) || undefined,
      bicepCm: Number(bicepCm) || undefined,
      notes: "Measured biometric log",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lime">Section 15 • Long-Term Personal Memory</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Fitness History &amp; Personal Memory Vault
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            The system never treats a new workout as if you have no previous
            experience. Every session, meal, body metric, and recovery log is
            preserved here.
          </p>
        </div>

        <Button
          variant="primary"
          disabled={analyzing}
          onClick={handleAnalyzeHistory}
        >
          <Sparkles className="h-4 w-4" />
          {analyzing
            ? "Analyzing Memory..."
            : "Run AI Historical Trend Analysis"}
        </Button>
      </div>

      {/* AI HISTORICAL SYNTHESIS CARD */}
      {aiHistoryAnalysis && (
        <Card className="p-6 border-[#CCFF00]/40 bg-[#CCFF00]/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#CCFF00]">
              AI Fitness Brain Memory Synthesis
            </h3>
            <Badge variant="lime">Historical Evidence</Badge>
          </div>
          <p className="text-xs sm:text-sm text-foreground">
            {aiHistoryAnalysis.summary}
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-background/70 p-3.5 border border-border space-y-1.5">
              <span className="font-bold text-emerald-400 uppercase text-[10px]">
                Verified Strengths
              </span>
              {aiHistoryAnalysis.strengths.map((s, i) => (
                <p key={i} className="text-muted-foreground">
                  ✓ {s}
                </p>
              ))}
            </div>
            <div className="rounded-xl bg-background/70 p-3.5 border border-border space-y-1.5">
              <span className="font-bold text-amber-300 uppercase text-[10px]">
                Focus &amp; Next Action
              </span>
              {aiHistoryAnalysis.bottlenecks.map((b, i) => (
                <p key={i} className="text-muted-foreground">
                  • {b}
                </p>
              ))}
              <p className="text-[#CCFF00] font-semibold pt-1">
                Next: {aiHistoryAnalysis.nextAction}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* CATEGORY TABS */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            {
              id: "workouts",
              label: `Workout Sessions (${workoutSessions.length})`,
              icon: Dumbbell,
            },
            {
              id: "progression",
              label: `Progression Decisions (${progressionHistory.length})`,
              icon: TrendingUp,
            },
            {
              id: "nutrition",
              label: `Nutrition Logs (${foodEntries.length})`,
              icon: Apple,
            },
            {
              id: "body",
              label: `Body & Weight (${weightLogs.length})`,
              icon: Scale,
            },
            {
              id: "recovery",
              label: `Recovery Logs (${recoveryLogs.length})`,
              icon: HeartPulse,
            },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                active
                  ? "bg-[#CCFF00] text-black"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORKOUT SESSIONS */}
      {activeTab === "workouts" && (
        <div className="space-y-4">
          {workoutSessions.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              No workout sessions recorded yet. Start a session in Workout
              Planner or AI Camera Trainer!
            </Card>
          ) : (
            workoutSessions.map((session) => (
              <Card key={session.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold">
                        {session.sessionName}
                      </h3>
                      <Badge variant="lime" className="uppercase">
                        {session.category}
                      </Badge>
                      <Badge variant="emerald">{session.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(session.startedAt).toLocaleString()} • Duration:{" "}
                      {formatDuration(session.durationSec)} • Est. Burn:{" "}
                      {session.caloriesBurnedEst} kcal
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#CCFF00] block">
                      {session.totalReps} Total Reps ({session.goodReps} Good)
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      Avg Movement Quality: {session.averageFormScore}%
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {session.exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border bg-secondary/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{ex.exerciseName}</span>
                        {ex.usedCameraTrainer && (
                          <Badge variant="lime" className="text-[10px]">
                            <Camera className="h-3 w-3" /> CV
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1">
                        Sets: {ex.completedSets}/{ex.targetSets} • Reps:{" "}
                        {ex.totalReps} ({ex.goodReps} good) • Form:{" "}
                        <strong className="text-[#CCFF00]">
                          {ex.averageFormScore}%
                        </strong>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PROGRESSION ENGINE AUDIT LOG */}
      {activeTab === "progression" && (
        <div className="space-y-3">
          {progressionHistory.map((rec) => (
            <Card key={rec.id} className="p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{rec.exerciseName}</h3>
                  <Badge
                    variant={
                      rec.decision === "progress"
                        ? "lime"
                        : rec.decision === "regress"
                        ? "amber"
                        : "outline"
                    }
                    className="uppercase"
                  >
                    {rec.decision} (Level {rec.previousLevel} → Level{" "}
                    {rec.newLevel})
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(rec.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {rec.reasonSummary}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-[#CCFF00] font-semibold pt-1">
                <span>
                  Prescription: {rec.recommendedVariationName} (
                  {rec.recommendedRepsOrLoad})
                </span>
                <span>• Form: {rec.evidenceMetrics.formScore}%</span>
                <span>• ROM: {rec.evidenceMetrics.romScore}%</span>
                <span>
                  • Readiness: {rec.evidenceMetrics.recoveryReadiness}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: NUTRITION LOGS */}
      {activeTab === "nutrition" && (
        <Card className="p-5 space-y-3">
          <h3 className="text-base font-bold">
            Confirmed Food &amp; Calorie Entries ({foodEntries.length})
          </h3>
          <div className="space-y-2.5">
            {foodEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-secondary/30 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="lime" className="uppercase">
                      {entry.mealType}
                    </Badge>
                    <span className="font-bold">{entry.foodName}</span>
                    <span className="text-muted-foreground">
                      ({entry.loggedDate})
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    Portion: {entry.portionGrams}g • Method: {entry.entryMethod}
                  </p>
                </div>
                <div className="font-mono font-bold text-[#CCFF00]">
                  {entry.caloriesKcal} kcal • {entry.proteinG}g P •{" "}
                  {entry.carbsG}g C • {entry.fatG}g F
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: BODY WEIGHT & MEASUREMENTS */}
      {activeTab === "body" && (
        <div className="grid lg:grid-cols-12 gap-6">
          <Card className="p-5 lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold">
              Log Measured Body Weight &amp; Circumferences
            </h3>
            <form onSubmit={handleLogBodyMetrics} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newWeightKg}
                    onChange={(e) => setNewWeightKg(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Body Fat % (Optional)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newBodyFatPct}
                    onChange={(e) => setNewBodyFatPct(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Waist (cm)</Label>
                  <Input
                    type="number"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Chest (cm)</Label>
                  <Input
                    type="number"
                    value={chestCm}
                    onChange={(e) => setChestCm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Bicep (cm)</Label>
                  <Input
                    type="number"
                    value={bicepCm}
                    onChange={(e) => setBicepCm(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" />
                Save Measured Biometric Log
              </Button>
            </form>
          </Card>

          <Card className="p-5 lg:col-span-7 space-y-3">
            <h3 className="text-base font-bold">
              Historical Body Weight &amp; Composition Log
            </h3>
            <div className="space-y-2">
              {weightLogs.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-sm">{w.weightKg} kg</span>
                    {w.bodyFatPct && (
                      <span className="text-muted-foreground ml-2">
                        ({w.bodyFatPct}% Body Fat)
                      </span>
                    )}
                    <Badge variant="emerald" className="ml-2 text-[10px]">
                      {w.isMeasured ? "Measured Data" : "Estimated"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">{w.loggedDate}</span>
                </div>
              ))}
            </div>
            {bodyMeasurements.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Body Tape Measurements
                </h4>
                {bodyMeasurements.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl bg-secondary/20 p-2.5 text-xs flex justify-between"
                  >
                    <span>
                      Waist: {m.waistCm ?? "-"}cm • Chest: {m.chestCm ?? "-"}cm
                      • Bicep: {m.bicepCm ?? "-"}cm
                    </span>
                    <span className="text-muted-foreground">
                      {m.loggedDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 5: RECOVERY LOGS */}
      {activeTab === "recovery" && (
        <div className="space-y-3">
          {recoveryLogs.map((r) => (
            <Card
              key={r.id}
              className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    Readiness Score: {r.readinessScore}%
                  </span>
                  <Badge
                    variant={
                      r.readinessScore >= 75
                        ? "lime"
                        : r.readinessScore >= 58
                        ? "amber"
                        : "red"
                    }
                  >
                    {r.loggedDate}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Sleep: {r.sleepHours}h (Quality {r.sleepQuality}/5) •
                  Soreness: {r.muscleSoreness}/5 • Fatigue: {r.fatigueLevel}/5 •
                  Stress: {r.stressLevel}/5
                </p>
              </div>
              {r.notes && (
                <span className="italic text-muted-foreground">
                  &ldquo;{r.notes}&rdquo;
                </span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
