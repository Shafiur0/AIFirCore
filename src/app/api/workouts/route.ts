// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — WORKOUTS & CATALOG API (/api/workouts)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  CALISTHENICS_SKILL_PATHWAYS,
  EXERCISE_CATALOG,
} from "@/services/workout/exercise-catalog";
import { generatePersonalizedWorkoutPlan } from "@/services/workout/workout-generator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const muscle = searchParams.get("muscle");

  let exercises = EXERCISE_CATALOG;
  if (category && category !== "all") {
    exercises = exercises.filter((e) => e.category === category);
  }
  if (muscle && muscle !== "all") {
    exercises = exercises.filter(
      (e) => e.primaryMuscle.toLowerCase() === muscle.toLowerCase()
    );
  }

  return NextResponse.json({
    exercises,
    pathways: CALISTHENICS_SKILL_PATHWAYS,
    totalCount: exercises.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = generatePersonalizedWorkoutPlan(body);
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate workout" },
      { status: 400 }
    );
  }
}
