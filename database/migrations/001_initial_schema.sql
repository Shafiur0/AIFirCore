-- ============================================================================
-- AI FITNESS BRAIN (AIFitCore) — MIGRATION 001: INITIAL POSTGRESQL SCHEMA
-- 25 Normalized Tables with UUID Primary Keys, Foreign Keys, Indexes & Triggers
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  age_years INTEGER CHECK (age_years IS NULL OR (age_years >= 10 AND age_years <= 110)),
  biological_sex TEXT CHECK (biological_sex IN ('male', 'female', 'other', 'prefer_not_to_say')) DEFAULT 'male',
  height_cm NUMERIC(5,2) CHECK (height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 260)),
  current_weight_kg NUMERIC(5,2) CHECK (current_weight_kg IS NULL OR (current_weight_kg >= 25 AND current_weight_kg <= 350)),
  target_weight_kg NUMERIC(5,2),
  body_fat_pct NUMERIC(4,1),
  fitness_experience TEXT CHECK (fitness_experience IN ('beginner', 'novice', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')) DEFAULT 'moderately_active',
  workout_days_per_week INTEGER CHECK (workout_days_per_week BETWEEN 1 AND 7) DEFAULT 4,
  preferred_workout_duration_min INTEGER CHECK (preferred_workout_duration_min BETWEEN 10 AND 180) DEFAULT 45,
  injuries_limitations TEXT[] DEFAULT '{}',
  medical_conditions TEXT[] DEFAULT '{}',
  is_pregnant_or_nursing BOOLEAN DEFAULT FALSE,
  has_eating_disorder_history BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. USER_GOALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  primary_goal TEXT NOT NULL CHECK (primary_goal IN ('muscle_gain', 'fat_loss', 'maintenance', 'strength', 'general_fitness', 'endurance')),
  secondary_goal TEXT CHECK (secondary_goal IN ('muscle_gain', 'fat_loss', 'maintenance', 'strength', 'general_fitness', 'endurance')),
  target_weight_kg NUMERIC(5,2),
  weekly_rate_kg NUMERIC(4,2) DEFAULT 0.40,
  target_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);

-- ============================================================================
-- 3. USER_PREFERENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_training_category TEXT NOT NULL CHECK (preferred_training_category IN ('gym', 'home', 'calisthenics')) DEFAULT 'gym',
  available_equipment TEXT[] NOT NULL DEFAULT ARRAY['bodyweight'],
  dietary_preference TEXT NOT NULL DEFAULT 'omnivore',
  dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  food_budget_tier TEXT NOT NULL CHECK (food_budget_tier IN ('budget', 'moderate', 'premium')) DEFAULT 'moderate',
  cuisine_preferences TEXT[] NOT NULL DEFAULT ARRAY['bangladeshi', 'international'],
  preferred_meals TEXT[] NOT NULL DEFAULT '{}',
  voice_feedback_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  theme_preference TEXT NOT NULL CHECK (theme_preference IN ('dark', 'light')) DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. EXERCISES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gym', 'home', 'calisthenics')),
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT ARRAY['none'],
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 1,
  movement_pattern TEXT NOT NULL,
  program_tags TEXT[] NOT NULL DEFAULT '{}',
  is_camera_supported BOOLEAN NOT NULL DEFAULT FALSE,
  camera_analyzer_key TEXT,
  recommended_camera_view TEXT,
  default_sets INTEGER NOT NULL DEFAULT 3,
  default_reps TEXT NOT NULL DEFAULT '10-12',
  default_rest_sec INTEGER NOT NULL DEFAULT 60,
  calories_per_min NUMERIC(4,2) NOT NULL DEFAULT 6.5,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON public.exercises(primary_muscle);

-- ============================================================================
-- 5. EXERCISE_VARIATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_slug TEXT NOT NULL,
  pathway_name TEXT NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  parent_exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  step_order INTEGER NOT NULL,
  prerequisite_reps INTEGER NOT NULL DEFAULT 10,
  prerequisite_form_score NUMERIC(5,2) NOT NULL DEFAULT 80.0,
  progression_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_variations_pathway ON public.exercise_variations(pathway_slug, step_order);

-- ============================================================================
-- 6. EXERCISE_INSTRUCTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL,
  form_cue TEXT,
  common_mistake TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_instructions_exercise ON public.exercise_instructions(exercise_id, step_number);

-- ============================================================================
-- 7. WORKOUT_PLANS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('gym', 'home', 'calisthenics')),
  goal_focus TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 2,
  estimated_duration_min INTEGER NOT NULL DEFAULT 45,
  target_muscles TEXT[] NOT NULL DEFAULT '{}',
  generated_by_ai BOOLEAN NOT NULL DEFAULT TRUE,
  ai_rationale TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON public.workout_plans(user_id, created_at DESC);

