// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — DETERMINISTIC NUTRITION API (/api/nutrition)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  aggregateDailyNutrition,
  calculateNutritionTargets,
} from "@/lib/calculations/nutrition";
import { generatePersonalizedMealPlan } from "@/services/nutrition/food-catalog";
import { getTodayDateString } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, goal, preferences, entries = [], waterLogs = [] } = body;

    const targets = calculateNutritionTargets(profile, goal);
    const dailySummary = aggregateDailyNutrition({
      date: getTodayDateString(),
      entries,
      waterLogs,
      targets,
    });
    const meals = generatePersonalizedMealPlan({
      userId: profile.id,
      targets,
      preferences,
    });

    return NextResponse.json({
      targets,
      dailySummary,
      meals,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compute nutrition" },
      { status: 400 }
    );
  }
}
