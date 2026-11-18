import type { Metadata } from "next";
import "./globals.css";
import { FitnessBrainProvider } from "@/lib/supabase/app-state";

export const metadata: Metadata = {
  title: "AI Fitness Brain (AIFitCore) — Your Body. Your Goals. Your AI Personal Trainer.",
  description:
    "An intelligent fitness companion that understands your body, watches your movements with MediaPipe Computer Vision, builds personalized workouts, tracks your nutrition, and adapts as you progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <FitnessBrainProvider>{children}</FitnessBrainProvider>
      </body>
    </html>
  );
}
