/**
 * Stash landing page (/).
 *
 * Opens with what the archive is, then the categories it is divided into. The
 * notes themselves live on the category pages; showing all of them here made
 * the page a wall of titles that only got worse as the archive grew.
 *
 * Notable: Server Component, independent of the documentation sidebar layout.
 * The index model is derived here so the client receives metadata only.
 */

import type { Metadata } from "next";
import { ArchiveBrowser } from "@/components/landing/archive-browser";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { PageGuides } from "@/components/landing/page-guides";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildArchiveIndex } from "@/lib/content/archive-index";
import { getAllEntries, getCategoryIndexes } from "@/lib/content/discovery";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `${siteConfig.name} — Personal Engineering Archive`,
  description: siteConfig.description,
};

export default async function HomePage() {
  const [entries, categoryIndexes] = await Promise.all([
    getAllEntries(),
    getCategoryIndexes(),
  ]);
  const index = buildArchiveIndex(entries, categoryIndexes);

  return (
    <div className="h-svh w-full bg-background font-sans text-foreground">
      <ScrollArea className="h-full">
        <div className="relative flex min-h-svh w-full flex-col">
          <PageGuides />

          {/* Outside the hero: the hero clips its field with overflow-hidden,
              which would stop the header sticking. */}
          <LandingHeader />

          {/* Pulled up by the header's height so the hero begins behind it and
              its field carries all the way to the top of the page. The hero
              adds the same height back as padding, so nothing lands under the
              header. */}
          <main id="main-content" className="-mt-14 flex-1">
            <LandingHero index={index} />
            <ArchiveBrowser index={index} />
          </main>

          <LandingFooter />
        </div>
      </ScrollArea>
    </div>
  );
}