-- ============================================================================
-- 8. WORKOUT_PLAN_EXERCISES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workout_plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '10',
  target_duration_sec INTEGER,
  rest_duration_sec INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  progression_suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_plan_exercises_plan ON public.workout_plan_exercises(workout_plan_id, order_index);

-- ============================================================================
-- 9. WORKOUT_SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  session_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('gym', 'home', 'calisthenics')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  good_reps INTEGER NOT NULL DEFAULT 0,
  average_form_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 10),
  calories_burned_est INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'missed', 'cancelled')) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON public.workout_sessions(user_id, started_at DESC);

-- ============================================================================
-- 10. WORKOUT_SESSION_EXERCISES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  completed_sets INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER NOT NULL DEFAULT 3,
  total_reps INTEGER NOT NULL DEFAULT 0,
  good_reps INTEGER NOT NULL DEFAULT 0,
  bad_reps INTEGER NOT NULL DEFAULT 0,
  average_form_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  average_rom_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  used_camera_trainer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_session ON public.workout_session_exercises(workout_session_id);

-- ============================================================================
-- 11. EXERCISE_SETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_exercise_id UUID NOT NULL REFERENCES public.workout_session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  target_reps INTEGER NOT NULL DEFAULT 10,
  completed_reps INTEGER NOT NULL DEFAULT 0,
  good_reps INTEGER NOT NULL DEFAULT 0,
  needs_correction_reps INTEGER NOT NULL DEFAULT 0,
  weight_kg NUMERIC(6,2) DEFAULT 0,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  rest_taken_sec INTEGER NOT NULL DEFAULT 60,
  form_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rom_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  feedback_summary TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 12. EXERCISE_PERFORMANCE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL CHECK (current_level BETWEEN 1 AND 5) DEFAULT 1,
  current_variation_name TEXT NOT NULL,
  personal_best_reps INTEGER NOT NULL DEFAULT 0,
  personal_best_weight_kg NUMERIC(6,2) NOT NULL DEFAULT 0,
  rolling_form_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rolling_consistency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  consecutive_successful_sessions INTEGER NOT NULL DEFAULT 0,
  consecutive_struggle_sessions INTEGER NOT NULL DEFAULT 0,
  last_performed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_performance_user ON public.exercise_performance(user_id);

-- ============================================================================
-- 13. EXERCISE_PROGRESSION_HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_progression_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('progress', 'maintain', 'regress')),
  reason_summary TEXT NOT NULL,
  evidence_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_progression_user ON public.exercise_progression_history(user_id, created_at DESC);

-- ============================================================================
-- 14. FOOD_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_local TEXT,
  category TEXT NOT NULL,
  cuisine_tag TEXT NOT NULL DEFAULT 'bangladeshi',
  serving_size_g NUMERIC(6,2) NOT NULL DEFAULT 100,
  serving_unit_label TEXT NOT NULL DEFAULT '100g',
  calories_kcal NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(5,2) NOT NULL,
  carbs_g NUMERIC(5,2) NOT NULL,
  fat_g NUMERIC(5,2) NOT NULL,
  fiber_g NUMERIC(5,2) NOT NULL DEFAULT 0,
  budget_tier TEXT NOT NULL CHECK (budget_tier IN ('budget', 'moderate', 'premium')) DEFAULT 'budget',
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_items_name ON public.food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_items_cuisine ON public.food_items(cuisine_tag);

