import { Archive } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "@/components/icons/github-icon";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

interface LandingHeaderProps {
  firstEntryHref?: string;
}

export function LandingHeader({ firstEntryHref }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Archive className="size-4" />
          </div>
          <span className="text-base tracking-tight">{siteConfig.name}</span>
          <Badge
            variant="outline"
            className="hidden font-mono text-[10px] sm:inline-flex"
          >
            Archive
          </Badge>
        </Link>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchTrigger variant="header" />

          {firstEntryHref && (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={firstEntryHref} />}
              className="text-xs font-medium"
            >
              Documentation
            </Button>
          )}

          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="GitHub Repository"
          >
            <GitHubIcon className="size-4" />
          </a>

          <ThemeToggle variant="dropdown" />
        </div>
      </div>
    </header>
  );
}
