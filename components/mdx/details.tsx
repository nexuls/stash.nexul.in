/**
 * Accessible disclosure / collapsible component for MDX.
 *
 * Uses native `<details>` and `<summary>` for native browser keyboard and screen
 * reader accessibility, styled with animated chevron and clean borders.
 * Validates props using detailsPropsSchema.
 */

import { ChevronRight } from "lucide-react";
import { type DetailsProps, detailsPropsSchema } from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

export function Details({
  summary,
  defaultOpen = false,
  className,
  children,
  ...props
}: DetailsProps) {
  const validation = detailsPropsSchema.safeParse({
    summary,
    defaultOpen,
    className,
  });

  return (
    <details
      open={defaultOpen}
      className={cn(
        "group my-4 rounded-lg border border-border bg-card/50 text-card-foreground transition-all [&[open]]:bg-card",
        className,
      )}
      {...props}
    >
      {!validation.success && (
        <div className="m-3 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs font-mono text-destructive">
          ⚠️ Malformed Details: {validation.error.issues[0]?.message}
        </div>
      )}
      <summary className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
        <span>{summary}</span>
      </summary>
      <div className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
