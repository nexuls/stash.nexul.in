/**
 * The entry's own files, offered as downloads.
 *
 * A preview answers what the code does; this answers "give me the file". The
 * rows are plain anchors carrying `download`, so saving a file costs no client
 * JavaScript and keeps the browser's own progress and destination handling —
 * the asset route already serves these paths, prerendered, from `content/`.
 *
 * Authors name files, or nothing at all:
 *
 * ```mdx
 * <FileDownloads files="svg-particles.tsx, preview.tsx" />
 * ```
 *
 * `remarkFileDownloads` resolves that list to paths and sizes at compile time.
 * The glyphs and the size column are the ones the entry page's file list and
 * the code panels use, so one vocabulary covers every file named on a page.
 */

import { ArrowDownToLine } from "lucide-react";
import { FileIcon } from "@/components/mdx/file-icon";
import {
  type FileDownloadsProps,
  fileDownloadItemsSchema,
  fileDownloadsPropsSchema,
} from "@/lib/mdx/types";
import { cn, formatFileSize } from "@/lib/utils";

/**
 * A compile-time problem the author can fix, rendered where the list would
 * have been so it cannot be missed.
 */
function DownloadsDiagnostic({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="my-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
    >
      <p className="font-mono text-xs font-medium text-destructive">
        {message}
      </p>
    </div>
  );
}

export function FileDownloads({
  files,
  title,
  description,
  items,
  base,
  error,
  className,
}: FileDownloadsProps) {
  const validation = fileDownloadsPropsSchema.safeParse({
    files,
    title,
    description,
    items,
    base,
    error,
    className,
  });

  if (!validation.success) {
    return (
      <DownloadsDiagnostic
        message={`Malformed FileDownloads: ${validation.error.issues[0]?.message}`}
      />
    );
  }

  const props = validation.data;

  if (props.error) {
    return <DownloadsDiagnostic message={props.error} />;
  }

  if (!props.items || !props.base) {
    return (
      <DownloadsDiagnostic message="<FileDownloads> was compiled without an entry directory, so there is nothing to offer." />
    );
  }

  let parsed: ReturnType<typeof fileDownloadItemsSchema.parse>;
  try {
    parsed = fileDownloadItemsSchema.parse(JSON.parse(props.items));
  } catch {
    return (
      <DownloadsDiagnostic message="<FileDownloads> received a malformed file list from the MDX pipeline." />
    );
  }

  const assetBase = props.base.replace(/\/+$/, "");

  return (
    <div
      className={cn(
        "my-6 overflow-hidden rounded-xl border border-border bg-card/40",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-3.5 py-2.5">
        <ArrowDownToLine
          className="size-6 shrink-0 translate-y-0.5 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-medium text-foreground">
            {props.title}
          </p>
          {props.description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {props.description}
            </p>
          )}
        </div>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {parsed.length} {parsed.length === 1 ? "file" : "files"}
        </span>
      </div>

      <ul className="m-0 list-none divide-y divide-border pl-0">
        {parsed.map((item) => {
          const filename = item.path.split("/").pop() ?? item.path;
          return (
            <li key={item.path} className="m-0">
              <a
                href={`${assetBase}/${item.path}`}
                download={filename}
                aria-label={`Download ${item.path}, ${formatFileSize(item.size)}`}
                className="group/download flex items-center gap-2.5 px-3.5 py-2.5 font-mono text-[0.8125rem] no-underline transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <FileIcon name={item.path} className="size-4.5" />
                <span className="truncate text-foreground/90">{item.path}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatFileSize(item.size)}
                </span>
                <ArrowDownToLine
                  className="size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover/download:text-primary"
                  aria-hidden
                />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
