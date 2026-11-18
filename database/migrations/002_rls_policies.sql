-- ============================================================================
-- AI FITNESS BRAIN (AIFitCore) — MIGRATION 002: ROW LEVEL SECURITY (RLS)
-- Enforces strict user data isolation across all 25 tables
-- ============================================================================

-- Enable RLS on all 25 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_progression_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. DIRECT USER-OWNED TABLES MACRO POLICIES
DO $$
DECLARE
  tbl TEXT;
  user_tables TEXT[] := ARRAY[
    'user_goals',
    'user_preferences',
    'workout_plans',
    'workout_sessions',
    'exercise_performance',
    'exercise_progression_history',
    'food_entries',
    'meals',
    'nutrition_targets',
    'weight_logs',
    'body_measurements',
    'recovery_logs',
    'water_logs',
    'ai_recommendations',
    'ai_conversations',
    'ai_messages',
    'user_achievements'
  ];
BEGIN
  FOREACH tbl IN ARRAY user_tables LOOP
    EXECUTE format('CREATE POLICY "Users can select own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (auth.uid() = user_id);', tbl, tbl);
  END LOOP;
END $$;

-- 3. CHILD JUNCTION TABLES POLICIES
CREATE POLICY "Users manage own workout_plan_exercises" ON public.workout_plan_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = workout_plan_exercises.workout_plan_id
        AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own workout_session_exercises" ON public.workout_session_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_exercises.workout_session_id
        AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own exercise_sets" ON public.exercise_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_session_exercises wse
      JOIN public.workout_sessions ws ON ws.id = wse.workout_session_id
      WHERE wse.id = exercise_sets.workout_session_exercise_id
        AND ws.user_id = auth.uid()
    )
  );

-- 4. PUBLIC CATALOG READ-ONLY POLICIES
CREATE POLICY "Catalog exercises readable by all" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Catalog variations readable by all" ON public.exercise_variations FOR SELECT USING (true);
CREATE POLICY "Catalog instructions readable by all" ON public.exercise_instructions FOR SELECT USING (true);
CREATE POLICY "Catalog food_items readable by all" ON public.food_items FOR SELECT USING (true);
