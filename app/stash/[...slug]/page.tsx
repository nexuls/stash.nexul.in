/**
 * Dynamic documentation route for Stash entries (/stash/[...slug]).
 *
 * Renders an entry as a single reading column: masthead, optional table of
 * contents for narrow viewports, the evaluated MDX body, the entry's adjacent
 * files, and linear navigation. The measure and vertical rhythm of the body
 * come from `.stash-doc` in globals.css; this route only composes the parts.
 */

import { Clock, FolderTree, History } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/archive/category-view";
import { FileIcon } from "@/components/mdx/file-icon";
import { CopyMarkdownButton } from "@/components/navigation/copy-markdown-button";
import { DocsMobileHeader } from "@/components/navigation/docs-mobile-header";
import { DocsPager } from "@/components/navigation/docs-pager";
import { DocsToc } from "@/components/navigation/docs-toc";
import { buildArchiveIndex } from "@/lib/content/archive-index";
import { entryAssetBaseUrl, entryAssetUrl } from "@/lib/content/asset-url";
import {
  getAllEntries,
  getAllSlugs,
  getCategoryIndexes,
  getEntryBySlug,
  getPrevNextEntries,
  getRelatedEntries,
} from "@/lib/content/discovery";
import { MDXRenderer } from "@/lib/mdx/renderer";
import { siteConfig } from "@/lib/site-config";

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

/**
 * Precomputes static parameters for all discovered entries during build.
 */
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slugSegments) => ({
    slug: slugSegments,
  }));
}

/**
 * Generates dynamic SEO and OpenGraph metadata per entry.
 */
export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);

  if (!entry) {
    return {
      title: "Entry not found",
      description: "No entry answers at this path.",
    };
  }

  const canonicalUrl = `${siteConfig.url}${entry.permalink}`;

  return {
    title: entry.title,
    description: entry.description,
    keywords: entry.tags,
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: entry.title,
      description: entry.description,
      type: "article",
      url: canonicalUrl,
      publishedTime: entry.date,
      modifiedTime: entry.updated || entry.date,
      authors: [siteConfig.author.name],
      tags: entry.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
    },
  };
}

/** Formats a size in bytes for the companion files list. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  // An entry answers at one path only. A category index is reached at its
  // category (`/stash/react`), so the directory that holds it
  // (`/stash/react/home`) must not serve the same page under a second URL.
  if (entry.permalink !== `/stash/${slug.join("/")}`) {
    notFound();
  }

  if (entry.isCategoryIndex) {
    const [entries, categoryIndexes] = await Promise.all([
      getAllEntries(),
      getCategoryIndexes(),
    ]);
    const index = buildArchiveIndex(entries, categoryIndexes);
    const path = entry.categories.join("/");

    return (
      <CategoryView
        entry={entry}
        domain={index.domains.find((domain) => domain.path === path)}
      />
    );
  }

  const [{ prev, next }, related] = await Promise.all([
    getPrevNextEntries(entry.slug),
    getRelatedEntries(entry, 3),
  ]);

  const formattedDate = entry.updated || entry.date;

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
              <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
                {entry.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 font-mono tracking-wide text-sm capitalize text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FolderTree className="size-4" aria-hidden />
                {entry.categories.length > 0
                  ? entry.categories.join("/")
                  : entry.category}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                {entry.readingTime.minutes} min read
              </span>

              {formattedDate && (
                <span className="flex items-center gap-1.5">
                  <History className="size-4" aria-hidden />
                  <time dateTime={formattedDate}>{formattedDate}</time>
                </span>
              )}

              {entry.draft && (
                <span className="rounded bg-warn/15 px-1.5 py-0.5 text-warn">
                  draft
                </span>
              )}

              <span className="ml-auto">
                <CopyMarkdownButton content={entry.rawContent} />
              </span>
            </div>

            {entry.tags.length > 0 && (
              <ul className="mt-3 flex list-none flex-wrap gap-x-3 gap-y-1 pl-0 font-mono tracking-wide text-xs text-muted-foreground/80">
                {entry.tags.map((tag) => (
                  <li key={tag}>#{tag}</li>
                ))}
              </ul>
            )}
          </header>

          {entry.headings.length > 1 && (
            <div className="mb-10 rounded-lg border border-border bg-card/40 p-4 xl:hidden">
              <DocsToc headings={entry.headings} />
            </div>
          )}

          <div className="stash-doc-body pt-6">
            <MDXRenderer
              source={entry.body}
              sourcePath={entry.filePath}
              assetBaseUrl={entryAssetBaseUrl(entry.slug)}
            />
          </div>

          {entry.assets.length > 0 && (
            <section
              aria-labelledby="companion-files-heading"
              className="mt-14 border-t border-border pt-6"
            >
              <h2
                id="companion-files-heading"
                className="font-display text-sm font-semibold text-foreground"
              >
                Files in this entry
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Saved beside the document, and served as-is.
              </p>

              <ul className="mt-4 list-none divide-y divide-border rounded-lg border border-border pl-0">
                {entry.assets.map((asset) => (
                  <li key={asset.relativePath}>
                    <a
                      href={entryAssetUrl(entry.slug, asset.relativePath)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 font-mono text-[0.8125rem] no-underline transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      {/* Same glyphs as code panels and file trees, so one
                          vocabulary covers every file named on the page. */}
                      <FileIcon
                        name={asset.relativePath}
                        className="size-4.5"
                      />
                      <span className="truncate text-foreground/90">
                        {asset.relativePath}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatFileSize(asset.size)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <DocsPager
            currentEntry={entry}
            prev={prev}
            next={next}
            related={related}
          />
        </main>

        <aside
          aria-label="Table of contents"
          className="hidden w-60 shrink-0 px-4 py-8 pt-18 xl:block"
        >
          <div className="sticky top-18 h-[calc(100vh-10rem)] overflow-y-auto pr-1">
            <DocsToc headings={entry.headings} />
          </div>
        </aside>
      </div>
    </div>
  );
}
