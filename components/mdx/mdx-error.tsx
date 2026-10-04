/**
 * Author-facing MDX syntax and compilation error presentation.
 *
 * Renders actionable diagnostics when an MDX document cannot be evaluated,
 * showing the failure reason and resolution steps.
 */

import { CircleX, FileWarning, Wrench } from "lucide-react";
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
        "my-6 rounded-lg border border-destructive/50 border-l-[3px] border-l-destructive bg-destructive/10 p-5 text-destructive",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
          <CircleX className="size-3.5 shrink-0" />
          MDX Error
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 font-semibold">
        <CircleX className="size-5 shrink-0" />
        <span>Failed to render MDX document</span>
      </div>

      {sourcePath && (
        <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <FileWarning className="size-3.5 shrink-0 text-destructive/70" />
          Source: <span className="text-foreground">{sourcePath}</span>
        </p>
      )}

      <pre className="mt-4 max-h-60 overflow-x-auto rounded-md border border-destructive/20 bg-destructive/5 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground dark:bg-destructive/10">
        {errorMessage}
      </pre>

      <div className="mt-4 space-y-2 border-t border-destructive/20 pt-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Wrench className="size-3.5 shrink-0 text-destructive/70" />
          <span>Resolution Suggestions</span>
        </div>
        <ul className="ml-6 list-disc space-y-1 text-xs text-muted-foreground">
          <li>Check for unclosed or malformed JSX tags</li>
          <li>Verify all embedded expressions use valid JavaScript syntax</li>
          <li>Ensure imported components are correctly registered</li>
          <li>Look for unsupported or conflicting markdown syntax</li>
          <li>Validate that frontmatter YAML is properly formatted</li>
        </ul>
      </div>
    </div>
  );
}
