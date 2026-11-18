# AI Fitness Brain (`AIFitCore`) — Architecture Specification

## 1. Architectural Principles

1. **Deterministic Calculations vs. Generative AI Separation**:
   - **Deterministic Code (`src/lib/calculations/`, `src/engines/`, `src/services/progression/`)**: BMR, TDEE, daily calorie totals, macro summations, hydration goals, joint angle calculations, exercise phase transitions, repetition counting, form scoring rules, and progression safety gates are 100% deterministic and unit-tested.
   - **Generative AI (`src/lib/ai/openrouter.ts`)**: Used strictly for structured workout composition (constrained to valid catalog exercises), personalized meal suggestions, historical trend synthesis, natural language food parsing, vision-based food portion estimation (requiring user confirmation), and conversational coaching.
2. **Per-User & Per-Exercise Individualization**:
   - There is no single global user difficulty level that dictates all exercises. Each exercise tracks its own level (`1` to `5`), mastery score, and progression history (`exercise_progression_history`).
3. **Privacy-First Client-Side Computer Vision**:
   - Camera frames are analyzed locally in the browser using **MediaPipe Pose Landmarker** (`@mediapipe/tasks-vision`).
   - Live video frames are never streamed or uploaded to OpenRouter or backend servers.

---

## 2. Directory & Module Organization

```text
src/
  app/
    (marketing)/          # Landing page & Features showcase
    (auth)/               # Login, Register, Forgot Password
    (dashboard)/          # Protected application shell & 14 functional modules
      dashboard/          # Central command center
      onboarding/         # 5-step biometric, fitness, equipment & nutrition wizard
      gym/                # Gym Training module
      home/               # Home Workout module (equipment-synced)
      calisthenics/       # Skill progression tree module
      trainer/            # MediaPipe AI Camera Personal Trainer
      workouts/           # AI Workout Generator & Live Session Logger
      nutrition/          # BMR/TDEE/Macro Calculator & Meal Planner
      food-tracker/       # 4-mode Calorie & Food Brain + Water Tracker
      history/            # Long-term Workout, Nutrition, Body & Recovery Memory
      progress/           # Interactive Recharts Analytics & Reports
      recovery/           # Sleep, Soreness, Fatigue & Readiness Tracker
      ai-coach/           # Context-grounded AI Conversational Assistant
      settings/           # Profile Editor, Data Export & Privacy Controls
    api/
      ai/                 # OpenRouter server-side routes (workout, meals, chat, food-vision)
      workouts/           # Workout plan & session CRUD endpoints
      nutrition/          # Nutrition target & meal plan endpoints
      food/               # Food catalog & daily intake log endpoints
      progress/           # Analytics & progression history endpoints
  components/
    ui/                   # Reusable shadcn/ui primitives
    layout/               # Desktop Sidebar, Mobile Drawer, Topbar, Theme Toggle
    dashboard/            # Metric rings, brain recommendation cards
    workout/              # Exercise cards, progression trees, session timers
    trainer/              # Pose canvas overlay, angle gauges, voice controller
    nutrition/            # Macro bars, Bangladeshi & global meal cards, food scanner
    charts/               # Recharts trend lines, radar & bar visualizations
  lib/
    supabase/             # Supabase Browser/Server SSR clients + Local-First Hybrid Store
    ai/                   # OpenRouter server service, prompts & Zod schemas
    calculations/         # BMR, TDEE, Macros, Hydration & Daily Totals
    validations/          # Zod schemas for forms, API payloads & AI outputs
    security/             # Rate limiter, auth guards & input sanitizers
    utils/                # Formatting, cn() helper & date utilities
  services/
    brain/                # Central Adaptive AI Fitness Brain coordinator
    workout/              # Exercise catalog & personalized workout generator
    nutrition/            # Diet planner & food database service
    progression/          # Per-exercise progressive overload & adaptive difficulty engine
    recovery/             # Readiness & fatigue evaluation service
    history/              # Personal memory aggregation service
    analytics/            # Weekly/monthly report & trend computation service
  engines/
    pose/                 # 3D/2D joint angle math, EMA smoothing, visibility checks
    exercises/            # Common analyzer interface & form scoring calculator
    squat/                # SquatAnalyzer state machine
    pushup/               # PushUpAnalyzer state machine
    lunge/                # LungeAnalyzer state machine
    plank/                # PlankAnalyzer isometric state machine
    bicep-curl/           # BicepCurlAnalyzer state machine
    shoulder-press/       # ShoulderPressAnalyzer state machine
  types/                  # Strict TypeScript domain interfaces
  hooks/                  # React hooks for user state, camera, speech & persistence
database/
  migrations/             # PostgreSQL DDL & Row Level Security policies
  seeds/                  # Comprehensive Exercise & Food SQL seeds
```

---

## 3. The 7 Central Intelligence Engines

| Engine | Location | Responsibility |
| :--- | :--- | :--- |
| **1. Workout Intelligence** | `src/services/workout/` | Filters catalog exercises by user equipment, category, injuries, target muscles, recovery readiness, and per-exercise levels. |
| **2. Nutrition Intelligence** | `src/services/nutrition/` | Synthesizes daily meal plans (Breakfast, Lunch, Snacks, Dinner) honoring budget, allergies, and cultural staples (including Bangladeshi dishes). |
| **3. Calorie Calculation Engine** | `src/lib/calculations/nutrition.ts` | Deterministic Mifflin-St Jeor & Katch-McArdle BMR, TDEE, deficit/surplus guardrails, macro splits, fiber, and water targets. |
| **4. Recovery Intelligence** | `src/services/recovery/` | Computes daily Readiness Score ($0\text{--}100$) from sleep duration/quality, soreness, fatigue, and recent training volume. |
| **5. Progress Intelligence** | `src/services/analytics/` | Evaluates weight trajectory, adherence, strength volume, and form-quality improvements across custom date ranges. |
| **6. Exercise Progression Engine** | `src/services/progression/` | Independently evaluates each exercise after sessions to recommend `PROGRESS`, `MAINTAIN`, or `REGRESS` with evidence explanations. |
| **7. AI Conversational Coach** | `src/lib/ai/openrouter.ts` | Grounded assistant injected with real-time user profile, remaining calories, recent form scores, and progression audit logs. |

---

## 4. Computer Vision Pose Pipeline

1. **Frame Capture**: HTML5 `<video>` stream via `navigator.mediaDevices.getUserMedia` (supports front/back cameras on mobile and desktop webcams).
2. **Landmark Extraction**: MediaPipe `PoseLandmarker.detectForVideo()` produces 33 3D normalized body landmarks at 30+ FPS.
3. **Filtering & Smoothing**:
   - Visibility check ensures required joints exceed `MIN_VISIBILITY = 0.55`.
   - Exponential Moving Average (EMA, $\alpha = 0.35$) dampens single-frame jitter.
4. **Exercise State Machine**:
   - Transitions strictly through `STANDING`/`START` $\rightarrow$ `DESCENDING` $\rightarrow$ `BOTTOM` $\rightarrow$ `ASCENDING` $\rightarrow$ `REP_COMPLETE`.
   - Minimum phase dwell time (`200ms`) and refractory window (`450ms`) prevent false duplicate rep counts.
5. **Explicit Rule-Based Form Scoring**:
   - Each repetition is scored ($0\text{--}100\%$) against explicit biomechanical proxies (e.g., knee depth angle, hip-shoulder-ankle collinearity, knee valgus deviation, elbow flare) and clearly labeled as an **Estimated Movement-Quality Indicator**.
