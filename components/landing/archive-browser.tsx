"use client";

/**
 * How a reader gets into the archive.
 *
 * Listing every note at once made the page a wall of titles that got worse as
 * the archive grew, so the default view is the categories: a reader chooses
 * where to look before being shown anything. Searching is the other way in, for
 * when the name of a note is already half remembered, and it replaces the
 * categories with the notes that match.
 *
 * Notable: Client Component. It receives a stripped metadata model rather than
 * loaded entries, so no MDX source crosses the server boundary.
 */

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { directoryName, NoteList } from "@/components/archive/note-list";
import {
  type ArchiveDomain,
  type ArchiveIndex,
  filterArchive,
} from "@/lib/content/archive-index";

interface ArchiveBrowserProps {
  index: ArchiveIndex;
}

/** Directory names offered when a search matches nothing. */
const SUGGESTIONS = ["hooks", "patterns", "components"];

function CategoryRow({ domain }: { domain: ArchiveDomain }) {
  const directories = domain.groups.filter((group) => group.label !== null);

  return (
    <li>
      <Link
        href={domain.href}
        className="group -mx-4 block rounded-lg px-4 py-7 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-baseline justify-between gap-6">
          <span className="text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
            {domain.label}
          </span>

          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {domain.noteCount} {domain.noteCount === 1 ? "note" : "notes"}
          </span>
        </span>

        {domain.description ? (
          <span className="mt-2 block max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
            {domain.description}
          </span>
        ) : null}

        {directories.length > 0 ? (
          <span className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-xs text-muted-foreground/70">
            {directories.map((group) => (
              <span key={group.path}>
                {directoryName(group.path)}
                <span className="pl-1.5 tabular-nums text-muted-foreground/50">
                  {group.notes.length}
                </span>
              </span>
            ))}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function ArchiveBrowser({ index }: ArchiveBrowserProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const results = useMemo(
    () => filterArchive(index.domains, query),
    [index.domains, query],
  );

  const searching = query.trim().length > 0;
  const matchCount = results.reduce((sum, domain) => sum + domain.noteCount, 0);

  // `/` focuses the field, matching the shortcut the documentation sidebar uses.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-24 sm:px-8">
      <div className="sticky top-14 z-30 flex items-center gap-3 border-b border-dashed border-border bg-background py-4">
        <Search
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />

        <label className="sr-only" htmlFor={inputId}>
          Search the archive
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          placeholder="Search by name, path or topic"
          aria-keyshortcuts="/"
          autoComplete="off"
          spellCheck={false}
          className="h-6 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />

        {searching ? (
          <>
            <span
              aria-live="polite"
              className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
            >
              {matchCount} of {index.noteCount}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Clear the search"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <span aria-hidden="true" className="hidden shrink-0 sm:block">
            <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground/70">
              /
            </kbd>
          </span>
        )}
      </div>

      {!searching ? (
        <ul className="divide-y divide-dashed divide-border">
          {index.domains.map((domain) => (
            <CategoryRow key={domain.slug} domain={domain} />
          ))}
        </ul>
      ) : results.length === 0 ? (
        <div className="py-20">
          <p className="text-foreground">
            Nothing in the archive matches "{query.trim()}".
          </p>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            Try a shorter word, or the name of a directory such as{" "}
            {SUGGESTIONS.map((suggestion, position) => (
              <span key={suggestion}>
                {position === 0
                  ? null
                  : position === SUGGESTIONS.length - 1
                    ? " or "
                    : ", "}
                <button
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="font-mono text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {suggestion}
                </button>
              </span>
            ))}
            .
          </p>
        </div>
      ) : (
        <div className="space-y-14 pt-12">
          {results.map((domain) => (
            <section key={domain.slug}>
              <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-border pb-2.5">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                  {domain.label}
                </h2>
                <Link
                  href={domain.href}
                  className="shrink-0 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  content/{domain.path}
                </Link>
              </div>

              <div className="mt-8">
                <NoteList groups={domain.groups} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
