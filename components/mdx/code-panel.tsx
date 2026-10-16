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

export interface CodePanelFrame {
  /**
   * Rendered in place of the panel's title. The preview's Code tab puts its
   * file tabs here so the frame keeps one bar instead of stacking a second
   * one above the panel's own.
   */
  tabs?: React.ReactNode;
}

/**
 * Set by a frame that already owns the panel's border, its height and its
 * scrolling — the component preview's Code tab. Inside one, the panel fills
 * the frame and scrolls instead of pushing the page down, so the collapse
 * toggle has nothing left to do.
 */
export const CodePanelFrameContext = React.createContext<CodePanelFrame | null>(
  null,
);

export interface CodePanelProps {
  /** Shiki language id, shown as the block's extension-style label. */
  language: string;
  /**
   * File-type glyph, rendered on the server so no icon data is bundled.
   * Supplied by the caller because this component runs on the client.
   */
  icon?: React.ReactNode;
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
  icon,
  title,
  terminal = false,
  lineCount = 0,
  additions = 0,
  deletions = 0,
  code,
  className,
  children,
}: CodePanelProps) {
  const frame = React.useContext(CodePanelFrameContext);
  const framed = frame !== null;
  const collapsible = !framed && lineCount > COLLAPSE_LINE_THRESHOLD;
  const [wrap, setWrap] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(collapsible);
  const isDiff = additions > 0 || deletions > 0;

  return (
    <div
      className={cn(
        "stash-code group/code overflow-hidden border-code-rule bg-code",
        framed
          ? "flex h-full min-h-0 flex-col"
          : "my-6 rounded-xl border border-code-rule",
        className,
      )}
      data-wrap={wrap}
      data-collapsed={collapsed}
    >
      <div className="flex h-9 items-center gap-2 border-b border-code-rule bg-code-header px-2.5">
        {/* Headed like an editor tab: glyph, then name. The lucide terminal is
            only reached if the icon package could not be read at build time,
            which `lib/icons/file-icons.ts` warns about. */}
        {icon ??
          (terminal && (
            <Terminal className="size-3.5 shrink-0 text-primary" aria-hidden />
          ))}

        {frame?.tabs ??
          (title ? (
            <TitlePath title={title} />
          ) : (
            // Without a title the block still has to say what it is, so the
            // language stands in for the filename.
            <span className="truncate font-mono text-xs text-muted-foreground">
              {terminal ? "shell" : language}
            </span>
          ))}

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

      <div
        className={cn(
          "stash-code-viewport relative",
          // The header stays put and the code moves under it.
          framed && "min-h-0 flex-1 overflow-auto",
        )}
      >
        {children}
      </div>

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
