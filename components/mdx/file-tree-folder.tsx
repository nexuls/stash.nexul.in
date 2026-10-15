"use client";

/**
 * The disclosure half of a `<Folder>` row.
 *
 * Split from `file-tree.tsx` because the two halves need different runtimes:
 * the file-type icon is read from disk during static generation, and the
 * open/closed state belongs to the browser. The server resolves the icon and
 * passes it down as a prop, the same arrangement `CodeFigure` uses to hand a
 * server-rendered icon to the client-side `CodePanel`.
 *
 * Uses the shared Collapsible primitive rather than `<details>`. Three things
 * come with that: the panel animates to its measured height like the sidebar
 * tree instead of snapping open, the trigger reports itself through
 * `aria-expanded` and `aria-controls` rather than relying on the browser's own
 * summary widget, and the open state is exposed as a data attribute that CSS
 * can hang off.
 */

import { ChevronRight } from "lucide-react";
import type * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FileTreeFolderProps {
  /** Directory name, rendered with a trailing slash. */
  name: string;
  /** Whether the folder starts expanded. Uncontrolled: the reader owns it after that. */
  defaultOpen: boolean;
  /** Marks the folder as the subject of the surrounding prose. */
  highlight: boolean;
  /** Server-rendered file-type glyph; see the note on the runtime split above. */
  icon: React.ReactNode;
  /** Pre-rendered trailing note, built by `NodeComment` on the server. */
  comment?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FileTreeFolder({
  name,
  defaultOpen,
  highlight,
  icon,
  comment,
  className,
  children,
}: FileTreeFolderProps) {
  return (
    // `render` makes the collapsible root the list item itself rather than
    // wrapping one, so a <ul> only ever contains <li> children and the tree
    // stays valid markup for a screen reader walking it as a list.
    <Collapsible
      render={<li />}
      defaultOpen={defaultOpen}
      className={className}
    >
      <CollapsibleTrigger
        // A button, not a summary: the whole row is the hit target, and
        // `w-full` is what makes the hover tint span the row rather than
        // stopping at the text.
        render={<button type="button" />}
        className={cn(
          "flex items-center gap-1.5 rounded-md py-0.75 pr-1.5 font-mono text-[0.8125rem] leading-5",
          // Named group so the chevron below can watch this element's state.
          "group/folder w-full cursor-pointer text-left",
          "transition-colors hover:bg-muted/60",
          // Inset ring: an outset one would be clipped by the tree's border.
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        )}
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0",
            "text-muted-foreground transition-transform duration-150",
            // Base UI marks an open trigger with `data-panel-open`, so the
            // rotation is pure CSS and needs no state read on this side.
            "group-data-panel-open/folder:rotate-90",
            "motion-reduce:transition-none",
          )}
        />
        {icon}
        <span
          className={cn(
            // Truncation keeps a long name from pushing the comment out of
            // the row; the padding stops the two from touching.
            "truncate pr-2",
            highlight
              ? "font-medium text-primary-foreground"
              : "text-prose-emphasis",
          )}
        >
          {name}/
        </span>
        {comment}
      </CollapsibleTrigger>

      {/* `stash-collapsible-panel` is the shared height animation from
          app/globals.css, driven by the `--collapsible-panel-height` variable
          Base UI measures. It is also where the reduced-motion opt-out lives,
          so folders inherit that without restating it. */}
      <CollapsibleContent className="stash-collapsible-panel">
        {/* The guide line sits on the centre of the chevron slot above it, so
            a nested row hangs off its parent's disclosure rather than off the
            edge of the panel. */}
        <ul className="ml-1.75 list-none border-border/70 border-l pl-3.5">
          {children}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
