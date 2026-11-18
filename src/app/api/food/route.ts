// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — FOOD SEARCH & PARSER API (/api/food)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  parseNaturalFoodDescription,
  searchFoodCatalog,
} from "@/services/nutrition/food-catalog";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const cuisine = searchParams.get("cuisine") || "all";

  const results = searchFoodCatalog(query, cuisine);
  return NextResponse.json({ items: results });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const description = (body?.description as string) || "";
    const candidates = parseNaturalFoodDescription(description);
    return NextResponse.json({ candidates });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse food text" },
      { status: 400 }
    );
  }
}
