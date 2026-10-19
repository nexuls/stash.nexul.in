/**
 * PropsTable: the accepted props of a component or the options of a function.
 *
 * Two columns a reader can scan — the name and a short type — with everything
 * else folded into the row. Opening one reveals its description, the full
 * signature, its parameters and its default, so a long union or a callback
 * type does not push the column apart for every other row.
 *
 * Each row is a native `<details>`, so keyboard, screen-reader and
 * in-page-find behaviour come from the browser; the open and close animation
 * is the shared `.stash-details` rule in `styles/details.css`.
 *
 * Two ways to write one. `rows` takes the props as data, for a reference that
 * is a line per prop. `<Prop>` children take the description as MDX, the way
 * a JSDoc comment is written — a code span, a link, a list, a fenced block
 * that the pipeline highlights — for a prop that needs more than a sentence.
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import type { PropProps, PropRow } from "@/lib/mdx/types";
import {
  type PropsTableProps,
  propRowSchema,
  propsTablePropsSchema,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

/** A row plus, for a `<Prop>` child, the MDX written inside the tag. */
interface PropEntry {
  row: PropRow;
  body?: React.ReactNode;
}

/** Name column, then type, then room for the chevron. */
const ROW_GRID = "grid grid-cols-[minmax(6rem,1fr)_minmax(0,2fr)] gap-x-4";

function hasDetail({ row, body }: PropEntry) {
  return Boolean(
    body ||
      row.description ||
      row.typeDetail ||
      row.returns ||
      row.default !== undefined ||
      (row.parameters && row.parameters.length > 0),
  );
}

/**
 * Reads the `<Prop>` children into entries. The tag is never rendered: its
 * props are the row and its children are the description, so the table can
 * lay both out in its own grid.
 */
function entriesFromChildren(children: React.ReactNode): PropEntry[] {
  const entries: PropEntry[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const { children: body, ...rest } = child.props as PropProps;
    const parsed = propRowSchema.safeParse(rest);
    if (!parsed.success) return;

    entries.push({ row: parsed.data, body });
  });

  return entries;
}

function PropName({ row }: { row: PropRow }) {
  return (
    <code className="truncate font-mono text-sm font-bold text-primary-foreground/80">
      {row.name}
      {/* The props of a component are optional unless a row says otherwise,
          and the question mark says that where TypeScript would. */}
      {!row.required && <span className="text-primary/60">?</span>}
    </code>
  );
}

function PropType({ row }: { row: PropRow }) {
  if (!row.type) return <span />;

  return (
    <code className="truncate font-mono text-xs text-muted-foreground">
      {row.type}
    </code>
  );
}

/** One label-and-value line inside an opened row, aligned to the columns. */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(ROW_GRID, "py-1.5")}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function PropDetail({ row, body }: PropEntry) {
  return (
    <>
      {/* The MDX body of a <Prop> stands in for the description, so a prop
          that needs an example or a caveat can have one. */}
      {body ? (
        <div
          className={cn(
            "mb-2 text-sm text-muted-foreground leading-relaxed",
            "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            "[&_.stash-code]:my-3",
          )}
        >
          {body}
        </div>
      ) : (
        row.description && (
          <p className="mb-2 text-sm text-muted-foreground leading-relaxed">
            {row.description}
          </p>
        )
      )}

      <dl className="divide-y divide-border/60">
        {row.typeDetail && (
          <DetailRow label="Type">
            <code className="font-mono text-xs break-words">
              {row.typeDetail}
            </code>
          </DetailRow>
        )}

        {row.parameters && row.parameters.length > 0 && (
          <DetailRow label="Parameters">
            <ul className="space-y-1">
              {row.parameters.map((parameter) => (
                <li key={parameter.name} className="text-sm">
                  <code className="font-mono text-xs font-medium text-foreground">
                    {parameter.name}
                  </code>
                  {parameter.description && (
                    <span className="text-muted-foreground">
                      {" — "}
                      {parameter.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </DetailRow>
        )}

        {row.returns && <DetailRow label="Returns">{row.returns}</DetailRow>}

        {row.default !== undefined && (
          <DetailRow label="Default">
            <code className="font-mono text-xs break-words">{row.default}</code>
          </DetailRow>
        )}
      </dl>
    </>
  );
}

/**
 * One prop, with its description written as MDX inside the tag.
 *
 * Never rendered: `PropsTable` reads the props off the element and lays the
 * row out itself, so this body is only reached when the tag is written
 * outside a table.
 */
export function Prop(_props: PropProps) {
  return (
    <p className="my-4 font-mono text-xs text-destructive">
      &lt;Prop /&gt; must be used inside a &lt;PropsTable&gt; container.
    </p>
  );
}

export function PropsTable({ rows, of, className, children }: PropsTableProps) {
  const validation = propsTablePropsSchema.safeParse({ rows, of, className });

  const entries: PropEntry[] = validation.success
    ? [
        ...(validation.data.rows ?? []).map((row) => ({ row })),
        ...entriesFromChildren(children),
      ]
    : [];

  if (!validation.success || entries.length === 0) {
    const message = validation.success
      ? "needs rows or <Prop> children"
      : validation.error.issues[0]?.message;

    return (
      <p className="my-6 font-mono text-xs text-destructive">
        Malformed PropsTable: {message}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "stash-panel my-6 rounded-xl border border-code-rule bg-card/40 p-1.5",
        className,
      )}
    >
      {of && (
        <p className="px-3 pt-1.5 font-mono text-sm text-muted-foreground">
          {of}
        </p>
      )}

      <div
        className={cn(
          ROW_GRID,
          "px-3 pt-2 pb-1.5 text-sm text-muted-foreground",
        )}
      >
        <span>Prop</span>
        <span>Type</span>
      </div>

      <div className="space-y-1">
        {entries.map((entry) =>
          hasDetail(entry) ? (
            <details
              key={entry.row.name}
              className={cn(
                "stash-details group/row overflow-hidden rounded-lg",
                "[--stash-details-pad-x:0.75rem] [--stash-details-pad-y:0.625rem]",
                "border border-transparent bg-transparent transition-colors",
                "open:border-code-rule open:bg-code-header/60",
              )}
            >
              <summary
                className={cn(
                  ROW_GRID,
                  "cursor-pointer list-none items-center px-3 py-2.5",
                  "transition-colors hover:bg-foreground/4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <PropName row={entry.row} />
                <span className="flex min-w-0 items-center gap-2">
                  <PropType row={entry.row} />
                  <ChevronDown
                    className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/row:rotate-180 motion-reduce:transition-none"
                    aria-hidden
                  />
                </span>
              </summary>

              <div className="stash-details-content">
                <PropDetail row={entry.row} body={entry.body} />
              </div>
            </details>
          ) : (
            <div
              key={entry.row.name}
              className={cn(
                ROW_GRID,
                "items-center rounded-lg border border-transparent bg-code-header/60 px-3 py-2.5",
              )}
            >
              <PropName row={entry.row} />
              <PropType row={entry.row} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
