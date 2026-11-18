"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — RESPONSIVE DASHBOARD NAVIGATION SHELL
// Desktop sidebar + Mobile drawer + Bottom quick-nav + Dark/Light Theme Toggle
// ============================================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Apple,
  Bot,
  Brain,
  Camera,
  ChevronRight,
  Compass,
  Dumbbell,
  Flame,
  HeartPulse,
  History,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  Utensils,
  X,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { Badge, Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  group: "core" | "training" | "nutrition" | "intelligence";
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Main Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "core",
  },
  {
    label: "Fitness Onboarding",
    href: "/onboarding",
    icon: UserCheck,
    group: "core",
  },
  {
    label: "AI Camera Trainer",
    href: "/trainer",
    icon: Camera,
    badge: "CV LIVE",
    group: "training",
  },
  {
    label: "Workout Planner",
    href: "/workouts",
    icon: Sparkles,
    group: "training",
  },
  {
    label: "Gym Training",
    href: "/gym",
    icon: Dumbbell,
    group: "training",
  },
  {
    label: "Home Workout",
    href: "/home",
    icon: Home,
    group: "training",
  },
  {
    label: "Calisthenics Skills",
    href: "/calisthenics",
    icon: Flame,
    group: "training",
  },
  {
    label: "Diet & Meal Planner",
    href: "/nutrition",
    icon: Utensils,
    group: "nutrition",
  },
  {
    label: "Food & Calorie Brain",
    href: "/food-tracker",
    icon: Apple,
    group: "nutrition",
  },
  {
    label: "AI Fitness Assistant",
    href: "/ai-coach",
    icon: Bot,
    badge: "AI",
    group: "intelligence",
  },
  {
    label: "Progress Analytics",
    href: "/progress",
    icon: LineChart,
    group: "intelligence",
  },
  {
    label: "Fitness History",
    href: "/history",
    icon: History,
    group: "intelligence",
  },
  {
    label: "Recovery Tracking",
    href: "/recovery",
    icon: HeartPulse,
    group: "intelligence",
  },
  {
    label: "Profile & Settings",
    href: "/settings",
    icon: Settings,
    group: "intelligence",
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isHydrated,
    isAuthenticated,
    isSupabaseLive,
    currentUser,
    goal,
    todayNutrition,
    latestReadinessScore,
    signOut,
  } = useFitnessBrain();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [isDark]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const renderNavSection = (
    title: string,
    groupKey: NavItem["group"]
  ) => {
    const items = NAV_ITEMS.filter((i) => i.group === groupKey);
    return (
      <div className="mb-5">
        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
          {title}
        </p>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#CCFF00] text-[#090A0F] font-semibold shadow-[0_0_20px_-6px_rgba(204,255,0,0.5)]"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-105",
                      active ? "text-[#090A0F]" : "text-muted-foreground group-hover:text-[#CCFF00]"
                    )}
                  />
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      active
                        ? "bg-black/20 text-black"
                        : "bg-[#CCFF00]/15 text-[#CCFF00]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card/60 backdrop-blur-xl z-30">
        <div className="flex items-center justify-between h-16 px-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CCFF00] text-[#090A0F] shadow-[0_0_20px_-4px_rgba(204,255,0,0.6)]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight block leading-none">
                AI FITNESS <span className="text-[#CCFF00]">BRAIN</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                AIFitCore v1.0
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Athlete Mini Status Card */}
        {isHydrated && currentUser && (
          <div className="mx-4 mt-4 rounded-xl border border-border bg-secondary/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  Goal: {goal.replace("_", " ")} • {currentUser.currentWeightKg} kg
                </p>
              </div>
              <Badge variant={latestReadinessScore >= 75 ? "lime" : "amber"}>
                {latestReadinessScore}% Ready
              </Badge>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {renderNavSection("Command Center", "core")}
          {renderNavSection("Training & Vision", "training")}
          {renderNavSection("Nutrition & Calories", "nutrition")}
          {renderNavSection("Intelligence & Memory", "intelligence")}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#CCFF00]" />
              {isSupabaseLive ? "Supabase RLS Live" : "Local-First Vault"}
            </span>
            <Link href="/" className="hover:text-[#CCFF00] underline">
              Landing
            </Link>
          </div>
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out ({currentUser?.email})
            </Button>
          ) : (
            <Link href="/login" className="block">
              <Button variant="primary" size="sm" className="w-full">
                Sign In / Register
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen pb-20 lg:pb-8">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-xl border border-border p-2 text-foreground hover:bg-secondary"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-[#CCFF00]" />
              <span>Adaptive Intelligence Active</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground capitalize">
                {pathname.replace("/", "").replace("-", " ") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {todayNutrition && (
              <Link
                href="/food-tracker"
                className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-1.5 text-xs hover:border-[#CCFF00]/50 transition"
              >
                <Flame className="h-3.5 w-3.5 text-[#CCFF00]" />
                <span className="font-semibold">
                  {todayNutrition.consumedCalories} / {todayNutrition.targetCalories} kcal
                </span>
                <span className="text-muted-foreground">
                  ({todayNutrition.protein.consumedG}g P)
                </span>
              </Link>
            )}

            <Link href="/trainer">
              <Button size="sm" variant="primary">
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Camera Trainer</span>
                <span className="sm:hidden">Trainer</span>
              </Button>
            </Link>

            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle color theme"
              className="lg:hidden rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              className="relative w-72 max-w-[85vw] bg-card border-r border-border h-full flex flex-col z-10"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CCFF00] text-black">
                    <Brain className="h-4 w-4" />
                  </div>
                  <span className="font-extrabold text-sm">AI FITNESS BRAIN</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {renderNavSection("Command Center", "core")}
                {renderNavSection("Training & Vision", "training")}
                {renderNavSection("Nutrition & Calories", "nutrition")}
                {renderNavSection("Intelligence & Memory", "intelligence")}
              </div>
            </motion.div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            {children}
          </motion.div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around">
          {[
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Workouts", href: "/workouts", icon: Compass },
            { label: "CV Trainer", href: "/trainer", icon: Camera },
            { label: "Nutrition", href: "/food-tracker", icon: Apple },
            { label: "AI Coach", href: "/ai-coach", icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[11px] font-medium",
                  active ? "text-[#CCFF00]" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
