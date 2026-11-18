"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — RECOVERY TRACKING & READINESS ENGINE (/recovery)
// Tracks sleep, soreness, fatigue, stress & computes live Readiness Score (0-100)
// ============================================================================

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  HeartPulse,
  Moon,
  Sparkles,
  Zap,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { calculateRecoveryReadiness } from "@/services/recovery/recovery-engine";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  ProgressBar,
} from "@/components/ui/primitives";

const MUSCLE_AREAS = [
  "Chest",
  "Back",
  "Shoulders",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Arms",
  "Core",
];

export default function RecoveryTrackingPage() {
  const { currentUser, recoveryLogs, logRecoveryCheckIn } = useFitnessBrain();
  const latest = recoveryLogs[0];

  const [sleepHours, setSleepHours] = useState(latest?.sleepHours ?? 7.5);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(
    latest?.sleepQuality ?? 4
  );
  const [muscleSoreness, setMuscleSoreness] = useState<1 | 2 | 3 | 4 | 5>(
    latest?.muscleSoreness ?? 2
  );
  const [soreAreas, setSoreAreas] = useState<string[]>(
    latest?.soreAreas ?? []
  );
  const [fatigueLevel, setFatigueLevel] = useState<1 | 2 | 3 | 4 | 5>(
    latest?.fatigueLevel ?? 2
  );
  const [stressLevel, setStressLevel] = useState<1 | 2 | 3 | 4 | 5>(
    latest?.stressLevel ?? 2
  );
  const [isRestDay, setIsRestDay] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedBanner, setSavedBanner] = useState(false);

  const livePreview = useMemo(
    () =>
      calculateRecoveryReadiness({
        userId: currentUser?.id ?? "preview",
        sleepHours,
        sleepQuality,
        muscleSoreness,
        soreAreas,
        fatigueLevel,
        stressLevel,
        isRestDay,
        notes,
      }),
    [
      currentUser?.id,
      sleepHours,
      sleepQuality,
      muscleSoreness,
      soreAreas,
      fatigueLevel,
      stressLevel,
      isRestDay,
      notes,
    ]
  );

  const toggleSoreArea = (area: string) => {
    setSoreAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSaveCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    logRecoveryCheckIn({
      sleepHours,
      sleepQuality,
      muscleSoreness,
      soreAreas,
      fatigueLevel,
      stressLevel,
      isRestDay,
      notes,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lime">Recovery Intelligence Engine</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Recovery, Sleep &amp; CNS Readiness Tracker
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your Readiness Score feeds directly into the AI Workout Generator
            and Progressive Overload Engine so you never overtrain on low sleep.
          </p>
        </div>
      </div>

      {savedBanner && (
        <div className="rounded-xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 p-3.5 text-xs text-[#CCFF00] font-bold">
          ✓ Recovery check-in saved! Your active workout volume and progression
          thresholds have been synchronized.
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* CHECK-IN FORM */}
        <Card className="p-6 lg:col-span-7">
          <form onSubmit={handleSaveCheckIn} className="space-y-5">
            <h2 className="text-lg font-bold">Daily Biometric Recovery Check-In</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Sleep Duration Last Night (Hours)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min={2}
                  max={14}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Sleep Quality (1 = Poor, 5 = Deep Restorative)</Label>
                <select
                  value={sleepQuality}
                  onChange={(e) =>
                    setSleepQuality(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value={1}>1 — Very Restless / Interrupted</option>
                  <option value={2}>2 — Light / Suboptimal</option>
                  <option value={3}>3 — Moderate Sleep</option>
                  <option value={4}>4 — Good Restorative Sleep</option>
                  <option value={5}>5 — Deep Peak Recovery</option>
                </select>
              </div>

              <div>
                <Label>Muscle Soreness / DOMS (1 = Fresh, 5 = Severe)</Label>
                <select
                  value={muscleSoreness}
                  onChange={(e) =>
                    setMuscleSoreness(
                      Number(e.target.value) as 1 | 2 | 3 | 4 | 5
                    )
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value={1}>1 — Completely Fresh</option>
                  <option value={2}>2 — Mild Tightness</option>
                  <option value={3}>3 — Moderate DOMS</option>
                  <option value={4}>4 — Sore (Avoid Heavy Loading)</option>
                  <option value={5}>5 — Severe Soreness</option>
                </select>
              </div>

              <div>
                <Label>Systemic Fatigue Level (1 = Energized, 5 = Exhausted)</Label>
                <select
                  value={fatigueLevel}
                  onChange={(e) =>
                    setFatigueLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value={1}>1 — High Energy &amp; Drive</option>
                  <option value={2}>2 — Normal Energy</option>
                  <option value={3}>3 — Slightly Tired</option>
                  <option value={4}>4 — High Fatigue</option>
                  <option value={5}>5 — Drained / Needs Rest</option>
                </select>
              </div>

              <div>
                <Label>Life / Work Stress (1 = Calm, 5 = High Stress)</Label>
                <select
                  value={stressLevel}
                  onChange={(e) =>
                    setStressLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value={1}>1 — Calm &amp; Focused</option>
                  <option value={2}>2 — Low Stress</option>
                  <option value={3}>3 — Moderate Stress</option>
                  <option value={4}>4 — High Stress</option>
                  <option value={5}>5 — Very High Stress</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-xs cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={isRestDay}
                    onChange={(e) => setIsRestDay(e.target.checked)}
                    className="accent-[#CCFF00]"
                  />
                  <span>Mark Today as an Active Rest / Mobility Day</span>
                </label>
              </div>
            </div>

            <div>
              <Label>Specific Sore Muscle Groups (Workout Generator Will Protect These)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MUSCLE_AREAS.map((area) => {
                  const active = soreAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleSoreArea(area)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        active
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-secondary/40 text-muted-foreground border-border"
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Optional Recovery Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
                placeholder="e.g., Lower back slightly tight after RDLs; hydrated well"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full">
              <CheckCircle2 className="h-4 w-4" />
              Save Recovery Check-In &amp; Sync AI Fitness Brain
            </Button>
          </form>
        </Card>

        {/* LIVE READINESS PRESCRIPTION CARD */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 border-[#CCFF00]/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CCFF00]">
                Computed Readiness Score
              </span>
              <Badge
                variant={
                  livePreview.prescription.readinessScore >= 75
                    ? "lime"
                    : livePreview.prescription.readinessScore >= 58
                    ? "amber"
                    : "red"
                }
              >
                {livePreview.prescription.statusLabel}
              </Badge>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-[#CCFF00]">
                {livePreview.prescription.readinessScore}%
              </span>
              <span className="text-xs text-muted-foreground">
                Neuromuscular Readiness
              </span>
            </div>

            <ProgressBar
              value={livePreview.prescription.readinessScore}
              max={100}
            />

            <p className="text-xs text-muted-foreground leading-relaxed">
              {livePreview.prescription.coachingAdvice}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded-xl bg-secondary/40 p-3 border border-border">
                <span className="text-muted-foreground block">
                  Volume Multiplier
                </span>
                <span className="text-base font-black">
                  {Math.round(livePreview.prescription.volumeMultiplier * 100)}%
                  Sets
                </span>
              </div>
              <div className="rounded-xl bg-secondary/40 p-3 border border-border">
                <span className="text-muted-foreground block">
                  Rest Interval Adjustment
                </span>
                <span className="text-base font-black text-emerald-400">
                  +{livePreview.prescription.restBonusSec}s Rest
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold">Recent Recovery Logs</h3>
            <div className="space-y-2">
              {recoveryLogs.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold">{r.readinessScore}% Ready</span>
                    <span className="text-muted-foreground ml-2">
                      ({r.sleepHours}h sleep • Soreness {r.muscleSoreness}/5)
                    </span>
                  </div>
                  <span className="text-muted-foreground">{r.loggedDate}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
