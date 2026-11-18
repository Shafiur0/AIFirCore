"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SECTION 13: AI NUTRITION & DAILY DIET PLANNER (/nutrition)
// BMR, TDEE, Macros, Fiber, Hydration, Safety Guardrails & Bangladeshi/Global Meal Planner
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Apple,
  CheckCircle2,
  Droplets,
  Edit3,
  Flame,
  Info,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { PlannedMeal } from "@/types/fitness";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Modal,
} from "@/components/ui/primitives";

export default function NutritionPlannerPage() {
  const {
    currentUser,
    goal,
    preferences,
    nutritionTargets,
    plannedMeals,
    regenerateDailyMealPlan,
    customizePlannedMeal,
    addFoodEntry,
  } = useFitnessBrain();

  const [isGeneratingMeals, setIsGeneratingMeals] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editItemsText, setEditItemsText] = useState("");
  const [editCalories, setEditCalories] = useState(500);
  const [editProtein, setEditProtein] = useState(35);
  const [editCarbs, setEditCarbs] = useState(55);
  const [editFat, setEditFat] = useState(15);
  const [loggedBanner, setLoggedBanner] = useState<string | null>(null);

  if (!currentUser || !nutritionTargets) {
    return null;
  }

  const handleRegenerateWithAi = async () => {
    setIsGeneratingMeals(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateMealPlan",
          userId: currentUser.id,
          payload: {
            userId: currentUser.id,
            targets: nutritionTargets,
            preferences,
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.meals) && data.meals.length > 0) {
          regenerateDailyMealPlan(data.meals);
          return;
        }
      }
      regenerateDailyMealPlan();
    } finally {
      setIsGeneratingMeals(false);
    }
  };

  const openEditModal = (meal: PlannedMeal) => {
    setEditingMeal(meal);
    setEditTitle(meal.title);
    setEditItemsText(meal.itemsSummary.join("\n"));
    setEditCalories(meal.totalCalories);
    setEditProtein(meal.proteinG);
    setEditCarbs(meal.carbsG);
    setEditFat(meal.fatG);
  };

  const handleSaveCustomMeal = () => {
    if (!editingMeal) return;
    customizePlannedMeal(editingMeal.id, {
      title: editTitle,
      itemsSummary: editItemsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      totalCalories: Number(editCalories) || editingMeal.totalCalories,
      proteinG: Number(editProtein) || editingMeal.proteinG,
      carbsG: Number(editCarbs) || editingMeal.carbsG,
      fatG: Number(editFat) || editingMeal.fatG,
    });
    setEditingMeal(null);
  };

  const handleLogMealToTracker = (meal: PlannedMeal) => {
    addFoodEntry({
      mealType: meal.mealType,
      foodName: meal.title,
      entryMethod: "manual",
      portionGrams: 350,
      servings: 1,
      caloriesKcal: meal.totalCalories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      fiberG: meal.fiberG,
      userConfirmed: true,
    });
    setLoggedBanner(
      `Logged "${meal.title}" (${meal.totalCalories} kcal, ${meal.proteinG}g protein) to today's Food & Calorie Brain!`
    );
    setTimeout(() => setLoggedBanner(null), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald">Section 13 • AI Nutritionist &amp; Metabolic Engine</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            AI Nutrition &amp; Daily Diet Planner
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Deterministic BMR/TDEE calculations paired with customizable
            Bangladeshi &amp; international meal plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isGeneratingMeals}
            onClick={handleRegenerateWithAi}
          >
            <RefreshCw className="h-4 w-4" />
            {isGeneratingMeals ? "Generating Meals..." : "Regenerate Meal Plan"}
          </Button>
          <Link href="/food-tracker">
            <Button variant="primary">
              <Apple className="h-4 w-4" />
              Open Food &amp; Calorie Tracker
            </Button>
          </Link>
        </div>
      </div>

      {loggedBanner && (
        <div className="rounded-xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 p-3.5 text-xs text-[#CCFF00] font-semibold flex items-center justify-between">
          <span>{loggedBanner}</span>
          <Link href="/food-tracker" className="underline">
            View Tracker →
          </Link>
        </div>
      )}

      {/* DETERMINISTIC METABOLIC & MACRO TARGETS GRID */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">
                Your Individualized Energy &amp; Nutrient Targets
              </h2>
              <Badge variant="lime">Formula: {nutritionTargets.formulaUsed}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {nutritionTargets.formulaAssumptions}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            Goal: {goal.replace("_", " ")} (
            {nutritionTargets.goalAdjustmentKcal >= 0
              ? `+${nutritionTargets.goalAdjustmentKcal}`
              : nutritionTargets.goalAdjustmentKcal}{" "}
            kcal/day)
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Est. BMR
            </span>
            <span className="text-lg font-black">
              {nutritionTargets.bmrKcal}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              kcal/day
            </span>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Est. TDEE
            </span>
            <span className="text-lg font-black">
              {nutritionTargets.tdeeKcal}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              kcal/day
            </span>
          </div>

          <div className="rounded-xl border border-[#CCFF00]/40 bg-[#CCFF00]/10 p-3">
            <span className="text-[10px] uppercase font-bold text-[#CCFF00] block">
              Daily Target
            </span>
            <span className="text-lg font-black text-[#CCFF00]">
              {nutritionTargets.dailyCalorieTarget}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              kcal/day
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              Protein
            </span>
            <span className="text-lg font-black text-emerald-400">
              {nutritionTargets.proteinTargetG}g
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {nutritionTargets.proteinTargetG * 4} kcal
            </span>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Carbs
            </span>
            <span className="text-lg font-black">
              {nutritionTargets.carbsTargetG}g
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {nutritionTargets.carbsTargetG * 4} kcal
            </span>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Fats
            </span>
            <span className="text-lg font-black text-amber-300">
              {nutritionTargets.fatTargetG}g
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {nutritionTargets.fatTargetG * 9} kcal
            </span>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Dietary Fiber
            </span>
            <span className="text-lg font-black">
              {nutritionTargets.fiberTargetG}g
            </span>
            <span className="text-[10px] text-muted-foreground block">
              14g / 1000 kcal
            </span>
          </div>

          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">
              Hydration
            </span>
            <span className="text-lg font-black text-sky-400">
              {nutritionTargets.waterTargetMl}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              ml / day
            </span>
          </div>
        </div>

        {/* CLINICAL & SAFETY WARNINGS */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-1.5 text-xs">
          {nutritionTargets.safetyWarnings.map((warn, idx) => (
            <div key={idx} className="flex items-start gap-2 text-muted-foreground">
              <Info className="h-4 w-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* DAILY MEAL PLANNER (BREAKFAST, LUNCH, SNACKS, DINNER) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">
              Personalized Daily Meal Plan (Bangladeshi &amp; Global Staples)
            </h2>
            <p className="text-xs text-muted-foreground">
              Tailored to your{" "}
              <strong className="text-foreground capitalize">
                {preferences?.foodBudgetTier ?? "moderate"}
              </strong>{" "}
              budget and{" "}
              <strong className="text-foreground capitalize">
                {preferences?.dietaryPreference ?? "omnivore"}
              </strong>{" "}
              preferences. Click Customize to edit any meal.
            </p>
          </div>
          <Badge variant="lime">
            Total Plan:{" "}
            {plannedMeals.reduce((s, m) => s + m.totalCalories, 0)} kcal •{" "}
            {plannedMeals.reduce((s, m) => s + m.proteinG, 0)}g Protein
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {plannedMeals.map((meal) => (
            <Card
              key={meal.id}
              className="p-5 flex flex-col justify-between hover:border-[#CCFF00]/50 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="lime" className="uppercase">
                      {meal.mealType}
                    </Badge>
                    {meal.isCustomized && (
                      <Badge variant="emerald">User Customized</Badge>
                    )}
                  </div>
                  <span className="text-sm font-black text-[#CCFF00]">
                    {meal.totalCalories} kcal
                  </span>
                </div>

                <h3 className="text-base font-bold">{meal.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {meal.description}
                </p>

                <ul className="space-y-1.5 rounded-xl bg-secondary/40 p-3 text-xs">
                  {meal.itemsSummary.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#CCFF00] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                  <div className="rounded-lg bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      Protein
                    </span>
                    <span className="font-bold text-emerald-400">
                      {meal.proteinG}g
                    </span>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      Carbs
                    </span>
                    <span className="font-bold">{meal.carbsG}g</span>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      Fat
                    </span>
                    <span className="font-bold text-amber-300">
                      {meal.fatG}g
                    </span>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      Fiber
                    </span>
                    <span className="font-bold">{meal.fiberG}g</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => openEditModal(meal)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Customize Meal
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 text-xs"
                  onClick={() => handleLogMealToTracker(meal)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log to Daily Intake
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CUSTOMIZE MEAL MODAL */}
      <Modal
        isOpen={Boolean(editingMeal)}
        onClose={() => setEditingMeal(null)}
        title={`Customize ${editingMeal?.mealType?.toUpperCase() ?? "Meal"}`}
        subtitle="Modify ingredients, Bangladeshi/global food swaps, and macro targets."
      >
        <div className="space-y-4">
          <div>
            <Label>Meal Title</Label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Meal Items (One item per line)</Label>
            <textarea
              rows={4}
              value={editItemsText}
              onChange={(e) => setEditItemsText(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/50 p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>Calories (kcal)</Label>
              <Input
                type="number"
                value={editCalories}
                onChange={(e) => setEditCalories(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Protein (g)</Label>
              <Input
                type="number"
                value={editProtein}
                onChange={(e) => setEditProtein(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Carbs (g)</Label>
              <Input
                type="number"
                value={editCarbs}
                onChange={(e) => setEditCarbs(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Fat (g)</Label>
              <Input
                type="number"
                value={editFat}
                onChange={(e) => setEditFat(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingMeal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCustomMeal}>
              Save Customized Meal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
