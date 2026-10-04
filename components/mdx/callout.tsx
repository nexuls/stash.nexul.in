/**
 * Accessible Callout component for MDX documentation.
 *
 * Supports semantic visual variants (note, tip, warning, danger, important)
 * with icons, optional titles, and accessible ARIA attributes.
 * Validates props using calloutPropsSchema to deliver actionable author-facing errors.
 */

import {
  AlertTriangle,
  Info,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type * as React from "react";
import {
  type CalloutProps,
  calloutPropsSchema,
  type NormalizedCalloutType,
  normalizeCalloutType,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

const calloutConfig: Record<
  NormalizedCalloutType,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    containerClass: string;
    borderLeftClass: string;
    iconClass: string;
    iconBadgeClass: string;
    badgeClass: string;
  }
> = {
  note: {
    icon: Info,
    defaultTitle: "Note",
    containerClass: "border-primary/30 bg-primary/5 dark:bg-primary/10",
    borderLeftClass: "border-l-primary",
    iconClass: "text-primary",
    iconBadgeClass: "bg-primary/15",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  tip: {
    icon: Lightbulb,
    defaultTitle: "Tip",
    containerClass:
      "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10",
    borderLeftClass: "border-l-emerald-500",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    iconBadgeClass: "bg-emerald-500/15",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  warning: {
    icon: AlertTriangle,
    defaultTitle: "Warning",
    containerClass: "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10",
    borderLeftClass: "border-l-amber-500",
    iconClass: "text-amber-600 dark:text-amber-400",
    iconBadgeClass: "bg-amber-500/15",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  danger: {
    icon: ShieldAlert,
    defaultTitle: "Danger",
    containerClass:
      "border-destructive/40 bg-destructive/5 dark:bg-destructive/10",
    borderLeftClass: "border-l-destructive",
    iconClass: "text-destructive",
    iconBadgeClass: "bg-destructive/15",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
  },
  important: {
    icon: Sparkles,
    defaultTitle: "Important",
    containerClass:
      "border-purple-500/40 bg-purple-500/5 dark:bg-purple-500/10",
    borderLeftClass: "border-l-purple-500",
    iconClass: "text-purple-600 dark:text-purple-400",
    iconBadgeClass: "bg-purple-500/15",
    badgeClass:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
};

export function Callout({
  type = "note",
  title,
  className,
  children,
  ...rest
}: CalloutProps) {
  // Runtime validation for author-facing diagnostics
  const validation = calloutPropsSchema.safeParse({ type, title, className });
  const hasValidationError = !validation.success;

  const normalized = normalizeCalloutType(type);
  const config = calloutConfig[normalized];
  const Icon = config.icon;
  const isAlert = normalized === "warning" || normalized === "danger";

  return (
    <aside
      role={isAlert ? "alert" : "status"}
      aria-live={isAlert ? "assertive" : "polite"}
      data-callout-type={normalized}
      className={cn(
        "my-6 flex flex-col gap-2 rounded-lg border border-l-[3px] p-4 text-sm leading-relaxed text-foreground shadow-sm transition-colors",
        config.containerClass,
        config.borderLeftClass,
        className,
      )}
      {...rest}
    >
      {hasValidationError && (
        <div className="mb-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs font-mono text-destructive">
          ⚠️ Malformed Callout prop: {validation.error.issues[0]?.message}
        </div>
      )}
      <div className="flex items-center gap-2.5 font-medium">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full p-1.5",
            config.iconBadgeClass,
          )}
        >
          <Icon className={cn("size-5 shrink-0", config.iconClass)} />
        </span>
        <span className="text-lg tracking-tight">
          {title ?? config.defaultTitle}
        </span>
      </div>
      <div className="pl-[38px] text-muted-foreground leading-relaxed [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </aside>
  );
}
