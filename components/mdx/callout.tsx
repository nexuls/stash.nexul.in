/**
 * Callout: an aside that marks how a passage should be read.
 *
 * Each variant differs only by hue and icon. The hue travels as a single custom
 * property consumed by `.stash-callout` in the stylesheet, so border, tint and
 * icon color cannot drift apart as variants are added.
 */

import { CircleAlert, Info, Lightbulb, OctagonAlert, Star } from "lucide-react";
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
    /** Name of the hue token in globals.css. */
    hue: string;
  }
> = {
  note: { icon: Info, defaultTitle: "Note", hue: "note" },
  tip: { icon: Lightbulb, defaultTitle: "Tip", hue: "tip" },
  warning: { icon: CircleAlert, defaultTitle: "Warning", hue: "warn" },
  danger: { icon: OctagonAlert, defaultTitle: "Danger", hue: "danger" },
  important: { icon: Star, defaultTitle: "Important", hue: "highlight" },
};

export function Callout({
  type = "note",
  title,
  compact = false,
  className,
  children,
  ...rest
}: CalloutProps) {
  const validation = calloutPropsSchema.safeParse({
    type,
    title,
    compact,
    className,
  });

  const normalized = normalizeCalloutType(type);
  const config = calloutConfig[normalized];
  const Icon = config.icon;
  const isAlert = normalized === "warning" || normalized === "danger";
  const heading = title ?? (compact ? undefined : config.defaultTitle);

  return (
    <aside
      // A warning or danger note is an interruption; the rest is context a
      // screen reader should reach in document order, not be interrupted by.
      role={isAlert ? "note" : undefined}
      aria-label={isAlert ? `${config.defaultTitle}: ${heading}` : undefined}
      data-callout={normalized}
      style={{ "--callout": `var(--${config.hue})` } as React.CSSProperties}
      className={cn(
        "stash-callout my-6 rounded-lg border border-l-[3px] text-[0.9375rem] leading-relaxed",
        compact ? "flex items-baseline gap-2.5 px-4 py-3" : "px-4 py-3.5",
        className,
      )}
      {...rest}
    >
      {!validation.success && (
        <p className="mb-2 font-mono text-xs text-destructive">
          Malformed Callout: {validation.error.issues[0]?.message}
        </p>
      )}

      {compact ? (
        <>
          <Icon
            className="stash-callout-mark mt-0.5 size-4 shrink-0 self-start"
            aria-hidden
          />
          <div className="min-w-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {children}
          </div>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Icon className="stash-callout-mark size-4 shrink-0" aria-hidden />
            <span className="tracking-tight">{heading}</span>
          </p>
          <div className="mt-1.5 text-foreground/80 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {children}
          </div>
        </>
      )}
    </aside>
  );
}
