"use client";

// ============================================================================
// AI FITNESS BRAIN (AIFitCore) — REUSABLE SHADCN/UI COMPONENT PRIMITIVES
// Button, Card, Badge, Progress, Input, Label, Modal Dialog, Skeleton
// ============================================================================

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[#CCFF00] text-[#090A0F] font-semibold hover:bg-[#d8ff33] active:scale-[0.99] shadow-[0_0_20px_-4px_rgba(204,255,0,0.45)]",
    secondary:
      "bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80",
    outline:
      "border border-border bg-transparent hover:bg-secondary/60 text-foreground font-medium",
    ghost: "bg-transparent hover:bg-secondary/50 text-foreground font-medium",
    danger:
      "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 font-medium",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-10 px-4 py-2 text-sm rounded-xl",
    lg: "h-12 px-6 text-base rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md text-card-foreground shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "lime" | "emerald" | "amber" | "red" | "outline";
  children: React.ReactNode;
}) {
  const styles = {
    default: "bg-secondary text-secondary-foreground border-border",
    lime: "bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/30",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    red: "bg-red-500/15 text-red-400 border-red-500/30",
    outline: "bg-transparent text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  colorClass = "bg-[#CCFF00]",
  className,
}: {
  value: number;
  max?: number;
  colorClass?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("h-full rounded-full", colorClass)}
      />
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-2xl",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl",
          maxWidthClass
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </motion.div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-secondary/70", className)}
    />
  );
}
