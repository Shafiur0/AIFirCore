"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SIGN IN PAGE (/login)
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { Badge, Button, Card, Input, Label } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isSupabaseLive } = useFitnessBrain();
  const [email, setEmail] = useState("athlete@aifitcore.io");
  const [password, setPassword] = useState("AIFitCore2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn({ email, password });
      if (!res.success) {
        setError(res.error ?? "Authentication failed.");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00] text-black shadow-[0_0_24px_-4px_rgba(204,255,0,0.6)]">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-xl font-black tracking-tight">
              AI FITNESS <span className="text-[#CCFF00]">BRAIN</span>
            </span>
          </Link>
          <p className="text-xs text-zinc-400">
            Sign in to access your private, RLS-isolated fitness vault
          </p>
        </div>

        <Card className="p-6 border-white/15 bg-[#0E1118]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#CCFF00] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In to AI Fitness Brain"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-zinc-300">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#CCFF00] flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pre-Configured Athlete Account
                </span>
                <Badge variant="outline">Ready</Badge>
              </div>
              <p className="text-[11px] text-zinc-400">
                Email: <code className="text-white">athlete@aifitcore.io</code> •
                Pass: <code className="text-white">AIFitCore2026!</code>
              </p>
            </div>

            <p className="text-center text-xs text-zinc-400">
              New to AI Fitness Brain?{" "}
              <Link
                href="/register"
                className="font-bold text-[#CCFF00] hover:underline"
              >
                Create your personalized account
              </Link>
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-[#CCFF00]" />
          <span>
            {isSupabaseLive
              ? "Connected to Supabase Auth & RLS PostgreSQL"
              : "Protected by Per-User Isolated Session & RLS Semantics"}
          </span>
        </div>
      </div>
    </div>
  );
}
