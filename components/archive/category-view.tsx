/**
 * A category's entry point, served at `/stash/<category>`.
 *
 * Renders the category's authored `home` document, then every note it holds,
 * grouped by directory. A reader who picked a category from the landing page
 * lands here, so this page has to answer both "what is this part of the
 * archive" and "what is in it" without sending them anywhere else first.
 *
 * Notable: Server Component. The MDX body is evaluated during static
 * generation, the same as any entry.
 */

import { FolderTree, History } from "lucide-react";
import { NoteList } from "@/components/archive/note-list";
import { CopyMarkdownButton } from "@/components/navigation/copy-markdown-button";
import { DocsMobileHeader } from "@/components/navigation/docs-mobile-header";
import type { ArchiveDomain } from "@/lib/content/archive-index";
import { entryAssetBaseUrl } from "@/lib/content/asset-url";
import type { ContentEntry } from "@/lib/content/types";
import { MDXRenderer } from "@/lib/mdx/renderer";

interface CategoryViewProps {
  entry: ContentEntry;
  domain: ArchiveDomain | undefined;
}

export function CategoryView({ entry, domain }: CategoryViewProps) {
  const updated = entry.updated || entry.date;
  const noteCount = domain?.noteCount ?? 0;

  return (
    <div className="flex min-h-screen w-full flex-col p-2">
      <DocsMobileHeader />

      <div className="flex w-full flex-1 justify-center gap-10">
        <main
          id="main-content"
          className="stash-doc min-w-0 flex-1 px-4 py-8 pt-18 font-sans"
          style={{ maxWidth: "var(--stash-measure)" }}
        >
          <header className="mb-10">
            <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground lg:text-[2.125rem]">
              {entry.title}
            </h1>

            {entry.description && (
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                {entry.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 font-mono text-sm tracking-wide text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FolderTree className="size-4" aria-hidden />
                content/{entry.categories.join("/")}
              </span>

              <span>
                {noteCount} {noteCount === 1 ? "note" : "notes"}
              </span>

              {updated && (
                <span className="flex items-center gap-1.5">
                  <History className="size-4" aria-hidden />
                  <time dateTime={updated}>{updated}</time>
                </span>
              )}

              <span className="ml-auto">
                <CopyMarkdownButton content={entry.rawContent} />
              </span>
            </div>
          </header>

          <div className="stash-doc-body pt-6">
            <MDXRenderer
              source={entry.body}
              sourcePath={entry.filePath}
              assetBaseUrl={entryAssetBaseUrl(entry.slug)}
            />
          </div>

          {domain && domain.groups.length > 0 && (
            <section
              aria-labelledby="category-notes-heading"
              className="mt-14 border-t border-border pt-8"
            >
              <h2
                id="category-notes-heading"
                className="font-display text-sm font-semibold text-foreground"
              >
                Everything in this category
              </h2>

              <div className="mt-6">
                <NoteList groups={domain.groups} />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
