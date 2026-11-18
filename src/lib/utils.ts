import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getLevelLabel(level: number): string {
  switch (level) {
    case 1:
      return "Level 1: Beginner — Foundation";
    case 2:
      return "Level 2: Novice — Building Strength";
    case 3:
      return "Level 3: Intermediate — Development";
    case 4:
      return "Level 4: Advanced — Performance";
    case 5:
      return "Level 5: Expert — Advanced Skills";
    default:
      return "Level 1: Beginner — Foundation";
  }
}
