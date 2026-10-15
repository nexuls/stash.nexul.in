/**
 * Notes grouped by the directory that holds them.
 *
 * Shared by the landing page's search results and by each category page, so a
 * note reads the same wherever it is listed.
 *
 * Notable: no hooks and no client APIs, so it renders on the server for a
 * category page and inside the client filter on the landing page alike.
 */

import Link from "next/link";
import type { ArchiveGroup, ArchiveNote } from "@/lib/content/archive-index";

/** Last segment of a content path, i.e. the directory name on disk. */
export function directoryName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function NoteRow({ note }: { note: ArchiveNote }) {
  return (
    <li>
      <Link
        href={note.permalink}
        className="group -mx-3 flex gap-6 rounded-md px-3 py-3.5 transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-foreground transition-colors group-hover:text-primary">
            {note.title}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            {note.description}
          </span>
        </span>

        {note.date ? (
          <time
            dateTime={note.date}
            className="hidden shrink-0 pt-0.5 font-mono text-[0.6875rem] tabular-nums text-muted-foreground/60 sm:block"
          >
            {note.date}
          </time>
        ) : null}
      </Link>
    </li>
  );
}

interface NoteListProps {
  groups: ArchiveGroup[];
  /** Anchors each directory heading, for pages that navigate to one. */
  anchored?: boolean;
}

export function NoteList({ groups, anchored = false }: NoteListProps) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <div
          key={group.path}
          id={anchored ? group.path.replace(/\//g, "-") : undefined}
          className={anchored ? "scroll-mt-28 lg:scroll-mt-24" : undefined}
        >
          {group.label ? (
            <h3
              data-nav={anchored ? group.path.replace(/\//g, "-") : undefined}
              className="font-mono text-xs text-muted-foreground"
            >
              {directoryName(group.path)}/
            </h3>
          ) : null}

          <ul className="mt-2 divide-y divide-border/60">
            {group.notes.map((note) => (
              <NoteRow key={note.permalink} note={note} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