-- ============================================================================
-- 15. FOOD_ENTRIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  food_name TEXT NOT NULL,
  entry_method TEXT NOT NULL CHECK (entry_method IN ('manual', 'text', 'voice', 'image')) DEFAULT 'manual',
  portion_grams NUMERIC(6,2) NOT NULL DEFAULT 100,
  servings NUMERIC(4,2) NOT NULL DEFAULT 1,
  calories_kcal NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(5,2) NOT NULL,
  carbs_g NUMERIC(5,2) NOT NULL,
  fat_g NUMERIC(5,2) NOT NULL,
  fiber_g NUMERIC(5,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  ai_confidence NUMERIC(4,2),
  user_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries(user_id, logged_date DESC);

-- ============================================================================
-- 16. MEALS (Generated & Customized Daily Meal Plans)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items_summary TEXT[] NOT NULL DEFAULT '{}',
  total_calories NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(5,2) NOT NULL,
  carbs_g NUMERIC(5,2) NOT NULL,
  fat_g NUMERIC(5,2) NOT NULL,
  fiber_g NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_customized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, plan_date DESC);

-- ============================================================================
-- 17. NUTRITION_TARGETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bmr_kcal INTEGER NOT NULL,
  tdee_kcal INTEGER NOT NULL,
  daily_calorie_target INTEGER NOT NULL,
  protein_target_g INTEGER NOT NULL,
  carbs_target_g INTEGER NOT NULL,
  fat_target_g INTEGER NOT NULL,
  fiber_target_g INTEGER NOT NULL DEFAULT 28,
  water_target_ml INTEGER NOT NULL DEFAULT 2500,
  formula_used TEXT NOT NULL DEFAULT 'Mifflin-St Jeor',
  goal_adjustment_kcal INTEGER NOT NULL DEFAULT 0,
  safety_warnings TEXT[] NOT NULL DEFAULT '{}',
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_targets_user ON public.nutrition_targets(user_id, is_current);

-- ============================================================================
-- 18. WEIGHT_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  body_fat_pct NUMERIC(4,1),
  is_measured BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, logged_date DESC);

-- ============================================================================
-- 19. BODY_MEASUREMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  chest_cm NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hips_cm NUMERIC(5,2),
  bicep_cm NUMERIC(5,2),
  thigh_cm NUMERIC(5,2),
  neck_cm NUMERIC(5,2),
  progress_photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON public.body_measurements(user_id, logged_date DESC);

-- ============================================================================
-- 20. RECOVERY_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC(4,2) NOT NULL DEFAULT 7.5,
  sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5) DEFAULT 4,
  muscle_soreness INTEGER NOT NULL CHECK (muscle_soreness BETWEEN 1 AND 5) DEFAULT 2,
  sore_areas TEXT[] NOT NULL DEFAULT '{}',
  fatigue_level INTEGER NOT NULL CHECK (fatigue_level BETWEEN 1 AND 5) DEFAULT 2,
  stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 5) DEFAULT 2,
  readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100) DEFAULT 80,
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_logs_user_date ON public.recovery_logs(user_id, logged_date DESC);

-- ============================================================================
-- 21. WATER_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs(user_id, logged_date DESC);

-- ============================================================================
-- 22. AI_RECOMMENDATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_source TEXT NOT NULL CHECK (module_source IN ('workout', 'nutrition', 'progression', 'recovery', 'general')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  rationale TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_applied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON public.ai_recommendations(user_id, created_at DESC);

-- ============================================================================
-- 23. AI_CONVERSATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Coaching Session',
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

-- ============================================================================
-- 24. AI_MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at ASC);

-- ============================================================================
-- 25. USER_ACHIEVEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('consistency', 'strength', 'form', 'nutrition', 'recovery')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_code)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
