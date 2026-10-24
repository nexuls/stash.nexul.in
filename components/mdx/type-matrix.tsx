/**
 * TypeMatrix: what a type accepts, and what it turns away.
 *
 * A type is easiest to understand from the values it admits, so this renders
 * the thing a reader would otherwise have to imagine — a column of candidate
 * values, and for each one whether the compiler took it. Declaring more than
 * one type puts a naive definition beside the one that fixes it, and the same
 * value lands differently in each column.
 *
 * It is a real `<table>`: rows are values, columns are types, and the header
 * association a screen reader needs comes from the markup rather than from
 * ARIA. A rejection's message, when a case gives one, renders on its own row
 * beneath the value, prefixed by the column it belongs to.
 *
 * Nothing here is interactive, so it stays a Server Component and costs the
 * client bundle nothing.
 */

import { Check, X } from "lucide-react";
import {
  normalizeTypeVerdict,
  type TypeMatrixProps,
  typeMatrixPropsSchema,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

const verdictConfig = {
  ok: {
    icon: Check,
    /** Read out in place of the glyph, which carries no meaning on its own. */
    label: "accepted",
    tone: "border-tip/35 bg-tip/10 text-tip",
  },
  error: {
    icon: X,
    label: "rejected",
    tone: "border-danger/35 bg-danger/10 text-danger",
  },
} as const;

function Verdict({ status }: { status: "ok" | "error" }) {
  const { icon: Icon, label, tone } = verdictConfig[status];

  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md border",
        tone,
      )}
    >
      <Icon className="size-3.5" aria-hidden strokeWidth={3} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function TypeMatrix({ types, cases, of, className }: TypeMatrixProps) {
  const validation = typeMatrixPropsSchema.safeParse({
    types,
    cases,
    of,
    className,
  });

  if (!validation.success) {
    return (
      <p className="my-6 font-mono text-xs text-destructive">
        Malformed TypeMatrix: {validation.error.issues[0]?.message}
      </p>
    );
  }

  const matrix = validation.data;
  // A single type needs no column heading: the caption above already says what
  // the one column is, and a lone header would only repeat it.
  const showTypeHeadings = matrix.types.length > 1;

  return (
    <div
      className={cn(
        "stash-panel my-6 overflow-hidden rounded-xl border border-code-rule bg-card/40",
        className,
      )}
    >
      {of && (
        <p className="border-b border-code-rule px-4 py-2.5 font-mono text-sm text-muted-foreground">
          {of}
        </p>
      )}

      {/* Values are source text and will not wrap gracefully, so the table
          scrolls sideways rather than breaking a literal across lines. */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            {of ?? "Type assignability"}: which values each type accepts.
          </caption>

          <thead>
            <tr className="border-b border-code-rule">
              <th
                scope="col"
                className="px-4 py-2 text-xs font-normal text-muted-foreground"
              >
                Value
              </th>
              {matrix.types.map((type) => (
                <th
                  key={type}
                  scope="col"
                  className="px-4 py-2 font-mono text-xs font-normal whitespace-nowrap text-muted-foreground"
                >
                  {showTypeHeadings ? (
                    type
                  ) : (
                    <span className="sr-only">{type}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {matrix.cases.map((testCase) => {
              const verdicts = testCase.verdicts.map(normalizeTypeVerdict);
              const messages = verdicts
                .map((verdict, index) => ({
                  type: matrix.types[index],
                  ...verdict,
                }))
                .filter((verdict) => Boolean(verdict.message));

              return (
                <tr
                  key={testCase.code}
                  className="border-b border-code-rule/60 last:border-b-0 align-top"
                >
                  <th scope="row" className="px-4 py-3 font-normal">
                    {testCase.label && (
                      <span className="mb-1 block text-xs text-muted-foreground">
                        {testCase.label}
                      </span>
                    )}
                    <code className="font-mono text-sm whitespace-pre text-foreground">
                      {testCase.code}
                    </code>

                    {messages.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {messages.map((message) => (
                          <li
                            key={message.type}
                            className="font-mono text-xs leading-relaxed text-danger"
                          >
                            {/* The column is named here because a rejection in
                                a two-type matrix is only meaningful next to
                                which type did the rejecting. */}
                            {showTypeHeadings && (
                              <span className="text-muted-foreground">
                                {message.type}:{" "}
                              </span>
                            )}
                            {message.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </th>

                  {verdicts.map((verdict, index) => (
                    <td
                      key={matrix.types[index]}
                      className="px-4 py-3 whitespace-nowrap"
                    >
                      <Verdict status={verdict.status} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
