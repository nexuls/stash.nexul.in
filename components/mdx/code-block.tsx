/**
 * Code presentation components for MDX.
 *
 * `CodeFigure` intercepts the `<figure>` that rehype-pretty-code emits. All of
 * the metadata it needs — language, title, line count, diff shape — has already
 * been lifted onto the element by `rehypeCodeMeta`, so this is a pure function
 * of its props rather than an inspection of its children.
 *
 * `CodeBlock` is the programmatic form, for authors who hold code in a prop
 * instead of a fence. It emits the same line markup so the stylesheet treats
 * both identically; it is not syntax highlighted, since highlighting happens in
 * the compile pipeline.
 */

import type * as React from "react";
import { CodePanel } from "@/components/mdx/code-panel";
import { type CodeBlockProps, codeBlockPropsSchema } from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

/** Languages presented as a terminal session rather than a source file. */
const TERMINAL_LANGUAGES = new Set([
  "bash",
  "sh",
  "shell",
  "zsh",
  "fish",
  "powershell",
  "ps1",
  "console",
  "terminal",
]);

export function isTerminalLanguage(language?: string): boolean {
  return TERMINAL_LANGUAGES.has((language ?? "").toLowerCase().trim());
}

/**
 * Format language identifier into a clean presentation label.
 */
export function formatLanguageLabel(lang?: string): string {
  if (!lang) return "Text";
  const clean = lang.toLowerCase().trim();
  switch (clean) {
    case "ts":
      return "TypeScript";
    case "tsx":
      return "TSX";
    case "js":
      return "JavaScript";
    case "jsx":
      return "JSX";
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
      return "Terminal";
    case "diff":
      return "Diff";
    case "json":
      return "JSON";
    case "yaml":
    case "yml":
      return "YAML";
    case "css":
      return "CSS";
    case "mdx":
      return "MDX";
    case "md":
    case "markdown":
      return "Markdown";
    case "py":
    case "python":
      return "Python";
    case "rust":
    case "rs":
      return "Rust";
    case "go":
      return "Go";
    case "sql":
      return "SQL";
    case "html":
      return "HTML";
    case "plaintext":
    case "text":
      return "Text";
    default:
      return clean.toUpperCase();
  }
}

/** Reads a numeric data attribute that the rehype pass wrote as a string. */
function numericProp(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

type FigureProps = React.ComponentPropsWithoutRef<"figure"> &
  Record<string, unknown>;

/**
 * Figure wrapper for compiled code blocks, and a plain figure for anything else.
 */
export function CodeFigure({ children, className, ...props }: FigureProps) {
  if (props["data-rehype-pretty-code-figure"] === undefined) {
    return (
      <figure className={cn("my-6", className)} {...props}>
        {children}
      </figure>
    );
  }

  const language = String(props["data-language"] ?? "plaintext");
  const rawTitle = props["data-title"];

  return (
    <CodePanel
      language={language}
      title={typeof rawTitle === "string" ? rawTitle : undefined}
      terminal={
        props["data-terminal"] !== undefined || isTerminalLanguage(language)
      }
      lineCount={numericProp(props["data-line-count"])}
      additions={numericProp(props["data-diff-additions"])}
      deletions={numericProp(props["data-diff-deletions"])}
      className={className}
    >
      {children}
    </CodePanel>
  );
}

/**
 * The `<pre>` inside a code panel.
 *
 * Horizontal padding is deliberately absent: it belongs to the individual
 * lines so that a highlighted line can span the full width of the panel.
 */
export function Pre({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      className={cn(
        "overflow-x-auto font-mono text-[0.8125rem] leading-[1.7]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
    </pre>
  );
}

/**
 * Standalone programmatic CodeBlock component for MDX or custom usage.
 */
export function CodeBlock({
  code = "",
  language = "text",
  filename,
  showLineNumbers = false,
  highlightLines,
  className,
}: CodeBlockProps) {
  const validation = codeBlockPropsSchema.safeParse({
    code,
    language,
    filename,
    showLineNumbers,
    highlightLines,
    className,
  });

  const lines = code.replace(/\n+$/, "").split("\n");
  const digits = String(lines.length).length;

  return (
    <CodePanel
      language={language}
      title={filename}
      terminal={isTerminalLanguage(language)}
      lineCount={lines.length}
      code={code}
      className={className}
    >
      {!validation.success && (
        <p className="border-b border-code-rule bg-destructive/10 px-4 py-2 font-mono text-xs text-destructive">
          Malformed CodeBlock: {validation.error.issues[0]?.message}
        </p>
      )}
      <Pre data-language={language}>
        <code
          data-language={language}
          data-line-numbers={showLineNumbers ? "" : undefined}
          style={
            {
              display: "grid",
              "--stash-line-digits": digits,
            } as React.CSSProperties
          }
        >
          {lines.map((line, index) => (
            <span
              // Line position is the identity here; the text may repeat.
              key={`${index + 1}`}
              data-line=""
              data-highlighted-line={
                highlightLines?.includes(index + 1) ? "" : undefined
              }
            >
              {line || " "}
            </span>
          ))}
        </code>
      </Pre>
    </CodePanel>
  );
}
