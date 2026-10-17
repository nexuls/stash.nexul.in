/**
 * Details: a disclosure for material that would otherwise interrupt the read.
 *
 * Built on native `<details>`/`<summary>` so keyboard, screen-reader and
 * in-page find behaviour come from the browser rather than from JavaScript.
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
        "stash-details group my-6 overflow-hidden rounded-lg border border-border bg-card/40",
        className,
      )}
      {...props}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-sm font-medium",
          "transition-colors hover:bg-muted/50 group-open:border-b group-open:border-border",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden
        />
        <span className="flex-1">{summary}</span>
      </summary>

      <div className="stash-details-content text-[0.9375rem] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {!validation.success && (
          <p className="font-mono text-xs text-destructive">
            Malformed Details: {validation.error.issues[0]?.message}
          </p>
        )}
        {children}
      </div>
    </details>
  );
}
