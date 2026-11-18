"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — 5-STEP ONBOARDING & BIOMETRIC ASSESSMENT (/onboarding)
// Collects Personal, Fitness, Goals, Training/Equipment & Nutrition Preferences
// ============================================================================

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Flame,
  ShieldAlert,
  Sparkles,
  User,
  Utensils,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import {
  ActivityLevel,
  BiologicalSex,
  FitnessExperienceLevel,
  FitnessGoalType,
  FoodBudgetTier,
  TrainingCategory,
} from "@/types/fitness";
import { calculateNutritionTargets } from "@/lib/calculations/nutrition";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  ProgressBar,
} from "@/components/ui/primitives";

const EQUIPMENT_OPTIONS = [
  { id: "none", label: "Bodyweight Only (No Equipment)" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "resistance-band", label: "Resistance Bands" },
  { id: "pullup-bar", label: "Pull-Up Bar" },
  { id: "dip-bars", label: "Parallel Dip Bars" },
  { id: "barbell", label: "Barbell & Plates" },
  { id: "bench", label: "Adjustable Bench" },
  { id: "cable-machine", label: "Cable Machine" },
  { id: "machine", label: "Full Commercial Gym Machines" },
];

const INJURY_OPTIONS = [
  "Knee Discomfort",
  "Shoulder Impingement",
  "Lower Back Sensitivity",
  "Wrist Stiffness",
  "Ankle Mobility Limitation",
];

