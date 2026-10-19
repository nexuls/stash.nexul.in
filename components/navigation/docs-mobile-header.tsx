"use client";

/**
 * Mobile-only top header bar (md:hidden).
 *
 * Provides sidebar drawer trigger, brand indicator, and search button on small viewports.
 * Hidden on desktop where breadcrumbs and sidebar are displayed in-page.
 */

import Link from "next/link";
import { StashMark } from "@/components/icons/stash-mark";
import { StashWordmark } from "@/components/icons/stash-wordmark";
import { SearchTrigger } from "@/components/search/search-trigger";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function DocsMobileHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex md:hidden h-12 w-full items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm sticky top-0 z-30",
        // Shell, not document: paper gets the entry alone.
        "print:hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link href="/stash" className="flex items-center gap-2 text-foreground">
          <StashMark className="h-7 w-auto shrink-0" />
          <StashWordmark className="h-9 shrink-0" />
          <span className="sr-only">{siteConfig.name}</span>
        </Link>
      </div>

      <SearchTrigger variant="button">
        <span className="text-xs">Search</span>
      </SearchTrigger>
    </div>
  );
}
