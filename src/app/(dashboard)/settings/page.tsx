"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — USER PROFILE, PRIVACY & SETTINGS (/settings)
// Profile editing, AI model configuration status, JSON data export & deletion
// ============================================================================

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Lock,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import {
  FitnessGoalType,
  FoodBudgetTier,
  TrainingCategory,
} from "@/types/fitness";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
} from "@/components/ui/primitives";

export default function SettingsPage() {
  const router = useRouter();
  const {
    currentUser,
    goal,
    preferences,
    isSupabaseLive,
    saveOnboardingAndProfile,
    updatePassword,
    exportUserDataJson,
    deleteUserAccountData,
  } = useFitnessBrain();

  const [fullName, setFullName] = useState(currentUser?.fullName ?? "");
  const [weightKg, setWeightKg] = useState(
    currentUser?.currentWeightKg ?? 74.5
  );
  const [targetWeightKg, setTargetWeightKg] = useState(
    currentUser?.targetWeightKg ?? 71.0
  );
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoalType>(goal);
  const [selectedCategory, setSelectedCategory] = useState<TrainingCategory>(
    preferences?.preferredTrainingCategory ?? "calisthenics"
  );
  const [budgetTier, setBudgetTier] = useState<FoodBudgetTier>(
    preferences?.foodBudgetTier ?? "moderate"
  );
  const [voiceFeedback, setVoiceFeedback] = useState(
    preferences?.voiceFeedbackEnabled ?? true
  );
  const [newPassword, setNewPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [aiServerInfo, setAiServerInfo] = useState<any>(null);

  useEffect(() => {
    fetch("/api/ai")
      .then((r) => r.json())
      .then((d) => setAiServerInfo(d))
      .catch(() => {});
  }, []);

  if (!currentUser) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveOnboardingAndProfile({
      profileUpdates: {
        fullName,
        currentWeightKg: Number(weightKg),
        targetWeightKg: Number(targetWeightKg),
      },
      goal: selectedGoal,
      preferencesUpdates: {
        preferredTrainingCategory: selectedCategory,
        foodBudgetTier: budgetTier,
        voiceFeedbackEnabled: voiceFeedback,
      },
    });
    setStatusMessage(
      "Profile, nutrition targets, and workout parameters updated!"
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportData = () => {
    const json = exportUserDataJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aifitcore-export-${currentUser.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    deleteUserAccountData();
    router.push("/register");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Badge variant="lime">Section 21 • Profile, Privacy &amp; AI Configuration</Badge>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
          User Profile, Security &amp; Data Controls
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Update your biometrics, inspect server-side OpenRouter &amp; Supabase
          RLS configuration, or export/delete your private fitness data.
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 p-3.5 text-xs text-[#CCFF00] font-bold">
          ✓ {statusMessage}
        </div>
      )}

      {/* PROFILE & PREFERENCES EDITOR */}
      <Card className="p-6">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <User className="h-4 w-4 text-[#CCFF00]" />
            <h2 className="text-base font-bold">
              Athlete Profile &amp; Active Preferences
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Current Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Target Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Primary Fitness Goal</Label>
              <select
                value={selectedGoal}
                onChange={(e) =>
                  setSelectedGoal(e.target.value as FitnessGoalType)
                }
                className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
              >
                <option value="muscle_gain">Muscle Gain</option>
                <option value="fat_loss">Fat Loss</option>
                <option value="maintenance">Weight Maintenance</option>
                <option value="strength">Strength Development</option>
                <option value="general_fitness">General Fitness</option>
                <option value="endurance">Endurance Improvement</option>
              </select>
            </div>
            <div>
              <Label>Preferred Training Module</Label>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as TrainingCategory)
                }
                className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
              >
                <option value="gym">Gym Training</option>
                <option value="home">Home Workout</option>
                <option value="calisthenics">Calisthenics</option>
              </select>
            </div>
            <div>
              <Label>Food Budget Tier</Label>
              <select
                value={budgetTier}
                onChange={(e) =>
                  setBudgetTier(e.target.value as FoodBudgetTier)
                }
                className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
              >
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={voiceFeedback}
              onChange={(e) => setVoiceFeedback(e.target.checked)}
              className="accent-[#CCFF00]"
            />
            <span>
              Enable Browser Web Speech Voice Synthesis during AI Camera Trainer
              sessions
            </span>
          </label>

          <Button type="submit" variant="primary">
            <Save className="h-4 w-4" />
            Save Profile &amp; Recalculate Targets
          </Button>
        </form>
      </Card>

      {/* SERVER-SIDE AI & SUPABASE ARCHITECTURE STATUS */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[#CCFF00]" />
            <h2 className="text-base font-bold">
              OpenRouter AI &amp; Supabase Security Status
            </h2>
          </div>
          <Badge variant="emerald">Server-Side Protected Keys</Badge>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
            <span className="text-muted-foreground block">
              Supabase Database &amp; RLS
            </span>
            <span className="font-bold text-sm text-foreground mt-0.5 block">
              {isSupabaseLive
                ? "Connected (Live Supabase)"
                : "Local-First Vault + 25 SQL Migrations Ready"}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
            <span className="text-muted-foreground block">
              Configured Text/Coach Model
            </span>
            <span className="font-bold text-sm text-[#CCFF00] mt-0.5 block">
              {aiServerInfo?.models?.generalModel ?? "openai/gpt-4o-mini"}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
            <span className="text-muted-foreground block">
              Configured Food Vision Model
            </span>
            <span className="font-bold text-sm text-emerald-400 mt-0.5 block">
              {aiServerInfo?.models?.visionModel ?? "openai/gpt-4o-mini"}
            </span>
          </div>
        </div>
      </Card>

      {/* PASSWORD UPDATE & PRIVACY DATA EXPORT / DELETION */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#CCFF00]" />
            <h3 className="text-base font-bold">Change Account Password</h3>
          </div>
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5"
            />
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              const res = await updatePassword(newPassword);
              setStatusMessage(res.message);
              setNewPassword("");
            }}
          >
            Update Password
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#CCFF00]" />
            <h3 className="text-base font-bold">
              User Data Export &amp; Account Deletion
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Export your entire fitness history, workouts, nutrition logs, and
            body measurements as portable JSON, or permanently delete your
            records.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 text-[#CCFF00]" />
              Export All Data (JSON)
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4" />
              Delete Account Data
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
