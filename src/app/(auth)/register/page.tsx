"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — REGISTRATION PAGE (/register)
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, CheckCircle2, Lock, Mail, User } from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useFitnessBrain();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await signUp({ email, password, fullName });
      if (!res.success) {
        setError(res.error ?? "Failed to create account.");
      } else {
        router.push("/onboarding");
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00] text-black">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-xl font-black tracking-tight">
              AI FITNESS <span className="text-[#CCFF00]">BRAIN</span>
            </span>
          </Link>
          <p className="text-xs text-zinc-400">
            Create your account and proceed to your individualized fitness assessment
          </p>
        </div>

        <Card className="p-6 border-white/15 bg-[#0E1118]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  placeholder="e.g., Tanvir Ahmed"
                />
              </div>
            </div>

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
                  placeholder="tanvir@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Min 6 chars"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm</Label>
                <div className="relative mt-1.5">
                  <Lock className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Repeat"
                  />
                </div>
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
              {loading ? "Creating Account..." : "Register & Start Assessment"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#CCFF00]" />
              <span>Private fitness records protected by Row Level Security</span>
            </div>
            <p className="text-center pt-2">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#CCFF00] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
