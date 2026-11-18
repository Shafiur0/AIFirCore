"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — FORGOT & RESET PASSWORD PAGE (/forgot-password)
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { Button, Card, Input, Label } from "@/components/ui/primitives";

export default function ForgotPasswordPage() {
  const { requestPasswordReset, updatePassword } = useFitnessBrain();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [message, setMessage] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await requestPasswordReset(email);
    setMessage(res.message);
    setStep("reset");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updatePassword(newPassword);
    setMessage(res.message);
    if (res.success) {
      setStep("done");
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
          <p className="text-xs text-zinc-400">Account Recovery &amp; Password Reset</p>
        </div>

        <Card className="p-6 border-white/15 bg-[#0E1118]">
          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <Label htmlFor="email">Account Email Address</Label>
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
              <Button type="submit" variant="primary" className="w-full">
                Send Password Reset Link
              </Button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 p-3 text-xs text-[#CCFF00]">
                {message}
              </div>
              <div>
                <Label htmlFor="newPassword">Set New Password</Label>
                <div className="relative mt-1.5">
                  <KeyRound className="h-4 w-4 text-zinc-400 absolute left-3.5 top-3" />
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter new password (min 6 chars)"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full">
                Confirm New Password
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center py-2">
              <CheckCircle2 className="h-10 w-10 text-[#CCFF00] mx-auto" />
              <p className="text-sm font-semibold text-white">{message}</p>
              <Link href="/login" className="block">
                <Button variant="primary" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#CCFF00]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
