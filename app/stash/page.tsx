/**
 * Stash Documentation Overview and Archive Index (/stash).
 *
 * Provides a discovery hub displaying all categories, recently updated entries,
 * tags, and search shortcuts.
 */

import { ArrowRight, Calendar, Clock, FolderOpen, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DocsMobileHeader } from "@/components/navigation/docs-mobile-header";
import NavBar from "@/components/navigation/docs-navbar";
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
    <div className="flex min-h-screen w-full flex-col">
      {/* Mobile-only header for small viewports */}
      <DocsMobileHeader />

      <main
        id="main-content"
        className="flex-1 w-full max-w-210 px-4 py-8 sm:px-6 md:px-8 mx-auto"
      >
        {/* In-content Breadcrumb Navigation & Desktop Sidebar Trigger */}
        <NavBar items={[{ title: "Stash Archive" }]} />

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
              <Button
                nativeButton={false}
                render={<Link href={firstEntry.permalink} />}
              >
                <span>Start Reading</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            )}

            <SearchTrigger variant="button">Search Archive (⌘K)</SearchTrigger>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Category Domains Grid */}
        <section className="mb-12 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Browse by Knowledge Domain
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {topLevelCategories.map((category) => {
              const formattedName = category.name
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");

              const categoryEntries = entries.filter((e) =>
                e.categories.includes(category.name),
              );

              return (
                <div
                  key={category.name}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs transition-all hover:border-border hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <FolderOpen className="size-4" />
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {formattedName}
                        </h3>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-mono"
                      >
                        {categoryEntries.length}{" "}
                        {categoryEntries.length === 1 ? "note" : "notes"}
                      </Badge>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      {categoryEntries.slice(0, 3).map((entry) => (
                        <li key={entry.slug} className="truncate">
                          <Link
                            href={entry.permalink}
                            className="hover:text-foreground transition-colors"
                          >
                            • {entry.title}
                          </Link>
                        </li>
                      ))}
                      {categoryEntries.length > 3 && (
                        <li className="text-[11px] text-muted-foreground/70 italic">
                          +{categoryEntries.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>

                  {categoryEntries[0] && (
                    <div className="mt-4 pt-3 border-t border-border/40">
                      <Link
                        href={categoryEntries[0].permalink}
                        className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                      >
                        <span>Explore domain</span>
                        <ArrowRight className="size-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* All Recent Documentation Notes */}
        <section className="mb-12 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            All Technical Entries
          </h2>

          <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/50">
            {entries.map((entry) => {
              const formattedDate = entry.updated || entry.date;

              return (
                <article
                  key={entry.slug}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={entry.permalink}
                      className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {entry.title}
                    </Link>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">
                        {entry.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {entry.category}
                    </Badge>

                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="size-3" />
                      <span>{entry.readingTime.minutes}m</span>
                    </span>

                    {formattedDate && (
                      <span className="hidden md:flex items-center gap-1 text-[11px]">
                        <Calendar className="size-3" />
                        <span>{formattedDate}</span>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Indexed Topics / Tags */}
        {tags.length > 0 && (
          <section className="space-y-3 pb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Indexed Topics & Tags
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
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
