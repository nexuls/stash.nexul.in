import { Archive } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/icons/github-icon";
import { siteConfig } from "@/lib/site-config";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border/60 bg-muted/20 py-8 text-xs text-muted-foreground transition-colors">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Archive className="size-3.5" />
          </div>
          <span className="font-semibold text-foreground">
            {siteConfig.name}
          </span>
          <span>—</span>
          <span>{siteConfig.description}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-[11px] text-muted-foreground sm:inline-block">
            Press{" "}
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>{" "}
            to search
          </span>

          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <GitHubIcon className="size-3.5" />
            <span>GitHub</span>
          </a>

          <Link href="/" className="transition-colors hover:text-foreground">
            Back to top ↑
          </Link>
        </div>
      </div>
    </footer>
  );
}
