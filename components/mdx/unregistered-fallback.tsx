/**
 * Author-facing fallback for unregistered MDX components.
 *
 * Renders a descriptive diagnostic banner when an author uses a component tag
 * in MDX that has not been registered in the component registry, preventing
 * silent failures or obscure React runtime crashes.
 */

import { AlertTriangle, HelpCircle } from "lucide-react";
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
        "my-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 font-mono text-xs text-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-sans text-sm font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>Unregistered MDX Component: &lt;{componentName} /&gt;</span>
      </div>

      <p className="mt-2 font-sans text-xs text-muted-foreground">
        This component was authored in the MDX file but has not been registered
        in{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
          components/mdx/registry.tsx
        </code>
        .
      </p>

      {passedPropKeys.length > 0 && (
        <div className="mt-2 text-muted-foreground">
          <span className="text-foreground">Props passed: </span>
          {passedPropKeys.map((k) => (
            <span key={k} className="mr-1 rounded bg-muted px-1 py-0.5">
              {k}={JSON.stringify(props?.[k])}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 border-t border-amber-500/20 pt-2 font-sans text-[11px] text-muted-foreground">
        <HelpCircle className="size-3 text-amber-600 dark:text-amber-400" />
        <span>Available components: </span>
        <span className="font-mono text-foreground">
          {availableComponents.join(", ")}
        </span>
      </div>
    </div>
  );
}
