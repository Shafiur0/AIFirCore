"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — PRODUCT FEATURES ARCHITECTURE SHOWCASE (/features)
// ============================================================================

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  Camera,
  Dumbbell,
  Flame,
  HeartPulse,
  LineChart,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui/primitives";

export default function FeaturesPage() {
  const modules = [
    {
      title: "AI Camera Personal Trainer (MediaPipe Pose Landmarker)",
      badge: "Computer Vision",
      icon: Camera,
      href: "/trainer",
      points: [
        "Local 33-landmark pose extraction with Exponential Moving Average (EMA) smoothing",
        "6 dedicated stateful analyzers: Squat, Push-Up, Lunge, Plank, Bicep Curl, Shoulder Press",
        "Automatic rep counting with anti-bounce debounce & explicit rule-based form scoring",
        "Browser Web Speech synthesis for hands-free live voice coaching",
      ],
    },
    {
      title: "Three Connected Training Modules (Gym, Home & Calisthenics)",
      badge: "Training Intelligence",
      icon: Dumbbell,
      href: "/gym",
      points: [
        "Gym Training: Barbell, Dumbbell, Machine & Cable programs for Strength, Hypertrophy & Fat Loss",
        "Home Workout: Automatically filters routines to the exact equipment you own",
        "Calisthenics: Prerequisite-gated skill pathways from Wall Push-Ups to Bar Muscle-Ups",
      ],
    },
    {
      title: "Per-Exercise Progressive Overload & Adaptive Difficulty Engine",
      badge: "Progression Engine",
      icon: Flame,
      href: "/workouts",
      points: [
        "Tracks Level 1 (Beginner) to Level 5 (Expert) independently for each exercise",
        "Evaluates completion ratio, form score (>=82%), ROM, RPE, and recovery readiness",
        "Never progresses merely by elapsed days and never regresses on a single poor session",
      ],
    },
    {
      title: "AI Nutritionist, Bangladeshi Meal Planner & 4-Mode Calorie Brain",
      badge: "Nutrition Brain",
      icon: Utensils,
      href: "/nutrition",
      points: [
        "Deterministic Mifflin-St Jeor & Katch-McArdle BMR, TDEE, macro, fiber & hydration calculations",
        "Supports Bangladeshi staples (Rice/Bhat, Red Rice, Atta Roti, Rohu/Tilapia/Hilsa Fish, Chicken, Eggs, Dal, Sabzi, Tok Doi)",
        "4 logging modes: Manual Search, Natural Text, Voice Dictation & OpenRouter Vision Photo Upload with confirmation",
      ],
    },
    {
      title: "Recovery Intelligence & Long-Term Personal Memory",
      badge: "Biometric Memory",
      icon: HeartPulse,
      href: "/recovery",
      points: [
        "Daily Readiness Score (0-100) computed from sleep hours, sleep quality, soreness, fatigue & stress",
        "Automatically scales workout volume and rest periods when recovery is low",
        "Complete timeline of workouts, sets, form trends, meals, body weight, and measurements",
      ],
    },
    {
      title: "Context-Grounded AI Fitness Coach & Interactive Recharts Analytics",
      badge: "AI & Analytics",
      icon: Bot,
      href: "/ai-coach",
      points: [
        "Conversational AI coach grounded in your real remaining daily calories and workout logs",
        "Interactive Recharts charts for weight trend, form quality, macro adherence, and strength volume",
        "25-table normalized PostgreSQL schema with strict Row Level Security (RLS)",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#CCFF00]">
            <ArrowLeft className="h-4 w-4" />
            Back to Landing Page
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          <Badge variant="lime">Complete Platform Architecture</Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            16 Integrated Modules. 7 Intelligence Engines.
          </h1>
          <p className="text-zinc-400 max-w-3xl text-base">
            Explore every functional engine powering AI Fitness Brain (AIFitCore).
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Card key={idx} className="p-6 flex flex-col justify-between border-white/10">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="lime">{m.badge}</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-3">{m.title}</h2>
                  <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                    {m.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#CCFF00] font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={m.href}>
                  <Button variant="outline" size="sm" className="w-full">
                    Launch Module
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
