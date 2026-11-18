"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — SECTION 14: FOOD TRACKER & CALORIE BRAIN (/food-tracker)
// 4 Logging Modes: 1. Database Search, 2. Natural Text, 3. Voice Dictation, 4. Vision Image Upload
// ============================================================================

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Apple,
  Camera,
  CheckCircle2,
  Droplets,
  Flame,
  Mic,
  MicOff,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useFitnessBrain } from "@/lib/supabase/app-state";
import {
  FOOD_CATALOG,
  ParsedFoodCandidate,
  parseNaturalFoodDescription,
  searchFoodCatalog,
} from "@/services/nutrition/food-catalog";
import { FoodCatalogItem, FoodEntryMethod, MealType } from "@/types/fitness";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  ProgressBar,
} from "@/components/ui/primitives";
import { getTodayDateString } from "@/lib/utils";

export default function FoodTrackerPage() {
  const {
    currentUser,
    todayNutrition,
    foodEntries,
    addFoodEntry,
    deleteFoodEntry,
    logWaterIntake,
  } = useFitnessBrain();

  const [activeTab, setActiveTab] = useState<FoodEntryMethod>("manual");
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("lunch");

  // 1. Manual Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);

  // 2. Text & 3. Voice Description State
  const [naturalText, setNaturalText] = useState(
    "2 rotis, 2 boiled eggs and 1 cup thick masoor dal"
  );
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);

  // 4. Image Upload Vision State
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageHintText, setImageHintText] = useState(
    "Bangladeshi rice plate with rui fish curry, masoor dal and mixed sabzi"
  );
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);

  // Pending Candidates Requiring User Confirmation (Never assumes exact image/text weight!)
  const [pendingCandidates, setPendingCandidates] = useState<
    ParsedFoodCandidate[]
  >([]);
  const [uncertaintyMessage, setUncertaintyMessage] = useState<string | null>(
    null
  );

  const searchResults = useMemo(
    () => searchFoodCatalog(searchQuery, cuisineFilter),
    [searchQuery, cuisineFilter]
  );

  if (!todayNutrition) return null;

  const today = getTodayDateString();
  const todayLoggedItems = foodEntries.filter((e) => e.loggedDate === today);

  // Log directly from verified catalog item
  const handleLogCatalogItem = (item: FoodCatalogItem) => {
    const mult = Math.max(0.25, Math.min(10, servingMultiplier || 1));
    addFoodEntry({
      foodItemId: item.id,
      mealType: selectedMealType,
      foodName: `${item.name} (${mult}x serving)`,
      entryMethod: "manual",
      portionGrams: Math.round(item.servingSizeG * mult),
      servings: mult,
      caloriesKcal: Math.round(item.caloriesKcal * mult),
      proteinG: Number((item.proteinG * mult).toFixed(1)),
      carbsG: Number((item.carbsG * mult).toFixed(1)),
      fatG: Number((item.fatG * mult).toFixed(1)),
      fiberG: Number((item.fiberG * mult).toFixed(1)),
      userConfirmed: true,
    });
  };

  // Parse natural text or voice transcript into editable confirmation items
  const handleParseTextOrVoice = (method: "text" | "voice") => {
    const parsed = parseNaturalFoodDescription(naturalText);
    setPendingCandidates(parsed);
    setUncertaintyMessage(
      `Parsed ${parsed.length} item(s) from your ${method} description. Please confirm or adjust estimated portion grams before saving to your log.`
    );
  };

  // Web Speech API Voice Recognition
  const handleToggleVoiceDictation = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus(
        "Browser SpeechRecognition API not detected in this browser—use the natural voice transcript box below and click Parse Voice Description."
      );
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      setIsListeningVoice(true);
      setVoiceStatus("Listening... Speak your meal (e.g., '1 bowl rice, chicken curry and dal')");

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setNaturalText(transcript);
          setVoiceStatus(`Captured voice: "${transcript}"`);
          const parsed = parseNaturalFoodDescription(transcript);
          setPendingCandidates(parsed);
        }
        setIsListeningVoice(false);
      };
      recognition.onerror = () => {
        setIsListeningVoice(false);
        setVoiceStatus(
          "Microphone access unavailable—type or edit your voice transcript below."
        );
      };
      recognition.onend = () => {
        setIsListeningVoice(false);
      };
      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  // Handle Food Image Upload & Vision Analysis
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeFoodPhoto = async () => {
    setIsAnalyzingVision(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyzeFoodImage",
          userId: currentUser?.id,
          payload: {
            imageBase64OrUrl: imagePreviewUrl || "sample_plate",
            userHintText: imageHintText,
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setPendingCandidates(data.detectedItems || []);
        setUncertaintyMessage(
          data.uncertaintyNotice ||
            "Never assume a photo gives an exact weight. Please confirm or adjust the estimated portions below before saving."
        );
      }
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  const handleConfirmCandidate = (idx: number) => {
    const cand = pendingCandidates[idx];
    if (!cand) return;
    addFoodEntry({
      mealType: selectedMealType,
      foodName: cand.foodName,
      entryMethod: activeTab,
      portionGrams: cand.portionGrams,
      servings: cand.servings,
      caloriesKcal: cand.caloriesKcal,
      proteinG: cand.proteinG,
      carbsG: cand.carbsG,
      fatG: cand.fatG,
      fiberG: cand.fiberG,
      aiConfidence: cand.confidence,
      userConfirmed: true,
    });
    setPendingCandidates((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCandidatePortion = (idx: number, newGrams: number) => {
    setPendingCandidates((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const ratio = Math.max(0.1, newGrams / Math.max(1, c.portionGrams));
        return {
          ...c,
          portionGrams: newGrams,
          caloriesKcal: Math.round(c.caloriesKcal * ratio),
          proteinG: Number((c.proteinG * ratio).toFixed(1)),
          carbsG: Number((c.carbsG * ratio).toFixed(1)),
          fatG: Number((c.fatG * ratio).toFixed(1)),
          fiberG: Number((c.fiberG * ratio).toFixed(1)),
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="lime">Section 14 • Deterministic Calorie Brain</Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Food Tracker &amp; Calorie Brain
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Log meals via Manual Search, Text Description, Voice Dictation, or
            Vision Food Image Recognition. All daily totals are 100%
            deterministic.
          </p>
        </div>
      </div>

      {/* DAILY NUTRITION DASHBOARD SUMMARY */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 lg:col-span-2 flex flex-col justify-between border-[#CCFF00]/40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
                Deterministic Daily Calorie Balance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black">
                  {todayNutrition.consumedCalories}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {todayNutrition.targetCalories} kcal target
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Remaining
              </span>
              <span className="text-xl font-black text-[#CCFF00]">
                {Math.max(0, todayNutrition.remainingCalories)} kcal
              </span>
            </div>
          </div>
          <ProgressBar
            value={todayNutrition.consumedCalories}
            max={todayNutrition.targetCalories}
            className="mt-3"
          />
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-emerald-400">Protein</span>
            <span>
              {todayNutrition.protein.consumedG} /{" "}
              {todayNutrition.protein.targetG}g
            </span>
          </div>
          <ProgressBar
            value={todayNutrition.protein.consumedG}
            max={todayNutrition.protein.targetG}
            colorClass="bg-emerald-400"
          />
          <span className="text-[11px] text-muted-foreground block">
            Remaining: {todayNutrition.protein.remainingG}g
          </span>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-sky-400">Carbohydrates</span>
            <span>
              {todayNutrition.carbs.consumedG} / {todayNutrition.carbs.targetG}g
            </span>
          </div>
          <ProgressBar
            value={todayNutrition.carbs.consumedG}
            max={todayNutrition.carbs.targetG}
            colorClass="bg-sky-400"
          />
          <span className="text-[11px] text-muted-foreground block">
            Fiber: {todayNutrition.fiber.consumedG}/
            {todayNutrition.fiber.targetG}g
          </span>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-amber-300">Dietary Fat</span>
            <span>
              {todayNutrition.fat.consumedG} / {todayNutrition.fat.targetG}g
            </span>
          </div>
          <ProgressBar
            value={todayNutrition.fat.consumedG}
            max={todayNutrition.fat.targetG}
            colorClass="bg-amber-400"
          />
          <span className="text-[11px] text-muted-foreground block">
            Remaining: {todayNutrition.fat.remainingG}g
          </span>
        </Card>
      </div>

      {/* 4-MODE FOOD LOGGER */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-5">
            {/* Meal Slot & Entry Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex gap-1.5">
                {(
                  [
                    { id: "manual", label: "1. Food Search", icon: Search },
                    { id: "text", label: "2. Text Input", icon: Sparkles },
                    { id: "voice", label: "3. Voice Log", icon: Mic },
                    { id: "image", label: "4. Photo Vision", icon: Camera },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        active
                          ? "bg-[#CCFF00] text-black"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <select
                value={selectedMealType}
                onChange={(e) =>
                  setSelectedMealType(e.target.value as MealType)
                }
                className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-bold uppercase"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snack">Snack</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            {/* MODE 1: MANUAL DATABASE SEARCH */}
            {activeTab === "manual" && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Search Bangladeshi &amp; Global Foods</Label>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., Bhat, Roti, Rohu Fish, Dal, Egg, Chicken..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Cuisine Filter</Label>
                    <select
                      value={cuisineFilter}
                      onChange={(e) => setCuisineFilter(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-xs"
                    >
                      <option value="all">All Foods</option>
                      <option value="bangladeshi">Bangladeshi Staples</option>
                      <option value="international">Global Staples</option>
                    </select>
                  </div>
                  <div>
                    <Label>Servings Multiplier</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min={0.25}
                      max={10}
                      value={servingMultiplier}
                      onChange={(e) =>
                        setServingMultiplier(Number(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm">
                            {item.name}
                          </span>
                          {item.nameLocal && (
                            <span className="text-xs text-muted-foreground">
                              ({item.nameLocal})
                            </span>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {item.cuisineTag}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.servingUnitLabel} •{" "}
                          <strong className="text-[#CCFF00]">
                            {Math.round(item.caloriesKcal * servingMultiplier)}{" "}
                            kcal
                          </strong>{" "}
                          •{" "}
                          <span className="text-emerald-400">
                            {(item.proteinG * servingMultiplier).toFixed(1)}g P
                          </span>{" "}
                          • {(item.carbsG * servingMultiplier).toFixed(1)}g C •{" "}
                          {(item.fatG * servingMultiplier).toFixed(1)}g F
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleLogCatalogItem(item)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Log
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODE 2: NATURAL TEXT DESCRIPTION */}
            {activeTab === "text" && (
              <div className="space-y-4">
                <div>
                  <Label>Describe Your Meal in Natural Language</Label>
                  <textarea
                    rows={3}
                    value={naturalText}
                    onChange={(e) => setNaturalText(e.target.value)}
                    placeholder="e.g., 2 rotis, 2 boiled eggs, 1 cup masoor dal and 1 banana"
                    className="mt-1.5 w-full rounded-xl border border-border bg-secondary/50 p-3 text-sm"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleParseTextOrVoice("text")}
                >
                  <Sparkles className="h-4 w-4" />
                  Estimate Portions &amp; Review Macros
                </Button>
              </div>
            )}

            {/* MODE 3: VOICE DESCRIPTION */}
            {activeTab === "voice" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-secondary/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold">
                      Voice Meal Dictation (Web Speech API)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Speak your meal items and quantities aloud or refine the
                      transcript below.
                    </p>
                  </div>
                  <Button
                    variant={isListeningVoice ? "danger" : "primary"}
                    onClick={handleToggleVoiceDictation}
                  >
                    {isListeningVoice ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Start Voice Dictation
                      </>
                    )}
                  </Button>
                </div>

                {voiceStatus && (
                  <p className="text-xs text-[#CCFF00]">{voiceStatus}</p>
                )}

                <div>
                  <Label>Voice Transcript</Label>
                  <Input
                    value={naturalText}
                    onChange={(e) => setNaturalText(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <Button
                  variant="secondary"
                  onClick={() => handleParseTextOrVoice("voice")}
                >
                  Parse Voice Description for Confirmation
                </Button>
              </div>
            )}

            {/* MODE 4: VISION FOOD IMAGE UPLOAD */}
            {activeTab === "image" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-dashed border-[#CCFF00]/40 bg-[#CCFF00]/5 p-5 text-center space-y-3">
                  <Camera className="h-8 w-8 text-[#CCFF00] mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold">
                      Upload Food Photograph for Vision Recognition
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Uses vision-capable OpenRouter model to identify items,
                      estimate portion grams, and prompt you to confirm before
                      saving.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-bold cursor-pointer hover:bg-secondary/80">
                    <Upload className="h-4 w-4 text-[#CCFF00]" />
                    <span>Choose Meal Photo (JPG/PNG/WebP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  {imagePreviewUrl && (
                    <div className="mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreviewUrl}
                        alt="Uploaded meal preview"
                        className="max-h-44 mx-auto rounded-xl border border-border object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>
                    Optional Dish Label / Context Hint (Improves curry &amp;
                    cooking oil estimation)
                  </Label>
                  <Input
                    value={imageHintText}
                    onChange={(e) => setImageHintText(e.target.value)}
                    className="mt-1.5"
                    placeholder="e.g., Steamed rice with rui fish curry and dal"
                  />
                </div>

                <Button
                  variant="primary"
                  disabled={isAnalyzingVision}
                  onClick={handleAnalyzeFoodPhoto}
                >
                  <Sparkles className="h-4 w-4" />
                  {isAnalyzingVision
                    ? "Analyzing Meal Photo..."
                    : "Analyze Photo & Estimate Macros"}
                </Button>
              </div>
            )}

            {/* USER CONFIRMATION STEP FOR TEXT / VOICE / IMAGE ESTIMATES */}
            {pendingCandidates.length > 0 && (
              <div className="rounded-2xl border border-[#CCFF00] bg-[#CCFF00]/5 p-4 space-y-3">
                <div className="flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Confirmation Required:</strong>{" "}
                    {uncertaintyMessage ??
                      "An image or text description never gives an exact weight. Adjust grams if needed and click Confirm & Save."}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {pendingCandidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">
                            {cand.foodName}
                          </span>
                          <Badge variant="lime">
                            {Math.round(cand.confidence * 100)}% Est. Match
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <strong className="text-[#CCFF00]">
                            {cand.caloriesKcal} kcal
                          </strong>{" "}
                          • {cand.proteinG}g Protein • {cand.carbsG}g Carbs •{" "}
                          {cand.fatG}g Fat
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Input
                            type="number"
                            min={10}
                            max={2000}
                            value={cand.portionGrams}
                            onChange={(e) =>
                              updateCandidatePortion(
                                idx,
                                Number(e.target.value)
                              )
                            }
                            className="h-8 text-xs"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            Portion (g)
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleConfirmCandidate(idx)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm &amp; Save
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT 5 COLS: TODAY'S MEAL LOGS & HYDRATION */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold">
                Today&apos;s Confirmed Food Log ({todayLoggedItems.length})
              </h2>
              <Badge variant="outline">{today}</Badge>
            </div>

            {todayLoggedItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No food entries logged today yet. Search or scan a meal on the
                left!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {todayLoggedItems.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-border bg-secondary/30 p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="lime" className="uppercase text-[10px]">
                          {entry.mealType}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          via {entry.entryMethod}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm mt-1">
                        {entry.foodName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {entry.portionGrams}g •{" "}
                        <strong className="text-[#CCFF00]">
                          {entry.caloriesKcal} kcal
                        </strong>{" "}
                        • {entry.proteinG}g P • {entry.carbsG}g C • {entry.fatG}g
                        F
                      </p>
                    </div>
                    <button
                      onClick={() => deleteFoodEntry(entry.id)}
                      aria-label="Delete food entry"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* WATER TRACKING CARD */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-bold">Daily Water &amp; Hydration</h3>
              </div>
              <span className="text-xs font-bold text-sky-400">
                {todayNutrition.water.consumedMl} /{" "}
                {todayNutrition.water.targetMl} ml ({todayNutrition.water.pct}%)
              </span>
            </div>
            <ProgressBar
              value={todayNutrition.water.consumedMl}
              max={todayNutrition.water.targetMl}
              colorClass="bg-sky-400"
            />
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => logWaterIntake(250)}
              >
                +250 ml
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => logWaterIntake(500)}
              >
                +500 ml
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => logWaterIntake(750)}
              >
                +750 ml
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
