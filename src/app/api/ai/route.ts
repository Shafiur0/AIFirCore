// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — UNIFIED SERVER-SIDE AI API ROUTE (/api/ai)
// Keeps OPENROUTER_API_KEY strictly server-side with rate-limiting & Zod checks
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  analyzeFitnessHistory,
  analyzeFoodImage,
  fitnessChat,
  generateMealPlan,
  generateNutritionAdvice,
  generateProgressSummary,
  generateWorkout,
  getAIUsageLogs,
  getConfiguredModels,
} from "@/lib/ai/openrouter";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function GET() {
  const models = getConfiguredModels();
  return NextResponse.json({
    status: "ok",
    models,
    recentUsage: getAIUsageLogs().slice(-10),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action as string;
    const userId = (body?.userId as string) || "anonymous";

    const rate = checkRateLimit(`ai:${userId}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded for expensive AI operations. Try again in ${Math.ceil(
            rate.resetInMs / 1000
          )}s.`,
        },
        { status: 429 }
      );
    }

    switch (action) {
      case "generateWorkout": {
        const plan = await generateWorkout(body.payload);
        return NextResponse.json({ plan });
      }
      case "generateMealPlan": {
        const result = await generateMealPlan(body.payload);
        return NextResponse.json(result);
      }
      case "fitnessChat": {
        const result = await fitnessChat(body.payload);
        return NextResponse.json(result);
      }
      case "analyzeFoodImage": {
        const result = await analyzeFoodImage(body.payload);
        return NextResponse.json(result);
      }
      case "analyzeFitnessHistory": {
        const result = await analyzeFitnessHistory(body.payload);
        return NextResponse.json(result);
      }
      case "generateNutritionAdvice": {
        const result = await generateNutritionAdvice(body.payload);
        return NextResponse.json(result);
      }
      case "generateProgressSummary": {
        const result = await generateProgressSummary(body.payload);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { error: `Unsupported AI action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Internal server error processing AI request",
      },
      { status: 500 }
    );
  }
}
