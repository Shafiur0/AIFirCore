# AI Fitness Brain (`AIFitCore`)

> **"Your Body. Your Goals. Your AI Personal Trainer."**
>
> An intelligent fitness companion that understands your body, watches your movements, builds personalized workouts, tracks your nutrition, and adapts as you progress.

---

## Overview

**AI Fitness Brain (`AIFitCore`)** is a production-architected AI-powered fitness, computer-vision exercise analysis, nutrition planning, and adaptive progression web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Recharts**, **Supabase (PostgreSQL + Auth + Storage + RLS)**, **OpenRouter AI**, and **MediaPipe Pose Landmarker**.

### Core Capabilities

1. **Individualized Fitness & Nutrition Engine**: Every user receives a personalized plan based on biometrics, training history, injury disclosures, available equipment, dietary restrictions, and local food preferences (including Bangladeshi and international staples).
2. **Three Integrated Training Modules**:
   - **Gym Training**: Barbell, Dumbbell, Machine, Cable programs for Strength, Hypertrophy, and Fat Loss across all muscle groups.
   - **Home Workout**: Equipment-aware routines adapting to No-Equipment, Dumbbells, and Resistance Bands.
   - **Calisthenics**: Prerequisite-gated skill progression trees (Wall Push-up $\rightarrow$ Incline Push-up $\rightarrow$ Knee Push-up $\rightarrow$ Standard Push-up $\rightarrow$ Diamond/Archer Push-up, Pull-up trees, Dip trees, Pistol Squat trees, Muscle-up, Handstand, Front Lever).
3. **Browser-Based AI Camera Personal Trainer**:
   - Powered locally by **MediaPipe Pose Landmarker** (`@mediapipe/tasks-vision`).
   - Supports **Squat**, **Push-Up**, **Lunge**, **Plank**, **Bicep Curl**, and **Shoulder Press**.
   - Local landmark processing with EMA smoothing, visibility thresholding, state-machine phase transitions (`STANDING`/`STARTING` $\rightarrow$ `DESCENDING` $\rightarrow$ `BOTTOM` $\rightarrow$ `ASCENDING` $\rightarrow$ `REP_COMPLETE`), anti-duplicate debounce, real-time form feedback, and optional Web Speech voice coaching.
   - Strict privacy: zero camera frames or raw videos are uploaded to LLMs or external servers.
4. **Per-Exercise Progressive Overload & Adaptive Difficulty Engine**:
   - Independent level tracking per exercise (Level 1 Foundation $\rightarrow$ Level 5 Expert).
   - Evaluates completion ratio, form quality score, range of motion, recovery state, and multi-session evidence before deciding to **Progress**, **Maintain**, or **Regress**.
5. **Deterministic Metabolic & Nutrition Brain**:
   - Calculates **BMR** (Mifflin-St Jeor & Katch-McArdle), **TDEE**, personalized deficit/surplus targets, protein/carb/fat/fiber macros, and hydration targets in deterministic TypeScript.
   - Generates daily meals (Breakfast, Lunch, Snacks, Dinner) featuring Bangladeshi staples (Rice, Roti, Eggs, Chicken, Fish, Dal, Vegetables, Milk, Fruits) and global options.
   - 4-mode Food & Calorie Tracker: Manual Search, Text Description, Voice Dictation, and OpenRouter Vision Food Image Analysis with user confirmation.
6. **Central Adaptive AI Fitness Brain & Context-Grounded Coach**:
   - Coordinates 7 specialized engines (`Workout Intelligence`, `Nutrition Intelligence`, `Calorie Calculation Engine`, `Recovery Intelligence`, `Progress Intelligence`, `Exercise Progression Engine`, `AI Conversational Coach`).

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and supply your credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_VISION_MODEL=openai/gpt-4o-mini
```

> **Note:** If you start the application before populating `.env.local`, AIFitCore runs in **Verified Local-First Persistence & Deterministic Intelligence Mode** so you can register, onboard, generate workouts, run the MediaPipe camera trainer, track meals, and test all 16 sections immediately.

### 3. Apply Database Migrations & Seeds (Supabase)

Run the SQL files in `database/migrations/` followed by `database/seeds/` in your Supabase SQL Editor:
1. `database/migrations/001_initial_schema.sql`
2. `database/migrations/002_rls_policies.sql`
3. `database/seeds/001_exercises.sql`
4. `database/seeds/002_foods.sql`

### 4. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 5. Verification Commands

```bash
npm run typecheck   # TypeScript verification
npm run lint        # ESLint checks
npm run test        # Vitest unit test suite
npm run build       # Production Next.js build
```

---

## Documentation Index

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design, 7 intelligence engines, computer vision pipeline, and security boundaries.
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Complete 25-table PostgreSQL schema and Row Level Security specification.
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — 6-phase incremental delivery roadmap and verification criteria.