const ALLERGY_OPTIONS = ["Dairy / Lactose", "Eggs", "Fish / Seafood", "Peanuts / Tree Nuts", "Gluten"];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, goal, preferences, saveOnboardingAndProfile } =
    useFitnessBrain();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [savedNotice, setSavedNotice] = useState(false);

  // Step 1: Personal Biometrics
  const [fullName, setFullName] = useState(currentUser?.fullName ?? "Arif Rahman");
  const [ageYears, setAgeYears] = useState(currentUser?.ageYears ?? 26);
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>(
    currentUser?.biologicalSex ?? "male"
  );
  const [heightCm, setHeightCm] = useState(currentUser?.heightCm ?? 175);
  const [currentWeightKg, setCurrentWeightKg] = useState(
    currentUser?.currentWeightKg ?? 74.5
  );
  const [targetWeightKg, setTargetWeightKg] = useState(
    currentUser?.targetWeightKg ?? 71.0
  );
  const [bodyFatPct, setBodyFatPct] = useState<string>(
    currentUser?.bodyFatPct ? String(currentUser.bodyFatPct) : "16.5"
  );

  // Step 2: Fitness Information & Voluntary Limitations
  const [fitnessExperience, setFitnessExperience] =
    useState<FitnessExperienceLevel>(
      currentUser?.fitnessExperience ?? "intermediate"
    );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    currentUser?.activityLevel ?? "moderately_active"
  );
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState(
    currentUser?.workoutDaysPerWeek ?? 4
  );
  const [preferredWorkoutDurationMin, setPreferredWorkoutDurationMin] =
    useState(currentUser?.preferredWorkoutDurationMin ?? 45);
  const [injuriesLimitations, setInjuriesLimitations] = useState<string[]>(
    currentUser?.injuriesLimitations ?? []
  );
  const [medicalConditionsText, setMedicalConditionsText] = useState(
    (currentUser?.medicalConditions ?? []).join(", ")
  );
  const [isPregnantOrNursing, setIsPregnantOrNursing] = useState(
    Boolean(currentUser?.isPregnantOrNursing)
  );
  const [hasEatingDisorderHistory, setHasEatingDisorderHistory] = useState(
    Boolean(currentUser?.hasEatingDisorderHistory)
  );

  // Step 3: Fitness Goals
  const [primaryGoal, setPrimaryGoal] = useState<FitnessGoalType>(
    goal ?? "muscle_gain"
  );

  // Step 4: Training Module & Owned Equipment
  const [preferredCategory, setPreferredCategory] = useState<TrainingCategory>(
    preferences?.preferredTrainingCategory ?? "calisthenics"
  );
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(
    preferences?.availableEquipment ?? ["none", "dumbbells", "pullup-bar"]
  );

  // Step 5: Nutrition & Cultural Food Preferences
  const [dietaryPreference, setDietaryPreference] = useState(
    preferences?.dietaryPreference ?? "omnivore"
  );
  const [allergies, setAllergies] = useState<string[]>(
    preferences?.allergies ?? []
  );
  const [foodBudgetTier, setFoodBudgetTier] = useState<FoodBudgetTier>(
    preferences?.foodBudgetTier ?? "moderate"
  );
  const [preferredMealsText, setPreferredMealsText] = useState(
    (
      preferences?.preferredMeals ?? [
        "Atta Roti & Boiled Eggs",
        "Deshi Rice, Rohu Fish & Masoor Dal",
      ]
    ).join(", ")
  );

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Live preview of deterministic metabolic targets
  const liveTargets = useMemo(() => {
    const bf = parseFloat(bodyFatPct);
    return calculateNutritionTargets(
      {
        id: currentUser?.id ?? "preview",
        ageYears: Number(ageYears) || 25,
        biologicalSex,
        heightCm: Number(heightCm) || 170,
        currentWeightKg: Number(currentWeightKg) || 70,
        targetWeightKg: Number(targetWeightKg) || 70,
        bodyFatPct: !isNaN(bf) && bf >= 4 && bf <= 60 ? bf : undefined,
        activityLevel,
        workoutDaysPerWeek: Number(workoutDaysPerWeek) || 4,
        preferredWorkoutDurationMin: Number(preferredWorkoutDurationMin) || 45,
        medicalConditions: medicalConditionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isPregnantOrNursing,
        hasEatingDisorderHistory,
      },
      primaryGoal
    );
  }, [
    currentUser?.id,
    ageYears,
    biologicalSex,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    bodyFatPct,
    activityLevel,
    workoutDaysPerWeek,
    preferredWorkoutDurationMin,
    medicalConditionsText,
    isPregnantOrNursing,
    hasEatingDisorderHistory,
    primaryGoal,
  ]);

  const handleCompleteOnboarding = () => {
    const bf = parseFloat(bodyFatPct);
    saveOnboardingAndProfile({
      profileUpdates: {
        fullName: fullName.trim() || "Athlete",
        ageYears: Number(ageYears) || 25,
        biologicalSex,
        heightCm: Number(heightCm) || 170,
        currentWeightKg: Number(currentWeightKg) || 70,
        targetWeightKg: Number(targetWeightKg) || 70,
        bodyFatPct: !isNaN(bf) && bf >= 4 && bf <= 60 ? bf : undefined,
        fitnessExperience,
        activityLevel,
        workoutDaysPerWeek: Number(workoutDaysPerWeek) || 4,
        preferredWorkoutDurationMin: Number(preferredWorkoutDurationMin) || 45,
        injuriesLimitations,
        medicalConditions: medicalConditionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isPregnantOrNursing,
        hasEatingDisorderHistory,
        onboardingCompleted: true,
      },
      goal: primaryGoal,
      preferencesUpdates: {
        preferredTrainingCategory: preferredCategory,
        availableEquipment:
          availableEquipment.length > 0 ? availableEquipment : ["none"],
        dietaryPreference,
        allergies,
        foodBudgetTier,
        preferredMeals: preferredMealsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    });
    setSavedNotice(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 650);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lime">Individualized Assessment Wizard</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Calibrate Your AI Fitness Brain Profile
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Every recommendation, workout set, and calorie calculation adapts to
            the data you configure below.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#CCFF00]">
            Step {step} of 5
          </span>
          <ProgressBar value={step * 20} className="w-36 mt-1" />
        </div>
      </div>

      {/* Step Indicator Tabs */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { num: 1 as const, label: "1. Biometrics", icon: User },
          { num: 2 as const, label: "2. Fitness", icon: Activity },
          { num: 3 as const, label: "3. Goal", icon: Flame },
          { num: 4 as const, label: "4. Equipment", icon: Dumbbell },
          { num: 5 as const, label: "5. Nutrition", icon: Utensils },
        ].map((t) => {
          const Icon = t.icon;
          const active = step === t.num;
          return (
            <button
              key={t.num}
              type="button"
              onClick={() => setStep(t.num)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-xs font-bold transition ${
                active
                  ? "bg-[#CCFF00] text-black border-[#CCFF00]"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      <Card className="p-6 sm:p-8">
        {/* STEP 1: PERSONAL INFORMATION */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold">
                Step 1: Personal &amp; Biometric Information
              </h2>
              <p className="text-xs text-muted-foreground">
                Used exclusively for Mifflin-St Jeor / Katch-McArdle resting
                metabolic estimation.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label>Age (Years)</Label>
                <Input
                  type="number"
                  min={12}
                  max={100}
                  value={ageYears}
                  onChange={(e) => setAgeYears(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Sex (for Metabolic Formula Constant)</Label>
                <select
                  value={biologicalSex}
                  onChange={(e) =>
                    setBiologicalSex(e.target.value as BiologicalSex)
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm text-foreground"
                >
                  <option value="male">Male (+5 kcal Mifflin constant)</option>
                  <option value="female">
                    Female (-161 kcal Mifflin constant)
                  </option>
                  <option value="other">
                    Other / Midpoint (-78 kcal constant)
                  </option>
                  <option value="prefer_not_to_say">
                    Prefer Not to Say (Midpoint constant)
                  </option>
                </select>
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  min={110}
                  max={240}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Current Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={25}
                  max={300}
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Target Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={25}
                  max={300}
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>
                  Optional Body Fat % (Activates Katch-McArdle Lean-Mass BMR
                  Formula)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min={4}
                  max={60}
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(e.target.value)}
                  className="mt-1.5"
                  placeholder="Leave blank if unknown to use Mifflin-St Jeor"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FITNESS EXPERIENCE & LIMITATIONS */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold">
                Step 2: Fitness Background, Schedule &amp; Safety Disclosures
              </h2>
              <p className="text-xs text-muted-foreground">
                Voluntarily disclose any joint limitations so the Workout
                Generator excludes contraindicated lifts.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Current Fitness Experience</Label>
                <select
                  value={fitnessExperience}
                  onChange={(e) =>
                    setFitnessExperience(
                      e.target.value as FitnessExperienceLevel
                    )
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value="beginner">
                    Level 1: Beginner — Foundation
                  </option>
                  <option value="novice">
                    Level 2: Novice — Building Strength
                  </option>
                  <option value="intermediate">
                    Level 3: Intermediate — Development
                  </option>
                  <option value="advanced">
                    Level 4: Advanced — Performance
                  </option>
                  <option value="expert">
                    Level 5: Expert — Advanced Skills
                  </option>
                </select>
              </div>
              <div>
                <Label>Daily Baseline Physical Activity</Label>
                <select
                  value={activityLevel}
                  onChange={(e) =>
                    setActivityLevel(e.target.value as ActivityLevel)
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value="sedentary">Sedentary (Desk job, 1.2x)</option>
                  <option value="lightly_active">
                    Lightly Active (1–3 days/wk, 1.375x)
                  </option>
                  <option value="moderately_active">
                    Moderately Active (3–5 days/wk, 1.55x)
                  </option>
                  <option value="very_active">
                    Very Active (6–7 days/wk, 1.725x)
                  </option>
                  <option value="extra_active">
                    Extra Active (2x daily / physical labor, 1.9x)
                  </option>
                </select>
              </div>
              <div>
                <Label>Workout Frequency (Days / Week)</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={workoutDaysPerWeek}
                  onChange={(e) =>
                    setWorkoutDaysPerWeek(Number(e.target.value))
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Available Workout Time (Minutes / Session)</Label>
                <Input
                  type="number"
                  min={15}
                  max={120}
                  step={5}
                  value={preferredWorkoutDurationMin}
                  onChange={(e) =>
                    setPreferredWorkoutDurationMin(Number(e.target.value))
                  }
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Voluntary Exercise Limitations or Joint Concerns</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {INJURY_OPTIONS.map((inj) => {
                  const selected = injuriesLimitations.includes(inj);
                  return (
                    <button
                      key={inj}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          injuriesLimitations,
                          setInjuriesLimitations,
                          inj
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        selected
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-secondary/40 text-muted-foreground border-border"
                      }`}
                    >
                      {inj}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Optional Medical Conditions (Voluntary Disclosure)</Label>
              <Input
                value={medicalConditionsText}
                onChange={(e) => setMedicalConditionsText(e.target.value)}
                className="mt-1.5"
                placeholder="e.g., Hypertension, Type 2 Diabetes (or leave blank)"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/30 p-3 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPregnantOrNursing}
                  onChange={(e) => setIsPregnantOrNursing(e.target.checked)}
                  className="rounded accent-[#CCFF00]"
                />
                <span>
                  Currently pregnant or nursing (Disables calorie deficits)
                </span>
              </label>
              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/30 p-3 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEatingDisorderHistory}
                  onChange={(e) =>
                    setHasEatingDisorderHistory(e.target.checked)
                  }
                  className="rounded accent-[#CCFF00]"
                />
                <span>
                  Eating-disorder concern (Disables restrictive calorie targets)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: FITNESS GOALS */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold">Step 3: Primary Fitness Goal</h2>
              <p className="text-xs text-muted-foreground">
                Determines your rep ranges, rest periods, protein g/kg ratio,
                and personalized calorie surplus or deficit.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(
                [
                  {
                    id: "muscle_gain",
                    title: "Muscle Gain",
                    desc: "Modest +12% calorie surplus, 2.0g/kg protein, 8–12 hypertrophy rep focus.",
                  },
                  {
                    id: "fat_loss",
                    title: "Fat Loss",
                    desc: "Safe -18% calorie deficit, 2.1g/kg lean-mass protection protein, high metabolic density.",
                  },
                  {
                    id: "maintenance",
                    title: "Weight Maintenance",
                    desc: "Isocaloric TDEE balance for body recomposition and sustainable daily energy.",
                  },
                  {
                    id: "strength",
                    title: "Strength Development",
                    desc: "Progressive neural overload, lower rep ranges (5–8), longer 90–120s rest periods.",
                  },
                  {
                    id: "general_fitness",
                    title: "General Fitness",
                    desc: "Balanced mobility, cardiovascular health, and full-body movement quality.",
                  },
                  {
                    id: "endurance",
                    title: "Endurance Improvement",
                    desc: "Higher repetition stamina, shorter rest windows, and carbohydrate glycogen support.",
                  },
                ] as const
              ).map((g) => {
                const active = primaryGoal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setPrimaryGoal(g.id)}
                    className={`text-left rounded-2xl border p-4 transition ${
                      active
                        ? "border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_24px_-8px_rgba(204,255,0,0.4)]"
                        : "border-border bg-secondary/30 hover:border-border/90"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm">{g.title}</span>
                      {active && (
                        <CheckCircle2 className="h-4 w-4 text-[#CCFF00]" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {g.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: TRAINING PREFERENCES & OWNED EQUIPMENT */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold">
                Step 4: Training Environment &amp; Available Equipment
              </h2>
              <p className="text-xs text-muted-foreground">
                The AI Workout Generator strictly filters exercises to match the
                equipment you actually have access to.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5">
              {(
                [
                  {
                    id: "gym",
                    title: "Gym Training",
                    desc: "Barbells, Dumbbells, Cables & Machines",
                  },
                  {
                    id: "home",
                    title: "Home Workout",
                    desc: "Synced to your home equipment",
                  },
                  {
                    id: "calisthenics",
                    title: "Calisthenics",
                    desc: "Progressive bodyweight skill trees",
                  },
                ] as const
              ).map((cat) => {
                const active = preferredCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPreferredCategory(cat.id)}
                    className={`text-left rounded-2xl border p-4 transition ${
                      active
                        ? "border-[#CCFF00] bg-[#CCFF00]/10"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <p className="font-bold text-sm">{cat.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cat.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div>
              <Label>Select All Equipment You Own or Have Access To</Label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
                {EQUIPMENT_OPTIONS.map((eq) => {
                  const selected = availableEquipment.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          availableEquipment,
                          setAvailableEquipment,
                          eq.id
                        )
                      }
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                        selected
                          ? "border-[#CCFF00] bg-[#CCFF00]/15 text-foreground"
                          : "border-border bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      <span>{eq.label}</span>
                      {selected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#CCFF00]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: NUTRITION PREFERENCES & LIVE METABOLIC PREVIEW */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold">
                Step 5: Nutrition Preferences &amp; Calculated Metabolic Targets
              </h2>
              <p className="text-xs text-muted-foreground">
                Supports Bangladeshi staples (Rice/Bhat, Roti, Eggs, Chicken,
                Rohu/Tilapia Fish, Masoor Dal, Sabzi, Milk, Fruits) and global
                foods.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Dietary Pattern</Label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value="omnivore">
                    Omnivore / Halal (Chicken, Fish, Eggs, Dal, Rice, Roti)
                  </option>
                  <option value="pescatarian">
                    Pescatarian (Fish, Eggs, Dairy, Legumes)
                  </option>
                  <option value="vegetarian">
                    Vegetarian (Dal, Chola, Eggs/Dairy, Sabzi)
                  </option>
                  <option value="vegan">
                    Plant-Based / Vegan (Dal, Chickpeas, Rice, Vegetables)
                  </option>
                </select>
              </div>

              <div>
                <Label>Daily Food Budget Tier</Label>
                <select
                  value={foodBudgetTier}
                  onChange={(e) =>
                    setFoodBudgetTier(e.target.value as FoodBudgetTier)
                  }
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm"
                >
                  <option value="budget">
                    Budget-Friendly (Eggs, Masoor Dal, Tilapia, Rice, Roti,
                    Chola)
                  </option>
                  <option value="moderate">
                    Moderate (Rohu Fish, Deshi Chicken, Milk, Tok Doi, Oats)
                  </option>
                  <option value="premium">
                    Premium (Hilsa/Ilish, Grilled Breast, Whey Isolate, Almonds)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <Label>Food Allergies or Exclusions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALLERGY_OPTIONS.map((al) => {
                  const selected = allergies.includes(al);
                  return (
                    <button
                      key={al}
                      type="button"
                      onClick={() => toggleItem(allergies, setAllergies, al)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        selected
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-secondary/40 text-muted-foreground border-border"
                      }`}
                    >
                      {al}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Preferred Everyday Meals</Label>
              <Input
                value={preferredMealsText}
                onChange={(e) => setPreferredMealsText(e.target.value)}
                className="mt-1.5"
                placeholder="e.g., Atta Roti & Eggs, Red Rice with Fish Curry & Dal"
              />
            </div>

            {/* LIVE CALCULATED METABOLIC PREVIEW */}
            <div className="rounded-2xl border border-[#CCFF00]/40 bg-[#CCFF00]/5 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#CCFF00]" />
                  <h3 className="text-sm font-bold">
                    Your Live Individualized Metabolic Prescription (
                    {liveTargets.formulaUsed})
                  </h3>
                </div>
                <Badge variant="lime">Deterministic Estimate</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-background/80 p-3 border border-border">
                  <span className="text-muted-foreground block">
                    Estimated BMR
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {liveTargets.bmrKcal} kcal
                  </span>
                </div>
                <div className="rounded-xl bg-background/80 p-3 border border-border">
                  <span className="text-muted-foreground block">
                    Estimated TDEE
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {liveTargets.tdeeKcal} kcal
                  </span>
                </div>
                <div className="rounded-xl bg-background/80 p-3 border border-[#CCFF00]/40">
                  <span className="text-muted-foreground block">
                    Daily Goal Target
                  </span>
                  <span className="text-lg font-black text-[#CCFF00]">
                    {liveTargets.dailyCalorieTarget} kcal
                  </span>
                </div>
                <div className="rounded-xl bg-background/80 p-3 border border-border">
                  <span className="text-muted-foreground block">
                    Macro Split (P/C/F)
                  </span>
                  <span className="text-sm font-black text-emerald-400">
                    {liveTargets.proteinTargetG}g / {liveTargets.carbsTargetG}g /{" "}
                    {liveTargets.fatTargetG}g
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {liveTargets.formulaAssumptions}
              </p>

              {liveTargets.safetyWarnings.length > 1 && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-3 space-y-1">
                  {liveTargets.safetyWarnings.slice(1).map((w, i) => (
                    <p
                      key={i}
                      className="text-xs text-amber-300 flex items-start gap-2"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER NAVIGATION BUTTONS */}
        <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous Step
          </Button>

          {step < 5 ? (
            <Button
              type="button"
              variant="primary"
              onClick={() =>
                setStep((s) => Math.min(5, s + 1) as 1 | 2 | 3 | 4 | 5)
              }
            >
              Continue to Step {step + 1}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleCompleteOnboarding}
            >
              <CheckCircle2 className="h-4 w-4" />
              {savedNotice
                ? "Profile Saved! Redirecting..."
                : "Save Profile & Generate Personalized Plan"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
