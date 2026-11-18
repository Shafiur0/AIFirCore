// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — PROGRESSION & ANALYTICS API (/api/progress)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { evaluateExerciseProgression } from "@/services/progression/progression-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = evaluateExerciseProgression(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to evaluate progression" },
      { status: 400 }
    );
  }
}
