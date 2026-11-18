# AI Fitness Brain (`AIFitCore`) — Phased Implementation Plan

## Phase 1 — Foundation
- Initialize Next.js App Router, TypeScript strict configuration, Tailwind CSS, Framer Motion, Lucide React, Recharts, Zod, and Vitest.
- Establish dark-first commercial fitness design system (`#090A0F` obsidian charcoal, `#CCFF00` electric lime accent, glassmorphic cards, light mode toggle).
- Author PostgreSQL migrations (`001_initial_schema.sql`, `002_rls_policies.sql`) and seed catalogs (`001_exercises.sql`, `002_foods.sql`).
- Build Landing Page, Authentication (`/login`, `/register`, `/forgot-password`), 5-Step Onboarding (`/onboarding`), and Responsive Dashboard shell.

## Phase 2 — Fitness Modules & Workout Generator
- Implement Gym Training (`/gym`), Home Workout (`/home`), and Calisthenics Skill Pathways (`/calisthenics`).
- Build Exercise Catalog service with prerequisite checking and equipment filtering.
- Implement AI Personalized Workout Generator and Interactive Workout Session Logger (`/workouts`).

## Phase 3 — Camera-Based AI Personal Trainer
- Integrate `@mediapipe/tasks-vision` (`PoseLandmarker`) with local browser camera processing.
- Build 6 dedicated stateful exercise analyzers (`SquatAnalyzer`, `PushUpAnalyzer`, `LungeAnalyzer`, `PlankAnalyzer`, `BicepCurlAnalyzer`, `ShoulderPressAnalyzer`).
- Add joint angle calculation, EMA landmark smoothing, visibility checks, anti-bounce rep counting, explicit form scoring, and Web Speech voice synthesis (`/trainer`).

## Phase 4 — AI Nutrition, Diet Planner & Calorie Brain
- Implement deterministic BMR (Mifflin-St Jeor & Katch-McArdle), TDEE, goal calorie adjustment, macro distribution, fiber, hydration, and safety guardrails.
- Build Daily Meal Planner (`/nutrition`) with Bangladeshi and global foods and meal customization.
- Build 4-mode Food & Calorie Tracker (`/food-tracker`) supporting Manual Search, Text Description, Voice Dictation, and OpenRouter Vision Image Recognition with user confirmation.

## Phase 5 — Adaptive AI Fitness Brain, Progression, Recovery & Chatbot
- Implement Per-Exercise Independent Progressive Overload & Adaptive Difficulty Engine (`PROGRESS`, `MAINTAIN`, `REGRESS`).
- Build Central Adaptive AI Fitness Brain coordinator connecting workout history, nutrition adherence, body metrics, and recovery readiness.
- Build Fitness History (`/history`), Recovery Tracking (`/recovery`), Context-Grounded AI Fitness Chatbot (`/ai-coach`), and Profile/Settings with Data Export (`/settings`).

## Phase 6 — Progress Analytics, Testing & Production Verification
- Build Progress & Analytics Dashboard (`/progress`) with Recharts charts, date filters, weekly/monthly reports, and measured vs. estimated data badges.
- Run comprehensive Vitest unit tests, TypeScript check (`tsc --noEmit`), ESLint, and Next.js production build (`next build`).
