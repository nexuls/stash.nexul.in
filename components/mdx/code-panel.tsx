"use client";

/**
 * Interactive shell around a highlighted code block.
 *
 * The highlighted markup itself is produced on the server and passed straight
 * through as children; this component only owns the two pieces of state a
 * reader can change — soft wrap and, for long blocks, whether the block is
 * collapsed — plus the header that reports what they are looking at.
 */

import { ChevronDown, Terminal, WrapText } from "lucide-react";
import * as React from "react";
import { CopyButton } from "@/components/mdx/copy-button";
import { cn } from "@/lib/utils";

/** Blocks longer than this open collapsed so a page stays scannable. */
export const COLLAPSE_LINE_THRESHOLD = 28;

export interface CodePanelProps {
  /** Shiki language id, shown as the block's extension-style label. */
  language: string;
  /** Author-supplied `title="..."`, usually a file path. */
  title?: string;
  terminal?: boolean;
  lineCount?: number;
  additions?: number;
  deletions?: number;
  /** Raw source, when the caller already has it, so copying needs no DOM read. */
  code?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders a file path with its directories held back, so the filename reads
 * first and the location is still there when wanted.
 */
function TitlePath({ title }: { title: string }) {
  const segments = title.split("/");
  const filename = segments.pop() ?? title;

  return (
    <span className="truncate font-mono text-xs">
      {segments.length > 0 && (
        <span className="text-muted-foreground/70">{segments.join("/")}/</span>
      )}
      <span className="font-medium text-foreground">{filename}</span>
    </span>
  );
}

function ToolbarButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-foreground/8 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--code-header)]",
        pressed && "bg-foreground/10 text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CodePanel({
  language,
  title,
  terminal = false,
  lineCount = 0,
  additions = 0,
  deletions = 0,
  code,
  className,
  children,
}: CodePanelProps) {
  const collapsible = lineCount > COLLAPSE_LINE_THRESHOLD;
  const [wrap, setWrap] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(collapsible);
  const isDiff = additions > 0 || deletions > 0;

  return (
    <div
      className={cn(
        "stash-code group/code my-6 overflow-hidden rounded-xl border border-code-rule bg-code",
        className,
      )}
      data-wrap={wrap}
      data-collapsed={collapsed}
    >
      <div className="flex h-9 items-center gap-2 border-b border-code-rule bg-code-header px-2.5">
        {terminal ? (
          <Terminal className="size-3.5 shrink-0 text-primary" aria-hidden />
        ) : (
          <span className="shrink-0 rounded bg-foreground/8 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {language}
          </span>
        )}

        {title ? (
          <TitlePath title={title} />
        ) : (
          terminal && (
            <span className="truncate font-mono text-xs text-muted-foreground">
              shell
            </span>
          )
        )}

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {isDiff ? (
            <span className="mr-1 font-mono text-[11px] tabular-nums">
              <span className="text-diff-add">+{additions}</span>{" "}
              <span className="text-diff-del">−{deletions}</span>
            </span>
          ) : (
            lineCount > 1 && (
              <span className="mr-1 hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:inline">
                {lineCount} lines
              </span>
            )
          )}

          <ToolbarButton
            label={wrap ? "Stop wrapping lines" : "Wrap long lines"}
            pressed={wrap}
            onClick={() => setWrap((value) => !value)}
          >
            <WrapText className="size-3.5" />
          </ToolbarButton>

          <CopyButton code={code} />
        </div>
      </div>

      <div className="stash-code-viewport relative">{children}</div>

      {collapsible && (
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 border-t border-code-rule bg-code-header",
            "px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors",
            "hover:bg-foreground/5 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          )}
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              !collapsed && "rotate-180",
            )}
            aria-hidden
          />
          {collapsed ? `Show all ${lineCount} lines` : "Collapse"}
        </button>
      )}
    </div>
  );
}
