/**
 * Landing page header.
 *
 * Identity and the two controls a reader might reach for. Searching is the
 * archive's job, a little further down, so nothing here competes with it.
 *
 * The bar itself is transparent at the top of the page, letting the hero's
 * field show through, and solidifies as the page scrolls.
 */

import Link from "next/link";
import { GitHubIcon } from "@/components/icons/github-icon";
import { HeaderBackdrop } from "@/components/landing/header-backdrop";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site-config";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Transparent over the field at rest, solid once the page has scrolled.
          A CSS scroll timeline drives it where one exists, and a scroll
          listener where one does not; with no scripting at all, neither runs,
          so the backdrop is pinned solid rather than left transparent over the
          text that scrolls beneath it. */}
      <noscript>
        <style>{".stash-header-backdrop { opacity: 1 }"}</style>
      </noscript>
      <HeaderBackdrop />

      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-6 sm:px-8">
        <Link
          href="/"
          className="font-display text-base font-bold tracking-[-0.02em] text-foreground transition-colors hover:text-primary"
        >
          {siteConfig.name}
        </Link>

        <span
          aria-hidden="true"
          className="hidden h-3.5 w-px bg-border sm:block"
        />

        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          {siteConfig.author.name}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Source repository on GitHub"
          >
            <GitHubIcon className="size-4" />
          </a>

          <ThemeToggle variant="compact" />
        </div>
      </div>
    </header>
  );
}
