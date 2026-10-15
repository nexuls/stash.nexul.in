/**
 * FileTree: a directory listing.
 *
 * Content hierarchy in Stash comes from directory paths, so entries describe
 * themselves in terms of files. This renders that shape as a real tree rather
 * than as ASCII art inside a code fence, which means the names stay selectable
 * and the structure stays accessible.
 */

import {
  ChevronRight,
  File as FileIcon,
  Folder as FolderIcon,
} from "lucide-react";
import type * as React from "react";
import {
  type FileTreeNodeProps,
  type FolderProps,
  fileTreeNodePropsSchema,
  folderPropsSchema,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

/** Shared row layout for files and folder headers. */
const rowClass =
  "flex items-center gap-2 py-1 font-mono text-[0.8125rem] leading-6";

function NodeComment({ comment }: { comment?: string }) {
  if (!comment) return null;
  return (
    <span className="truncate font-sans text-xs text-muted-foreground/80">
      {comment}
    </span>
  );
}

export function File({
  name,
  highlight = false,
  comment,
  className,
  ...props
}: FileTreeNodeProps & React.ComponentPropsWithoutRef<"li">) {
  const validation = fileTreeNodePropsSchema.safeParse({
    name,
    highlight,
    comment,
    className,
  });

  return (
    <li className={cn(rowClass, className)} {...props}>
      <FileIcon
        className="size-3.5 shrink-0 text-muted-foreground/70"
        aria-hidden
      />
      <span
        className={cn(
          highlight ? "font-medium text-primary" : "text-foreground/90",
        )}
      >
        {validation.success ? name : "(unnamed)"}
      </span>
      <NodeComment comment={comment} />
    </li>
  );
}

export function Folder({
  name,
  defaultOpen = true,
  highlight = false,
  comment,
  className,
  children,
  ...props
}: FolderProps & Omit<React.ComponentPropsWithoutRef<"li">, "children">) {
  const validation = folderPropsSchema.safeParse({
    name,
    defaultOpen,
    highlight,
    comment,
    className,
  });

  return (
    <li className={className} {...props}>
      <details open={defaultOpen} className="group/folder">
        <summary
          className={cn(
            rowClass,
            "cursor-pointer list-none rounded px-1 -mx-1 transition-colors hover:bg-muted/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "[&::-webkit-details-marker]:hidden",
          )}
        >
          <ChevronRight
            className="size-3 shrink-0 text-muted-foreground/70 transition-transform duration-150 group-open/folder:rotate-90 motion-reduce:transition-none"
            aria-hidden
          />
          <FolderIcon
            className={cn(
              "size-3.5 shrink-0",
              highlight ? "text-primary" : "text-muted-foreground/70",
            )}
            aria-hidden
          />
          <span
            className={cn(
              highlight ? "font-medium text-primary" : "text-foreground",
            )}
          >
            {validation.success ? name : "(unnamed)"}/
          </span>
          <NodeComment comment={comment} />
        </summary>
        <ul className="ml-[0.6875rem] border-l border-border pl-3.5">
          {children}
        </ul>
      </details>
    </li>
  );
}

export function FileTree({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      className={cn(
        "my-6 list-none rounded-lg border border-border bg-card/40 px-3 py-2.5",
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  );
}
