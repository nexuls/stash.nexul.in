/**
 * Dynamic documentation route for Stash entries (/stash/[...slug]).
 *
 * Renders MDX content with server-side evaluation, responsive sidebar integration,
 * scroll-aware table of contents, breadcrumbs, previous/next navigation, and metadata.
 */

import {
  Calendar,
  Clock,
  Code,
  FileCode,
  FolderOpen,
  ImageIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  type DocsBreadcrumbItem,
  DocsHeader,
} from "@/components/navigation/docs-header";
import { DocsPager } from "@/components/navigation/docs-pager";
import { DocsToc } from "@/components/navigation/docs-toc";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getAllSlugs,
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
      title: "Entry Not Found",
      description: "The requested documentation entry could not be found.",
    };
  }

  const pageTitle = entry.title;
  const canonicalUrl = `${siteConfig.url}${entry.permalink}`;

  return {
    title: pageTitle,
    description: entry.description,
    keywords: entry.tags,
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
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
      title: pageTitle,
      description: entry.description,
    },
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const [{ prev, next }, related] = await Promise.all([
    getPrevNextEntries(entry.slug),
    getRelatedEntries(entry, 3),
  ]);

  // Construct breadcrumbs
  const breadcrumbs: DocsBreadcrumbItem[] = [];
  let accumulatedSlug = "";

  for (const segment of entry.categories) {
    accumulatedSlug = accumulatedSlug
      ? `${accumulatedSlug}/${segment}`
      : segment;
    const formattedTitle = segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    breadcrumbs.push({
      title: formattedTitle,
      href: `/stash/${accumulatedSlug}`,
    });
  }

  breadcrumbs.push({
    title: entry.title,
  });

  const formattedDate = entry.updated || entry.date;

  return (
    <div className="flex min-h-screen flex-col">
      <DocsHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 min-w-0">
        {/* Main Document Content */}
        <main
          id="main-content"
          className="flex-1 min-w-0 px-4 py-8 sm:px-6 md:px-10 lg:px-12 max-w-4xl"
        >
          {/* Article Header & Metadata */}
          <article className="prose dark:prose-invert max-w-none">
            <header className="mb-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 text-xs capitalize font-medium"
                >
                  <FolderOpen className="size-3 text-muted-foreground" />
                  <span>{entry.category}</span>
                </Badge>

                {formattedDate && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs font-normal"
                  >
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>{formattedDate}</span>
                  </Badge>
                )}

                <Badge
                  variant="secondary"
                  className="gap-1 text-xs font-normal"
                >
                  <Clock className="size-3 text-muted-foreground" />
                  <span>{entry.readingTime.minutes} min read</span>
                </Badge>

                {entry.draft && (
                  <Badge variant="destructive" className="text-xs">
                    Draft
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {entry.title}
              </h1>

              {entry.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {entry.description}
                </p>
              )}

              {/* Tags */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {entry.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[11px] font-mono font-normal text-muted-foreground"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator className="mt-6" />
            </header>

            {/* Mobile / Tablet Table of Contents */}
            {entry.headings.length > 1 && (
              <div className="mb-8 rounded-xl border border-border/80 bg-muted/30 p-4 xl:hidden">
                <DocsToc headings={entry.headings} />
              </div>
            )}

            {/* Evaluated MDX Body */}
            <div className="space-y-4 text-foreground/90 leading-7">
              <MDXRenderer source={entry.body} sourcePath={entry.filePath} />
            </div>

            {/* Adjacent Companion Files / Assets */}
            {entry.assets.length > 0 && (
              <section
                aria-labelledby="companion-assets-heading"
                className="mt-12 rounded-xl border border-border/80 bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <FileCode className="size-4 text-primary" />
                  <h3
                    id="companion-assets-heading"
                    className="text-sm font-semibold tracking-tight uppercase text-muted-foreground"
                  >
                    Companion Files & Assets
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {entry.assets.map((asset) => (
                    <div
                      key={asset.filename}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {asset.type === "image" ? (
                          <ImageIcon className="size-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <Code className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-mono truncate">
                          {asset.filename}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase shrink-0">
                        {asset.extension}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pagination Navigation & Related Entries */}
            <DocsPager
              currentEntry={entry}
              prev={prev}
              next={next}
              related={related}
            />
          </article>
        </main>

        {/* Right Rail: Desktop Scroll-Aware Table of Contents */}
        <aside
          aria-label="Table of contents navigation"
          className="hidden xl:block w-64 shrink-0 px-6 py-8 border-l border-border/40"
        >
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            <DocsToc headings={entry.headings} />
          </div>
        </aside>
      </div>
    </div>
  );
}
