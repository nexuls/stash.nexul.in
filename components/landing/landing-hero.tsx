/**
 * The opening of the landing page.
 *
 * Says plainly what the archive is and leaves the visual interest to the field
 * drifting behind it. There is no slogan and no call to action: the categories
 * begin immediately below, and a reader who arrived from a search result wants
 * to get on with it rather than be persuaded.
 *
 * Notable: Server Component. Only the field behind it runs any script.
 */

import { AmbientField } from "@/components/landing/ambient-field";
import type { ArchiveIndex } from "@/lib/content/archive-index";

interface LandingHeroProps {
  index: ArchiveIndex;
}

export function LandingHero({ index }: LandingHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-dashed border-border pt-14">
      {/* Full strength behind the header, fading out before it reaches the
          categories, so the two halves of the page never argue. */}
      <AmbientField className="absolute inset-0 -z-10 mask-[linear-gradient(to_bottom,black_0%,black_50%,transparent_94%)]" />

      <div className="mx-auto w-full max-w-5xl px-6 pt-24 pb-20 sm:px-8 lg:pt-32 lg:pb-24">
        <h1 className="max-w-[20ch] text-[clamp(2.25rem,5.5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-foreground">
          An archive of reusable engineering work.
        </h1>

        <p className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          Problems solved once and written down, kept as plain files so the work
          stays findable long after it was written. Pick a category below, or
          search if you already know what you are after.
        </p>

        {index.lastUpdated ? (
          <p className="mt-10 font-mono text-xs text-muted-foreground/80">
            Last updated {index.lastUpdated}
          </p>
        ) : null}
      </div>
    </section>
  );
}
