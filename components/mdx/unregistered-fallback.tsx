/**
 * Author-facing fallback for a component tag MDX cannot resolve.
 *
 * Renders in place of the tag instead of throwing, and reports the props that
 * were passed and the tags that do exist, which is usually enough to spot a
 * misspelling without leaving the page.
 */

import { Puzzle } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export interface UnregisteredComponentFallbackProps {
  componentName: string;
  availableComponents?: string[];
  props?: Record<string, unknown>;
  className?: string;
}

/** Formats a prop for display without failing on values JSON cannot encode. */
function formatPropValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "function") return "fn";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export function UnregisteredComponentFallback({
  componentName,
  availableComponents = [],
  props,
  className,
}: UnregisteredComponentFallbackProps) {
  const passedProps = Object.entries(props ?? {}).filter(
    ([key]) => key !== "children" && !key.startsWith("__"),
  );

  return (
    <div
      data-unregistered-component={componentName}
      style={{ "--callout": "var(--warn)" } as React.CSSProperties}
      className={cn(
        "stash-callout my-6 rounded-lg border border-l-[3px] px-4 py-3.5 text-[0.9375rem]",
        className,
      )}
    >
      <p className="flex items-center gap-2 font-medium text-foreground">
        <Puzzle className="stash-callout-mark size-4 shrink-0" aria-hidden />
        <span className="tracking-tight">Unregistered MDX Component</span>
      </p>

      <p className="mt-1.5 text-sm text-muted-foreground">
        <code className="font-mono text-foreground">
          &lt;{componentName} /&gt;
        </code>{" "}
        is used in this entry but is not registered in{" "}
        <code className="font-mono text-foreground">
          components/mdx/registry.tsx
        </code>
        .
      </p>

      {passedProps.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
          {passedProps.map(([key, value]) => (
            <div key={key} className="flex gap-1">
              <dt className="text-foreground">{key}</dt>
              <dd className="text-muted-foreground">
                {formatPropValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {availableComponents.length > 0 && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          <span className="text-foreground">Registered: </span>
          {availableComponents.join(", ")}
        </p>
      )}
    </div>
  );
}
