/**
 * Author-facing fallback for unregistered MDX components.
 *
 * Renders a descriptive diagnostic banner when an author uses a component tag
 * in MDX that has not been registered in the component registry, preventing
 * silent failures or obscure React runtime crashes.
 */

import { Puzzle, Package, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UnregisteredComponentFallbackProps {
  componentName: string;
  availableComponents?: string[];
  props?: Record<string, unknown>;
  className?: string;
}

export function UnregisteredComponentFallback({
  componentName,
  availableComponents = ["Callout", "Tabs", "Tab", "Details", "CodeBlock"],
  props,
  className,
}: UnregisteredComponentFallbackProps) {
  // Filter out internal React props for display
  const passedPropKeys = props
    ? Object.keys(props).filter(
        (key) => key !== "children" && !key.startsWith("__"),
      )
    : [];

  return (
    <div
      role="alert"
      data-unregistered-component={componentName}
      className={cn(
        "my-4 rounded-lg border border-amber-500/50 border-l-[3px] border-l-amber-500 bg-amber-500/10 p-5 text-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Puzzle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-sans text-sm font-semibold text-amber-700 dark:text-amber-400">
            Unregistered MDX Component
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            &lt;{componentName} /&gt;
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
        <BookOpen className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        This component was authored in the MDX file but has not been registered
        in{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
          components/mdx/registry.tsx
        </code>
      </p>

      {passedPropKeys.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-amber-500/20 pt-3">
          <p className="text-xs font-semibold text-foreground">
            Props passed:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {passedPropKeys.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1 font-mono text-[11px] text-muted-foreground"
              >
                <span className="font-semibold text-foreground">{k}</span>
                <span className="text-amber-600 dark:text-amber-400">=</span>
                {JSON.stringify(props?.[k])}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2 border-t border-amber-500/20 pt-3">
        <p className="text-xs font-semibold text-foreground">
          Resolution Guide
        </p>
        <ol className="ml-5 list-decimal space-y-1 text-xs text-muted-foreground">
          <li>
            Create the{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
              {componentName}
            </code>{" "}
            component in your components directory
          </li>
          <li>
            Register it in{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
              components/mdx/registry.tsx
            </code>{" "}
            by adding it to the components map
          </li>
        </ol>
      </div>

      <div className="mt-4 border-t border-amber-500/20 pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <Package className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
          Available Components
        </p>
        <div className="flex flex-wrap gap-1.5">
          {availableComponents.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 font-mono text-[11px] text-foreground"
            >
              <Package className="size-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
