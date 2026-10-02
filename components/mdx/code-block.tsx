/**
 * Code presentation components for MDX.
 *
 * Implements code block containers, headers with filenames and language labels,
 * copy buttons, and mobile-safe overflow. Compatible with both rehype-pretty-code
 * generated figures and standalone <CodeBlock /> usage.
 */

import { FileCode, Terminal } from "lucide-react";
import * as React from "react";
import { CopyButton } from "@/components/mdx/copy-button";
import { type CodeBlockProps, codeBlockPropsSchema } from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

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
    default:
      return clean.toUpperCase();
  }
}

/**
 * Inspect children to detect if a figcaption title exists.
 */
function extractTitleFromChildren(children: React.ReactNode): {
  title?: string;
  remainingChildren: React.ReactNode;
} {
  let title: string | undefined;
  const remaining: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === "figcaption") {
      const childProps = child.props as { children?: React.ReactNode };
      if (typeof childProps.children === "string") {
        title = childProps.children;
      }
    } else {
      remaining.push(child);
    }
  });

  return { title, remainingChildren: remaining };
}

/**
 * Enhanced Figure component intercepting rehype-pretty-code figures.
 */
export function CodeFigure({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"figure">) {
  // If not a rehype-pretty-code figure, pass through as normal figure
  const isPrettyCode =
    "data-rehype-pretty-code-figure" in props ||
    (props as Record<string, unknown>)["data-rehype-pretty-code-figure"] !==
      undefined;

  if (!isPrettyCode) {
    return (
      <figure className={cn("my-6", className)} {...props}>
        {children}
      </figure>
    );
  }

  // Inspect pre element inside children to get language attribute
  let language = "text";
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const childProps = child.props as { "data-language"?: string };
      if (childProps["data-language"]) {
        language = childProps["data-language"];
      }
    }
  });

  const { title, remainingChildren } = extractTitleFromChildren(children);
  const isTerminal = ["bash", "sh", "shell", "zsh"].includes(
    language.toLowerCase(),
  );

  return (
    <figure
      data-rehype-pretty-code-figure=""
      className={cn(
        "stash-code-block group relative my-6 overflow-hidden rounded-lg border border-border bg-card shadow-xs transition-colors",
        className,
      )}
      {...props}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/80 bg-muted/60 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-muted-foreground">
          {isTerminal ? (
            <Terminal className="size-3.5 text-primary" />
          ) : (
            <FileCode className="size-3.5 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">
            {title ?? (isTerminal ? "Terminal" : formatLanguageLabel(language))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {title && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
              {formatLanguageLabel(language)}
            </span>
          )}
          <CopyButton />
        </div>
      </div>

      {/* Code body */}
      <div className="relative overflow-x-auto">{remainingChildren}</div>
    </figure>
  );
}

/**
 * Enhanced Pre component for styled code block presentation and overflow control.
 */
export function Pre({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      className={cn(
        "overflow-x-auto p-4 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
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
  ...props
}: CodeBlockProps) {
  const validation = codeBlockPropsSchema.safeParse({
    code,
    language,
    filename,
    showLineNumbers,
    highlightLines,
    className,
  });

  const lines = code.trim().split("\n");
  const isTerminal = ["bash", "sh", "shell", "zsh"].includes(
    language.toLowerCase(),
  );

  return (
    <div
      className={cn(
        "stash-code-block relative my-6 overflow-hidden rounded-lg border border-border bg-card shadow-xs",
        className,
      )}
      {...props}
    >
      {!validation.success && (
        <div className="m-2 rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs text-destructive">
          ⚠️ Malformed CodeBlock: {validation.error.issues[0]?.message}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border/80 bg-muted/60 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-muted-foreground">
          {isTerminal ? (
            <Terminal className="size-3.5 text-primary" />
          ) : (
            <FileCode className="size-3.5 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">
            {filename ??
              (isTerminal ? "Terminal" : formatLanguageLabel(language))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {filename && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
              {formatLanguageLabel(language)}
            </span>
          )}
          <CopyButton code={code} />
        </div>
      </div>

      {/* Pre Code Body */}
      <pre
        data-language={language}
        className="overflow-x-auto p-4 font-mono text-xs leading-relaxed"
      >
        <code
          data-language={language}
          data-line-numbers={showLineNumbers ? "" : undefined}
          style={{ display: "grid" }}
        >
          {lines.map((line, index) => {
            const lineNum = index + 1;
            const isHighlighted = highlightLines?.includes(lineNum);
            return (
              <span
                key={lineNum}
                data-line=""
                data-highlighted-line={isHighlighted ? "" : undefined}
                className={cn(
                  "px-2 py-0.5",
                  isHighlighted &&
                    "-ml-2 border-l-2 border-primary bg-primary/10 pl-[calc(0.5rem-2px)]",
                )}
              >
                {line || " "}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
