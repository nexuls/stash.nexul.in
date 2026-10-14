/**
 * Stash landing / home page route (/).
 *
 * Primary public entrypoint showcasing knowledge domains, recently added
 * technical notes, search shortcuts, and indexed topics.
 *
 * Notable: Server Component, independent of the docs sidebar layout.
 */

import { ArrowRight, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DomainCard } from "@/components/landing/domain-card";
import { EntryRow } from "@/components/landing/entry-row";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
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
  title: `${siteConfig.name} — Technical Knowledge Archive`,
  description: siteConfig.description,
};

export default async function HomePage() {
  const [entries, categories, tags] = await Promise.all([
    getAllEntries(),
    getAllCategories(),
    getAllTags(),
  ]);

  const topLevelCategories = categories.filter((c) => c.path.length === 1);
  const firstEntry = entries[0];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      {/* Top Header */}
      <LandingHeader firstEntryHref={firstEntry?.permalink} />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="mx-auto flex-1 w-full max-w-5xl px-4 py-12 sm:px-6 md:px-8"
      >
        {/* Hero Section */}
        <section className="mb-12 space-y-4">
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

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {siteConfig.description} Structured for rapid reference, deep
            understanding, and copy-ready patterns.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {firstEntry && (
              <Button
                size="default"
                nativeButton={false}
                render={<Link href={firstEntry.permalink} />}
              >
                <span>Start Reading</span>
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            )}

            <SearchTrigger variant="button">Search Archive (⌘K)</SearchTrigger>
          </div>
        </section>

        <Separator className="my-10" />

        {/* Category Domains Grid */}
        <section className="mb-14 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Browse by Knowledge Domain
            </h2>
            <span className="text-xs text-muted-foreground">
              {topLevelCategories.length} domains
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topLevelCategories.map((category) => (
              <DomainCard
                key={category.slug}
                category={category}
                entries={entries}
              />
            ))}
          </div>
        </section>

        {/* All Recent Technical Entries */}
        <section className="mb-14 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              All Technical Entries
            </h2>
            <span className="text-xs text-muted-foreground">
              {entries.length} notes available
            </span>
          </div>

          <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/50">
            {entries.map((entry) => (
              <EntryRow key={entry.slug} entry={entry} />
            ))}
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
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
