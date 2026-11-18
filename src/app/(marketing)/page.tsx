"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — PREMIUM LANDING PAGE WITH LIVE WORKOUT VIDEO
// Includes full-bleed Hero Workout Video Backdrop, Live Telemetry Video + CV Overlay
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  Camera,
  CheckCircle2,
  Dumbbell,
  Flame,
  History,
  Home,
  Pause,
  Play,
  Sparkles,
  TrendingUp,
  Utensils,
  Video,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui/primitives";

export default function LandingPage() {
  const [demoExercise, setDemoExercise] = useState<"squat" | "pushup" | "plank">(
    "squat"
  );
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(true);
  const [activeHeroClip, setActiveHeroClip] = useState<"gym" | "pushup">("gym");
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  // Live animated joint angle oscillation for the hero telemetry preview
  const [animPhase, setAnimPhase] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const loop = (now: number) => {
      const t = (now - start) / 1000;
      setAnimPhase((Math.sin(t * 2.2) + 1) / 2); // 0..1 smooth cycle
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggleHeroVideo = () => {
    const vid = heroVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setHeroVideoPlaying(true);
    } else {
      vid.pause();
      setHeroVideoPlaying(false);
    }
  };

  const switchHeroClip = (clip: "gym" | "pushup") => {
    setActiveHeroClip(clip);
    setHeroVideoPlaying(true);
  };

  const liveKneeAngle = (88 + animPhase * 68).toFixed(1);
  const liveFormScore = Math.round(92 + Math.sin(animPhase * Math.PI) * 5);
  const hipDropY = Math.round(animPhase * 22);

  const cvDemoData = {
    squat: {
      name: "Bodyweight Squat (SquatAnalyzer)",
      phase: "BOTTOM → ASCENDING",
      angle: "92.4° Knee Flexion",
      secondary: "24.1° Trunk Inclination",
      rom: 96,
      score: 94,
      reps: "12 / 12 Good Reps",
      feedback: "Excellent repetition — full parallel depth with aligned knees.",
      cameraView: "45° Diagonal or Side View",
    },
    pushup: {
      name: "Standard Push-Up (PushUpAnalyzer)",
      phase: "BOTTOM POSITION",
      angle: "89.0° Elbow Flexion",
      secondary: "174.2° Shoulder-Hip-Ankle Line",
      rom: 95,
      score: 92,
      reps: "10 / 10 Good Reps",
      feedback: "Keep your back straight — rigid hollow-body plank maintained.",
      cameraView: "Side Profile at Floor Height",
    },
    plank: {
      name: "Forearm Plank (PlankAnalyzer)",
      phase: "HOLDING (ISOMETRIC)",
      angle: "176.5° Spinal Collinearity",
      secondary: "45.0s Active Hold",
      rom: 100,
      score: 96,
      reps: "45s / 45s Target Hold",
      feedback: "Maintain proper alignment — zero hip sag detected.",
      cameraView: "Side Profile View",
    },
  }[demoExercise];

  return (
    <div className="min-h-screen bg-[#08090D] text-white selection:bg-[#CCFF00] selection:text-black">
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090D]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CCFF00] text-[#090A0F] shadow-[0_0_24px_-4px_rgba(204,255,0,0.65)]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight">
                AI FITNESS <span className="text-[#CCFF00]">BRAIN</span>
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-[#CCFF00] font-semibold">
                AIFitCore
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-zinc-300 font-medium">
            <a href="#how-it-works" className="hover:text-[#CCFF00] transition">
              How It Works
            </a>
            <a href="#cv-trainer" className="hover:text-[#CCFF00] transition">
              AI Camera Trainer
            </a>
            <a
              href="#training-modules"
              className="hover:text-[#CCFF00] transition"
            >
              Training Modules
            </a>
            <a
              href="#nutrition-brain"
              className="hover:text-[#CCFF00] transition"
            >
              Nutrition Brain
            </a>
            <a href="#progression" className="hover:text-[#CCFF00] transition">
              Progression Engine
            </a>
            <Link href="/features" className="hover:text-[#CCFF00] transition">
              All Features
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION WITH FULL-BLEED CINEMATIC WORKOUT VIDEO BACKGROUND */}
      <section className="relative overflow-hidden pt-14 pb-24 lg:pt-20 lg:pb-32">
        {/* Background Workout Video Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={heroVideoRef}
            key={activeHeroClip}
            autoPlay
            loop
            muted
            playsInline
            poster="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80"
            className="h-full w-full object-cover object-center scale-105 opacity-45 filter contrast-110 saturate-110 transition-opacity duration-700"
          >
            <source
              src={
                activeHeroClip === "gym"
                  ? "/videos/hero-workout.mp4"
                  : "/videos/pushup-workout.mp4"
              }
              type="video/mp4"
            />
            <source
              src={
                activeHeroClip === "gym"
                  ? "https://assets.mixkit.co/videos/22854/22854-720.mp4"
                  : "https://assets.mixkit.co/videos/40275/40275-720.mp4"
              }
              type="video/mp4"
            />
          </video>

          {/* Multi-stage commercial fitness dark vignette & lime glow overlays for high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090D] via-[#08090D]/80 to-[#08090D]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-transparent to-[#08090D]/80" />
          <div className="pointer-events-none absolute -top-32 left-1/3 h-[520px] w-[880px] rounded-full bg-[#CCFF00]/12 blur-[150px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="lime" className="px-3.5 py-1 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  7 Integrated AI &amp; Biomechanical Intelligence Engines
                </Badge>

                {/* Ambient Workout Video Switcher & Play/Pause Pill */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 backdrop-blur-md px-2.5 py-1 text-[11px] text-zinc-300">
                  <Video className="h-3 w-3 text-[#CCFF00]" />
                  <button
                    type="button"
                    onClick={() => switchHeroClip("gym")}
                    className={`px-1.5 py-0.5 rounded-full font-semibold transition ${
                      activeHeroClip === "gym"
                        ? "bg-[#CCFF00] text-black"
                        : "hover:text-white"
                    }`}
                  >
                    Gym Scene
                  </button>
                  <button
                    type="button"
                    onClick={() => switchHeroClip("pushup")}
                    className={`px-1.5 py-0.5 rounded-full font-semibold transition ${
                      activeHeroClip === "pushup"
                        ? "bg-[#CCFF00] text-black"
                        : "hover:text-white"
                    }`}
                  >
                    Push-Up Scene
                  </button>
                  <button
                    type="button"
                    onClick={toggleHeroVideo}
                    aria-label="Toggle background workout video"
                    className="ml-1 rounded-full p-1 hover:bg-white/10 text-[#CCFF00]"
                    title={
                      heroVideoPlaying
                        ? "Pause Background Video"
                        : "Play Background Video"
                    }
                  >
                    {heroVideoPlaying ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.07] drop-shadow-sm">
                Your Body. Your Goals.{" "}
                <span className="lime-gradient-text">
                  Your AI Personal Trainer.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-200 max-w-2xl leading-relaxed drop-shadow">
                An intelligent fitness companion that understands your body,
                watches your movements, builds personalized workouts, tracks
                your nutrition, and adapts as you progress.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="text-base px-8">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base bg-black/40 backdrop-blur-md border-white/20"
                  >
                    Explore Features
                  </Button>
                </a>
                <Link href="/dashboard">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="text-sm bg-white/10 backdrop-blur-md border border-white/15"
                  >
                    <Play className="h-4 w-4 text-[#CCFF00]" />
                    Launch Live App
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
                <div>
                  <p className="text-2xl font-black text-[#CCFF00]">
                    100% Local
                  </p>
                  <p className="text-xs text-zinc-300">
                    MediaPipe 33-Landmark Browser Computer Vision
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">Per-Exercise</p>
                  <p className="text-xs text-zinc-300">
                    Independent Level 1–5 Adaptive Overload
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-400">
                    25 Tables
                  </p>
                  <p className="text-xs text-zinc-300">
                    Normalized PostgreSQL + Supabase RLS Isolation
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive Telemetry Preview Card with Live Workout Video + Pose Overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <Card className="p-6 border-[#CCFF00]/35 bg-[#0F131D]/90 backdrop-blur-2xl shadow-[0_0_60px_-12px_rgba(204,255,0,0.3)]">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#CCFF00] animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#CCFF00]">
                      Live AI Fitness Brain Telemetry
                    </span>
                  </div>
                  <Badge variant="emerald">Individualized Plan</Badge>
                </div>

                {/* Live Athlete Video Feed + Animated 33-Landmark Skeleton Canvas Graphic */}
                <div className="my-4 relative rounded-xl border border-white/15 bg-[#080A0F] overflow-hidden">
                  {/* Live background athlete video inside the CV viewfinder */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover opacity-50 filter contrast-125"
                  >
                    <source src="/videos/pushup-workout.mp4" type="video/mp4" />
                    <source
                      src="https://assets.mixkit.co/videos/40275/40275-720.mp4"
                      type="video/mp4"
                    />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/40 to-[#080A0F]/75" />

                  <div className="relative z-10 p-5">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-[#CCFF00]" />
                        MediaPipe Pose Landmarker (30 FPS)
                      </span>
                      <span className="font-mono text-[#CCFF00] font-bold">
                        Form: {liveFormScore}%
                      </span>
                    </div>

                    <svg
                      viewBox="0 0 260 150"
                      className="w-full h-36 stroke-[#CCFF00] fill-none drop-shadow-[0_0_8px_rgba(204,255,0,0.6)]"
                    >
                      {/* Ground reference line */}
                      <line
                        x1="20"
                        y1="138"
                        x2="240"
                        y2="138"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      {/* Animated Athlete Pose Skeleton */}
                      <circle
                        cx="115"
                        cy={22 + hipDropY * 0.7}
                        r="9.5"
                        stroke="#CCFF00"
                        strokeWidth="2.5"
                      />
                      {/* Torso (Shoulder to Hip) */}
                      <line
                        x1="115"
                        y1={34 + hipDropY * 0.75}
                        x2="96"
                        y2={72 + hipDropY}
                        stroke="#CCFF00"
                        strokeWidth="3"
                      />
                      {/* Thigh (Hip to Knee) */}
                      <line
                        x1="96"
                        y1={72 + hipDropY}
                        x2="144"
                        y2={88 + hipDropY * 0.15}
                        stroke="#10B981"
                        strokeWidth="3.2"
                      />
                      {/* Shin (Knee to Ankle) */}
                      <line
                        x1="144"
                        y1={88 + hipDropY * 0.15}
                        x2="135"
                        y2="134"
                        stroke="#CCFF00"
                        strokeWidth="3"
                      />
                      {/* Arm forward counterbalance */}
                      <line
                        x1="115"
                        y1={38 + hipDropY * 0.75}
                        x2="162"
                        y2={48 + hipDropY * 0.6}
                        stroke="#CCFF00"
                        strokeWidth="2.5"
                      />
                      {/* Joint Landmarks */}
                      {[
                        [115, 34 + hipDropY * 0.75],
                        [96, 72 + hipDropY],
                        [144, 88 + hipDropY * 0.15],
                        [135, 134],
                        [162, 48 + hipDropY * 0.6],
                      ].map(([cx, cy], idx) => (
                        <circle
                          key={idx}
                          cx={cx}
                          cy={cy}
                          r="4.5"
                          fill="#090A0F"
                          stroke="#CCFF00"
                          strokeWidth="2.5"
                        />
                      ))}
                      <text
                        x="153"
                        y={92 + hipDropY * 0.15}
                        fill="#CCFF00"
                        fontSize="10"
                        fontWeight="bold"
                        stroke="none"
                      >
                        {liveKneeAngle}° Knee
                      </text>
                      <text
                        x="32"
                        y={76 + hipDropY}
                        fill="#10B981"
                        fontSize="10"
                        fontWeight="bold"
                        stroke="none"
                      >
                        Hip Depth OK
                      </text>
                    </svg>

                    <div className="mt-2 flex items-center justify-between rounded-lg bg-black/70 backdrop-blur-md border border-[#CCFF00]/40 px-3 py-2 text-xs">
                      <span className="font-semibold text-[#CCFF00]">
                        &ldquo;Excellent repetition — parallel squat depth
                        achieved.&rdquo;
                      </span>
                      <span className="font-mono text-white font-bold">
                        Rep 12/12
                      </span>
                    </div>
                  </div>
                </div>

                {/* Per-exercise independent level preview */}
                <div className="space-y-2.5 text-xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Independent Per-Exercise Skill Levels
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
                      <span className="text-zinc-400 block">
                        Bodyweight Squat
                      </span>
                      <span className="font-bold text-[#CCFF00]">
                        Level 3: Intermediate
                      </span>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
                      <span className="text-zinc-400 block">
                        Push-Up Pathway
                      </span>
                      <span className="font-bold text-white">
                        Level 1: Beginner
                      </span>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
                      <span className="text-zinc-400 block">Forearm Plank</span>
                      <span className="font-bold text-emerald-400">
                        Level 2: Novice
                      </span>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
                      <span className="text-zinc-400 block">
                        Daily Calorie Target
                      </span>
                      <span className="font-bold text-amber-300">
                        2,340 kcal • 149g P
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT INTRODUCTION & CENTRAL PRINCIPLE */}
      <section className="py-16 border-y border-white/10 bg-[#0C0E14]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="lime">The Central Principle</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Every User Is Different. Zero Generic Templates.
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              AI Fitness Brain never assigns two users the same workout or
              calorie target. Your plan is synthesized from your biometrics,
              sex-specific BMR/TDEE equations, owned home or gym equipment,
              disclosed injuries, Bangladeshi &amp; global food habits, sleep
              recovery, and set-by-set performance memory.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Camera,
                title: "AI Personal Trainer",
                desc: "Watches your movement joints locally at 30+ FPS, counts good vs. needs-correction reps, and speaks live form cues.",
              },
              {
                icon: Utensils,
                title: "AI Nutritionist & Diet Planner",
                desc: "Builds daily meals (Breakfast, Lunch, Snacks, Dinner) supporting Bangladeshi staples (Rice, Roti, Fish, Dal, Chicken, Eggs) and global foods.",
              },
              {
                icon: Flame,
                title: "Deterministic Calorie Brain",
                desc: "Calculates BMR, TDEE, macros, fiber, and hydration via Mifflin-St Jeor & Katch-McArdle formulas with medical safety guardrails.",
              },
              {
                icon: TrendingUp,
                title: "Workout Progression Coach",
                desc: "Tracks Level 1 to Level 5 independently for each exercise. Decides when to Progress, Maintain, or Regress using historical evidence.",
              },
              {
                icon: History,
                title: "Personal Fitness Memory",
                desc: "Remembers every workout set, form score, meal entry, body measurement, and sleep/soreness log across your fitness journey.",
              },
              {
                icon: Bot,
                title: "Context-Grounded AI Coach",
                desc: "Answers questions using your actual remaining daily calories, push-up history, recovery readiness, and progression decisions.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card
                  key={i}
                  className="p-6 hover:border-[#CCFF00]/40 transition"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#CCFF00]/15 text-[#CCFF00] mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HOW THE AI TRAINER WORKS */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="emerald">Closed-Loop Intelligence</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3">
              How the AI Fitness Brain Works
            </h2>
            <p className="text-zinc-400 text-sm mt-2">
              A 4-stage adaptive feedback cycle that evolves with every single
              workout session and meal you log.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Biometric & Skill Onboarding",
                desc: "Assess your height, weight, goals, owned equipment, injuries, and dietary preferences.",
              },
              {
                step: "02",
                title: "Individualized Prescription",
                desc: "Receive a custom Gym, Home, or Calisthenics workout plus exact BMR/TDEE macro and meal targets.",
              },
              {
                step: "03",
                title: "Live Camera Form & Rep Analysis",
                desc: "Perform exercises in front of your camera with real-time joint angle tracking and voice coaching.",
              },
              {
                step: "04",
                title: "Evidence-Based Progression",
                desc: "The engine evaluates your form scores, ROM, and recovery to adjust difficulty for your next session.",
              },
            ].map((s) => (
              <Card key={s.step} className="p-6 relative overflow-hidden">
                <span className="text-4xl font-black text-[#CCFF00]/20">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-white mt-3 mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {s.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CAMERA-BASED EXERCISE ANALYSIS DEMONSTRATION */}
      <section
        id="cv-trainer"
        className="py-20 bg-[#0C0E14] border-y border-white/10"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <Badge variant="lime">MediaPipe Pose Landmarker</Badge>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Real-Time Browser Computer Vision. Zero Video Uploads.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Our 6 dedicated TypeScript exercise analyzers process 33 body
                landmarks locally in your browser. Frames are never sent to
                OpenRouter or stored on external servers.
              </p>

              <div className="flex gap-2">
                {(["squat", "pushup", "plank"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setDemoExercise(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition ${
                      demoExercise === key
                        ? "bg-[#CCFF00] text-black"
                        : "bg-white/5 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {key} Analyzer
                  </button>
                ))}
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#CCFF00]" />
                  <span>
                    Supports Squat, Push-Up, Lunge, Plank, Bicep Curl &amp;
                    Shoulder Press
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#CCFF00]" />
                  <span>
                    Exponential Moving Average (EMA) smoothing &amp;
                    anti-duplicate rep debounce
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#CCFF00]" />
                  <span>
                    Explicit rule-based Movement Quality Scores &amp; Web Speech
                    voice synthesis
                  </span>
                </li>
              </ul>

              <Link href="/trainer" className="inline-block pt-2">
                <Button variant="primary">
                  <Camera className="h-4 w-4" />
                  Try AI Camera Trainer Live
                </Button>
              </Link>
            </div>

            <div className="lg:col-span-7">
              <Card className="p-6 border-white/15 bg-[#090B10]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {cvDemoData.name}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Recommended Camera View: {cvDemoData.cameraView}
                    </p>
                  </div>
                  <Badge variant="lime">State: {cvDemoData.phase}</Badge>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 my-5">
                  <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-[11px] text-zinc-400 block">
                      Primary Joint Angle
                    </span>
                    <span className="text-lg font-extrabold text-[#CCFF00]">
                      {cvDemoData.angle}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-[11px] text-zinc-400 block">
                      Alignment Metric
                    </span>
                    <span className="text-lg font-extrabold text-white">
                      {cvDemoData.secondary}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                    <span className="text-[11px] text-zinc-400 block">
                      Rep Counter
                    </span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      {cvDemoData.reps}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">
                        Range of Motion (ROM)
                      </span>
                      <span className="font-bold text-[#CCFF00]">
                        {cvDemoData.rom}%
                      </span>
                    </div>
                    <ProgressBar value={cvDemoData.rom} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">
                        Estimated Movement-Quality Score
                      </span>
                      <span className="font-bold text-emerald-400">
                        {cvDemoData.score}%
                      </span>
                    </div>
                    <ProgressBar
                      value={cvDemoData.score}
                      colorClass="bg-emerald-400"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 p-3.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#CCFF00]">
                    Live Voice Feedback: &ldquo;{cvDemoData.feedback}&rdquo;
                  </span>
                  <Badge variant="outline">Local WebGL</Badge>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GYM, HOME & CALISTHENICS TRAINING MODULES */}
      <section id="training-modules" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="lime">3 Connected Training Experiences</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3">
              Gym, Home &amp; Calisthenics — Powered by One Brain
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-7">
            <Card className="p-7 flex flex-col justify-between border-white/10 hover:border-[#CCFF00]/50 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-[#CCFF00]/15 text-[#CCFF00]">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <Badge variant="lime">Module A</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">Gym Training</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Full commercial gym programming across Chest, Back, Shoulders,
                  Arms, Legs, Core, and Full-Body splits.
                </p>
                <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                  <li>• Barbell, Dumbbell, Cable &amp; Machine exercises</li>
                  <li>• Strength, Hypertrophy &amp; Fat-Loss tracks</li>
                  <li>• Target sets, reps, rest timers &amp; form cues</li>
                </ul>
              </div>
              <Link href="/gym">
                <Button variant="outline" className="w-full">
                  Explore Gym Training
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>

            <Card className="p-7 flex flex-col justify-between border-white/10 hover:border-[#CCFF00]/50 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Home className="h-6 w-6" />
                  </div>
                  <Badge variant="emerald">Module B</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">Home Workout</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Equipment-aware workouts that automatically filter to the
                  exact gear you own at home.
                </p>
                <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                  <li>• No-Equipment, Dumbbell &amp; Resistance Band routines</li>
                  <li>• Beginner, Upper, Lower, Core &amp; Fat-Loss sessions</li>
                  <li>• Zero missing-equipment frustration</li>
                </ul>
              </div>
              <Link href="/home">
                <Button variant="outline" className="w-full">
                  Explore Home Workouts
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>

            <Card className="p-7 flex flex-col justify-between border-white/10 hover:border-[#CCFF00]/50 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
                    <Flame className="h-6 w-6" />
                  </div>
                  <Badge variant="amber">Module C</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">Calisthenics Skills</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Prerequisite-gated bodyweight skill pathways from Wall
                  Push-Ups to Muscle-Ups, Handstands &amp; Front Levers.
                </p>
                <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                  <li>
                    • Wall → Incline → Knee → Standard → Diamond → Archer
                    Push-Up
                  </li>
                  <li>
                    • Dead Hang → Negative → Chin-Up → Pull-Up → Front Lever
                  </li>
                  <li>• Strict prerequisite &amp; form-score verification</li>
                </ul>
              </div>
              <Link href="/calisthenics">
                <Button variant="outline" className="w-full">
                  Explore Skill Pathways
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. AI NUTRITION, BANGLADESHI DIET PLANNER & CALORIE BRAIN */}
      <section
        id="nutrition-brain"
        className="py-20 bg-[#0C0E14] border-y border-white/10"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <Badge variant="emerald">AI Nutritionist &amp; Calorie Brain</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                Personalized Macros &amp; Authentic Local Meal Planning
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Calculate your BMR and TDEE via Mifflin-St Jeor or Katch-McArdle
                equations, and generate daily meal plans tailored to your
                budget, allergies, and local staples—including Bangladeshi foods
                like{" "}
                <span className="text-white font-semibold">
                  Rice (Bhat), Red Rice (Lal Chal), Atta Roti, Boiled Eggs,
                  Chicken Curry, Rohu/Tilapia/Hilsa Fish, Masoor Dal, Mixed
                  Sabzi, Leafy Shak, Tok Doi, and Fruits
                </span>
                .
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                  <p className="font-bold text-[#CCFF00]">4 Ways to Log Food</p>
                  <p className="text-zinc-400 mt-1">
                    1. Verified Database Search • 2. Text Description • 3. Voice
                    Dictation • 4. OpenRouter Vision Photo Upload
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                  <p className="font-bold text-emerald-400">
                    100% Deterministic Totals
                  </p>
                  <p className="text-zinc-400 mt-1">
                    Running calorie, protein, carb, fat, fiber &amp; water
                    totals are computed deterministically—never guessed by an
                    LLM.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/nutrition">
                  <Button variant="primary">Open Diet Planner</Button>
                </Link>
                <Link href="/food-tracker">
                  <Button variant="outline">Open Calorie Tracker</Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <Card className="p-6 bg-[#090B10] border-white/15 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Sample Bangladeshi High-Protein Daily Plan
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Calibrated for 74.5 kg Athlete • Muscle Gain (2,380 kcal •
                      149g Protein)
                    </p>
                  </div>
                  <Badge variant="lime">Customizable</Badge>
                </div>

                {[
                  {
                    meal: "Breakfast",
                    title:
                      "3 Whole Wheat Atta Rotis, 3 Boiled Eggs & Mixed Sabzi",
                    macros: "595 kcal • 33g P • 72g C • 18g F",
                  },
                  {
                    meal: "Lunch",
                    title:
                      "Deshi Red Rice (Lal Chal), Rohu Fish Curry, Thick Masoor Dal & Shak",
                    macros: "790 kcal • 49g P • 98g C • 19g F",
                  },
                  {
                    meal: "Post-Workout Snack",
                    title:
                      "Plain Tok Doi (150g), Spiced Boiled Chola & Sagor Banana",
                    macros: "390 kcal • 20g P • 64g C • 7g F",
                  },
                  {
                    meal: "Dinner",
                    title:
                      "Homestyle Chicken Curry (150g), 2 Atta Rotis & Vegetable Bhaji",
                    macros: "605 kcal • 47g P • 62g C • 18g F",
                  },
                ].map((m) => (
                  <div
                    key={m.meal}
                    className="rounded-xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
                        {m.meal}
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {m.title}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-300 shrink-0">
                      {m.macros}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ADAPTIVE TRAINING PROGRESSION & 8. PERSONALIZED FITNESS HISTORY */}
      <section id="progression" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-7 border-white/15">
              <Badge variant="lime">Section 12 Engine</Badge>
              <h3 className="text-2xl font-extrabold mt-3 mb-2">
                Per-Exercise Adaptive Difficulty Engine
              </h3>
              <p className="text-sm text-zinc-400 mb-5">
                You might be Level 1 (Beginner) at Pull-Ups, Level 3
                (Intermediate) at Squats, and Level 2 (Novice) at Planks. We
                track and progress every exercise independently:
              </p>
              <div className="space-y-2.5 text-xs">
                {[
                  "Level 1: Beginner — Foundation (Joint adaptation & form mastery)",
                  "Level 2: Novice — Building Strength (Full range of motion)",
                  "Level 3: Intermediate — Development (Progressive volume & leverage)",
                  "Level 4: Advanced — Performance (Unilateral & high-tension variations)",
                  "Level 5: Expert — Advanced Skills (Muscle-Up, Handstand, Front Lever)",
                ].map((lvl, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 font-medium text-zinc-200"
                  >
                    {lvl}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-7 border-white/15 flex flex-col justify-between">
              <div>
                <Badge variant="emerald">Long-Term Personal Memory</Badge>
                <h3 className="text-2xl font-extrabold mt-3 mb-2">
                  Never Forgets Your History or Recovery
                </h3>
                <p className="text-sm text-zinc-400 mb-5">
                  Every workout session, form score, sleep log, soreness
                  check-in, body weight measurement, and meal entry feeds into
                  your future recommendations.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                    <p className="font-bold text-white mb-1">
                      Fair Progression Safeguards
                    </p>
                    <p className="text-zinc-400">
                      Never increases difficulty just because calendar days
                      passed. Never punishes missed workouts. Never regresses on
                      a single bad day.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                    <p className="font-bold text-white mb-1">
                      Recovery-Aware Volume
                    </p>
                    <p className="text-zinc-400">
                      Low sleep or high muscle soreness automatically scales
                      back sets and increases rest intervals to protect your
                      joints.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Interactive Recharts Analytics &amp; Weekly Reports
                </span>
                <Link href="/progress">
                  <Button variant="secondary" size="sm">
                    View Analytics
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 10. CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-b from-[#0C0E14] to-[#08090D] border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
          <Badge variant="lime">Start Your Individualized Plan Today</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Train With Your{" "}
            <span className="lime-gradient-text">AI Fitness Brain</span>?
          </h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">
            Create your account, complete the 5-step biometric and skill
            assessment, and unlock personalized workouts, live MediaPipe camera
            coaching, and custom nutrition targets.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/register">
              <Button variant="primary" size="lg" className="px-8">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Open Live Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="border-t border-white/10 bg-[#06070A] py-12 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#CCFF00] text-black">
              <Brain className="h-4 w-4" />
            </div>
            <span className="font-bold text-white">
              AI FITNESS BRAIN (AIFitCore)
            </span>
          </div>
          <p className="text-center">
            All calorie targets and camera form scores are estimated fitness
            indicators, not medical prescriptions.
          </p>
          <div className="flex gap-5">
            <Link href="/features" className="hover:text-[#CCFF00]">
              Features
            </Link>
            <Link href="/login" className="hover:text-[#CCFF00]">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-[#CCFF00]">
              Register
            </Link>
            <Link href="/dashboard" className="hover:text-[#CCFF00]">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
