/**
 * FileTree: a directory listing.
 *
 * Content hierarchy in Stash comes from directory paths, so entries describe
 * themselves in terms of files. This renders that shape as a real tree rather
 * than as ASCII art inside a code fence, which means the names stay selectable,
 * the structure is a real nested list, and each row can carry its own icon.
 *
 * These are Server Components so every row resolves its file-type glyph from
 * disk at build time. Only a folder needs client state, so `Folder` resolves
 * its icon here and hands it to `FileTreeFolder`, which owns the disclosure.
 *
 * Row geometry is shared by eye rather than by constant: a row is a 1rem icon,
 * a `gap-1.5`, then the name at `text-[0.8125rem]`/`leading-5`. A folder row
 * adds a 1rem chevron ahead of its icon. Changing one of those measurements
 * means changing it in `file-tree-folder.tsx` to match.
 */

import type * as React from "react";
import { FileIcon } from "@/components/mdx/file-icon";
import { FileTreeFolder } from "@/components/mdx/file-tree-folder";
import {
  type FileTreeNodeProps,
  type FolderProps,
  fileTreeNodePropsSchema,
  folderPropsSchema,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

/**
 * Trailing note on a row.
 *
 * Deliberately `font-sans` against the row's monospace: the note is prose about
 * the file, not part of its name, and the change of face says so before the
 * colour does. It truncates so a long note cannot widen the tree.
 */
function NodeComment({ comment }: { comment?: string }) {
  if (!comment) return null;
  return (
    <span className="truncate pl-1 font-sans text-muted-foreground text-xs">
      {comment}
    </span>
  );
}

/**
 * One file in the tree.
 *
 * Validation is advisory: a malformed node renders as `(unnamed)` rather than
 * throwing, because one bad row in an illustrative diagram should not take the
 * page down with it. The name inherits the document's `--prose` colour, which
 * holds the listing a shade below the folder names that structure it.
 */
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
    <li
      className={cn(
        "flex items-center gap-1.5 rounded-md py-0.75 pr-1.5 font-mono text-[0.8125rem] leading-5",
        className,
      )}
      {...props}
    >
      {/* The glyph is chosen from the filename, so `use-debounce.ts` and
          `README.mdx` are told apart before either name is read. */}
      <FileIcon name={name} className="size-4 shrink-0" />
      <span
        className={cn(
          // Truncation keeps a long name from pushing the note out of the row.
          "truncate pr-2",
          highlight && "font-medium text-primary-foreground",
        )}
      >
        {validation.success ? name : "(unnamed)"}
      </span>
      <NodeComment comment={comment} />
    </li>
  );
}

/**
 * One directory in the tree.
 *
 * Resolves the folder glyph on the server and delegates everything interactive
 * to `FileTreeFolder`. Unlike `File` this takes only its declared props: there
 * is no `<li>` passthrough, because the list item is created by the collapsible
 * root on the other side of the server/client boundary.
 */
export function Folder({
  name,
  defaultOpen = true,
  highlight = false,
  comment,
  className,
  children,
}: FolderProps) {
  const validation = folderPropsSchema.safeParse({
    name,
    defaultOpen,
    highlight,
    comment,
    className,
  });

  return (
    <FileTreeFolder
      className={className}
      // Rendered here rather than passed as a string, so both kinds of row get
      // their note from one definition even across the client boundary.
      comment={<NodeComment comment={comment} />}
      defaultOpen={defaultOpen}
      highlight={highlight}
      // The closed glyph is used for both states: the row already reports its
      // state through the chevron, and swapping the drawing as well makes an
      // expanding tree flicker.
      icon={<FileIcon name={name} folder className="size-4 shrink-0" />}
      name={validation.success ? name : "(unnamed)"}
    >
      {children}
    </FileTreeFolder>
  );
}

/**
 * The tree container.
 *
 * A plain `<ul>` of `File` and `Folder` children on the same card surface the
 * other reference blocks use, so a tree reads as one object in the document
 * rather than as a run of loose rows.
 */
export function FileTree({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      className={cn(
        "stash-panel my-6 list-none rounded-lg border border-border bg-card/40 px-2.5 py-2",
        className,
      )}
      {...props}
    >
      {children}
    </ul>
  );
}
