"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SECTION 17: AI FITNESS CHATBOT (/ai-coach)
// Context-grounded conversational coach retrieving live user profile, meals & workouts
// ============================================================================

import React, { useState } from "react";
import {
  Bot,
  Brain,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";

const SUGGESTED_PROMPTS = [
  "What should I eat after my workout?",
  "I cannot complete 10 push-ups.",
  "Why did my workout change?",
  "How am I progressing?",
];

export default function AIFitnessCoachPage() {
  const {
    currentUser,
    goal,
    preferences,
    nutritionTargets,
    todayNutrition,
    foodEntries,
    workoutSessions,
    performanceMap,
    progressionHistory,
    recoveryLogs,
    activeWorkoutPlan,
    chatMessages,
    appendChatMessage,
    clearChatHistory,
  } = useFitnessBrain();

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? inputMessage).trim();
    if (!text || !currentUser || !nutritionTargets || !preferences) return;

    setInputMessage("");
    appendChatMessage({
      conversationId: "default-coach-thread",
      role: "user",
      content: text,
    });

    setIsSending(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fitnessChat",
          userId: currentUser.id,
          payload: {
            userMessage: text,
            profile: currentUser,
            goal,
            preferences,
            targets: nutritionTargets,
            todayEntries: foodEntries,
            sessions: workoutSessions,
            performanceMap,
            progressionHistory,
            recoveryLogs,
            activeWorkoutPlan,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        appendChatMessage({
          conversationId: "default-coach-thread",
          role: "assistant",
          content: data.reply,
          modelUsed: data.modelUsed,
          generationMode: data.mode,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lime">Section 17 • Context-Grounded AI Assistant</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            AI Fitness Brain Conversational Coach
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Grounded in your live database profile, remaining daily calories (
            {Math.max(0, todayNutrition?.remainingCalories ?? 0)} kcal left),
            per-exercise levels, and progression audit history.
          </p>
        </div>

        {chatMessages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChatHistory}>
            <Trash2 className="h-3.5 w-3.5" />
            Clear Conversation
          </Button>
        )}
      </div>

      {/* RETRIEVED USER CONTEXT SNAPSHOT BAR */}
      <Card className="p-4 border-[#CCFF00]/30 bg-[#CCFF00]/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-[#CCFF00] flex items-center gap-1.5">
            <Brain className="h-4 w-4" />
            Active Context Injected:
          </span>
          <Badge variant="outline">
            Goal: {goal.replace("_", " ")} ({currentUser?.currentWeightKg} kg)
          </Badge>
          <Badge variant="outline">
            Remaining Today: {Math.max(0, todayNutrition?.remainingCalories ?? 0)}{" "}
            kcal / {todayNutrition?.protein.remainingG ?? 0}g Protein
          </Badge>
          <Badge variant="outline">
            Workouts Logged: {workoutSessions.length}
          </Badge>
          <Badge variant="outline">
            Readiness: {recoveryLogs[0]?.readinessScore ?? 85}%
          </Badge>
        </div>
      </Card>

      {/* QUICK PROMPT CHIPS */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={isSending}
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:border-[#CCFF00] hover:text-[#CCFF00] transition"
          >
            <Sparkles className="h-3 w-3 inline mr-1.5 text-[#CCFF00]" />
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* CHAT THREAD WINDOW */}
      <Card className="p-5 flex flex-col justify-between min-h-[460px]">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {chatMessages.length === 0 && (
            <div className="rounded-2xl border border-border bg-secondary/30 p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#CCFF00] font-bold text-sm">
                <Bot className="h-4 w-4" />
                <span>AI Fitness Brain Coach Ready</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Hello <strong>{currentUser?.fullName}</strong>! I have retrieved
                your active profile, today&apos;s macro balance (
                {todayNutrition?.consumedCalories} /{" "}
                {todayNutrition?.targetCalories} kcal), your per-exercise skill
                levels (Squat Level{" "}
                {performanceMap["bodyweight-squat"]?.currentLevel ?? 2}, Push-Up
                Level {performanceMap["standard-push-up"]?.currentLevel ?? 1}),
                and your latest progression decisions. Click any prompt above or
                ask me a question below!
              </p>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm space-y-2 ${
                  msg.role === "user"
                    ? "bg-[#CCFF00] text-black font-medium"
                    : "border border-border bg-secondary/40 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                  <span className="font-bold uppercase flex items-center gap-1">
                    {msg.role === "user" ? (
                      <>
                        <User className="h-3 w-3" /> {currentUser?.fullName}
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3 text-[#CCFF00]" /> AI Fitness
                        Brain Coach
                      </>
                    )}
                  </span>
                  {msg.modelUsed && <span>{msg.modelUsed}</span>}
                </div>
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-[#CCFF00] p-2">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>
                Retrieving your fitness history and synthesizing response...
              </span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mt-4 pt-4 border-t border-border flex gap-2"
        >
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your post-workout meal, push-up regression, workout changes, or progress..."
            disabled={isSending}
          />
          <Button type="submit" variant="primary" disabled={isSending}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
