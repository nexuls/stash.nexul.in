/**
 * Author-facing MDX syntax and compilation error presentation.
 *
 * Renders actionable diagnostics when an MDX document cannot be evaluated,
 * showing the failure reason and resolution steps.
 */

import { AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MdxErrorProps {
  error: Error | string;
  sourcePath?: string;
  className?: string;
}

export function MdxError({ error, sourcePath, className }: MdxErrorProps) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div
      role="alert"
      className={cn(
        "my-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertOctagon className="size-5 shrink-0" />
        <span>Failed to render MDX document</span>
      </div>

      {sourcePath && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Source: <span className="text-foreground">{sourcePath}</span>
        </p>
      )}

      <pre className="mt-3 max-h-60 overflow-x-auto rounded bg-destructive/20 p-3 font-mono text-xs whitespace-pre-wrap">
        {errorMessage}
      </pre>

      <p className="mt-3 text-xs text-muted-foreground">
        Check for unclosed JSX tags, unsupported markdown syntax, or syntax
        errors in embedded expressions.
      </p>
    </div>
  );
}
