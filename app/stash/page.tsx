/**
 * Stash Documentation Overview and Archive Index (/stash).
 *
 * Provides a discovery hub displaying all categories, recently updated entries,
 * tags, and search shortcuts.
 */

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  FolderOpen,
  Layers,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DocsHeader } from "@/components/navigation/docs-header";
import { SearchTrigger } from "@/components/search/search-trigger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getAllCategories,
  getAllEntries,
  getAllTags,
} from "@/lib/content/discovery";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Documentation Archive",
  description:
    "Explore curated technical notes, engineering reference, and patterns.",
};

export default async function StashIndexPage() {
  const [entries, categories, tags] = await Promise.all([
    getAllEntries(),
    getAllCategories(),
    getAllTags(),
  ]);

  const topLevelCategories = categories.filter((c) => c.path.length === 1);
  const firstEntry = entries[0];

  return (
    <div className="flex min-h-screen flex-col">
      <DocsHeader breadcrumbs={[]} />

      <main
        id="main-content"
        className="flex-1 px-4 py-8 sm:px-6 md:px-10 lg:px-12 max-w-5xl"
      >
        {/* Hero Section */}
        <section className="mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <Layers className="size-3.5" />
            <span>
              {entries.length} technical entries across{" "}
              {topLevelCategories.length} domains
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {siteConfig.name} Knowledge Archive
          </h1>

          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            {siteConfig.description} Structured for rapid reference, deep
            understanding, and copy-ready patterns.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {firstEntry && (
              <Button render={<Link href={firstEntry.permalink} />}>
                <span>Start reading</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            )}

            <SearchTrigger variant="button" />
          </div>
        </section>

        <Separator className="my-8" />

        {/* Categories Grid */}
        <section
          aria-labelledby="categories-heading"
          className="space-y-4 mb-12"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="size-4 text-primary" />
            <h2
              id="categories-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Knowledge Domains
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topLevelCategories.map((category) => (
              <div
                key={category.slug}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all hover:border-foreground/30 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Domain
                    </span>
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      {category.count}{" "}
                      {category.count === 1 ? "entry" : "entries"}
                    </Badge>
                  </div>

                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>

                  <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {category.entries.slice(0, 3).map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={item.permalink}
                          className="hover:text-foreground hover:underline line-clamp-1"
                        >
                          • {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {category.entries[0] && (
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <Link
                      href={category.entries[0].permalink}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <span>Explore {category.name}</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recently Added Notes */}
        <section
          aria-labelledby="recent-notes-heading"
          className="space-y-4 mb-12"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <h2
              id="recent-notes-heading"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              All Notes & Implementations
            </h2>
          </div>

          <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card overflow-hidden">
            {entries.map((entry) => {
              const formattedDate = entry.updated || entry.date;
              return (
                <Link
                  key={entry.slug}
                  href={entry.permalink}
                  className="group flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {entry.category}
                      </Badge>
                      <h3 className="text-sm font-medium text-foreground group-hover:underline truncate">
                        {entry.title}
                      </h3>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {entry.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 sm:self-center">
                    {formattedDate && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="size-3" />
                        <span>{formattedDate}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] tabular-nums">
                      <Clock className="size-3" />
                      <span>{entry.readingTime.minutes} min</span>
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 hidden sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Popular Tags */}
        {tags.length > 0 && (
          <section aria-labelledby="tags-heading" className="space-y-3">
            <h2
              id="tags-heading"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Indexed Topics & Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-mono text-muted-foreground hover:text-foreground cursor-default"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
