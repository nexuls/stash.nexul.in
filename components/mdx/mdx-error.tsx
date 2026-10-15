/**
 * Author-facing MDX compilation failure.
 *
 * A broken entry renders this in place of its body rather than failing the
 * page, so the rest of the document and the navigation stay usable while the
 * author fixes the source. It states the file, the compiler's own message, and
 * what usually causes it.
 */

import { OctagonAlert } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export interface MdxErrorProps {
  error: Error | string;
  sourcePath?: string;
  className?: string;
}

const COMMON_CAUSES = [
  "An unclosed or mismatched JSX tag",
  "An expression in braces that is not valid JavaScript",
  "A component used with a lowercase name, which MDX treats as HTML",
  "Indentation inside a component that Markdown reads as a code block",
];

export function MdxError({ error, sourcePath, className }: MdxErrorProps) {
  const message = typeof error === "string" ? error : error.message;

  return (
    <div
      style={{ "--callout": "var(--danger)" } as React.CSSProperties}
      className={cn(
        "stash-callout my-6 rounded-lg border border-l-[3px] px-4 py-3.5 text-[0.9375rem]",
        className,
      )}
    >
      <p className="flex items-center gap-2 font-medium text-foreground">
        <OctagonAlert
          className="stash-callout-mark size-4 shrink-0"
          aria-hidden
        />
        <span className="tracking-tight">This entry could not be compiled</span>
      </p>

      {sourcePath && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {sourcePath}
        </p>
      )}

      <pre className="mt-3 max-h-60 overflow-auto rounded-md border border-border bg-code px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
        {message}
      </pre>

      <p className="mt-3 text-sm text-muted-foreground">Usually caused by:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
        {COMMON_CAUSES.map((cause) => (
          <li key={cause}>{cause}</li>
        ))}
      </ul>
    </div>
  );
}
