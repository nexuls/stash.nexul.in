"use client";

/**
 * Steps: a numbered procedure.
 *
 * Numbers here are information, not decoration — the order is the content. A
 * continuous rail connects the markers so a step that spans a code block still
 * reads as part of the sequence.
 */

import * as React from "react";
import {
  type StepProps,
  type StepsProps,
  stepPropsSchema,
  stepsPropsSchema,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

const StepNumberContext = React.createContext<number | null>(null);

export function Step({ title, className, children, ...props }: StepProps) {
  const number = React.useContext(StepNumberContext);
  const validation = stepPropsSchema.safeParse({ title, className });

  return (
    <li
      className={cn(
        "relative pb-6 pl-10 last:pb-0",
        // The rail is drawn by the list item so it stops at the last marker.
        "before:absolute before:top-7 before:bottom-0 before:left-2.75 before:w-px before:bg-border",
        "last:before:hidden",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 inline-flex size-6 items-center justify-center rounded-full",
          "border border-border bg-card font-mono text-[11px] text-muted-foreground tabular-nums",
        )}
      >
        {number ?? "•"}
      </span>

      {title && (
        <p className="font-medium text-foreground leading-6">{title}</p>
      )}

      <div
        className={cn(
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          title && "mt-2",
        )}
      >
        {!validation.success && (
          <p className="font-mono text-xs text-destructive">
            Malformed Step: {validation.error.issues[0]?.message}
          </p>
        )}
        {children}
      </div>
    </li>
  );
}

export function Steps({
  start = 1,
  className,
  children,
  ...props
}: StepsProps) {
  const validation = stepsPropsSchema.safeParse({ start, className });
  const steps = React.Children.toArray(children).filter(React.isValidElement);

  return (
    <ol className={cn("my-6 list-none pl-0", className)} {...props}>
      {!validation.success && (
        <li className="font-mono text-xs text-destructive">
          Malformed Steps: {validation.error.issues[0]?.message}
        </li>
      )}
      {steps.map((step, index) => (
        <StepNumberContext.Provider
          // Position in the sequence is the identity of a step.
          key={step.key ?? `step-${index}`}
          value={start + index}
        >
          {step}
        </StepNumberContext.Provider>
      ))}
    </ol>
  );
}
