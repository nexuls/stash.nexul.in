/**
 * Landing page footer.
 *
 * States how the archive is actually built, which is the one thing a reader
 * arriving at the bottom of the index might still want to know.
 */

import { GitHubIcon } from "@/components/icons/github-icon";
import { siteConfig } from "@/lib/site-config";

export function LandingFooter() {
  return (
    <footer className="border-t border-dashed border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          Every note is a directory of plain MDX files in one repository. Edit
          the files and the archive follows.
        </p>

        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <GitHubIcon className="size-3.5" />
          <span>{siteConfig.author.alias}</span>
        </a>
      </div>
    </footer>
  );
}
