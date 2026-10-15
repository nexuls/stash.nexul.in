/**
 * PropsTable: the accepted props of a component or the options of a function.
 *
 * Laid out as a definition list rather than a grid: a props reference is read
 * one entry at a time, and a four-column table of types collapses badly on a
 * phone. Name and type stay on one line, the description follows beneath.
 */

import { type PropsTableProps, propsTablePropsSchema } from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

export function PropsTable({ rows, of, className }: PropsTableProps) {
  const validation = propsTablePropsSchema.safeParse({ rows, of, className });

  if (!validation.success) {
    return (
      <p className="my-6 font-mono text-xs text-destructive">
        Malformed PropsTable: {validation.error.issues[0]?.message}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "my-6 overflow-hidden rounded-lg border border-border",
        className,
      )}
    >
      {of && (
        <p className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
          {of}
        </p>
      )}
      <dl className="divide-y divide-border">
        {validation.data.rows.map((row) => (
          <div key={row.name} className="px-4 py-3">
            <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <code className="font-mono text-sm font-medium text-foreground">
                {row.name}
              </code>
              {row.required && (
                <span className="font-mono text-[11px] text-danger">
                  required
                </span>
              )}
              {row.type && (
                <code className="font-mono text-xs text-primary">
                  {row.type}
                </code>
              )}
              {row.default !== undefined && (
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  default {row.default}
                </span>
              )}
            </dt>
            {row.description && (
              <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {row.description}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}
