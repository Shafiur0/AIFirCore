// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SUPABASE BROWSER CLIENT
// ============================================================================

import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url.startsWith("https://") &&
      !url.includes("your-project-id.supabase.co") &&
      !key.includes("your-supabase-anon")
  );
}

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
