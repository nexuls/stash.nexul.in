"use client";

/**
 * Mobile-only top header bar (md:hidden).
 *
 * Provides sidebar drawer trigger, brand indicator, and search button on small viewports.
 * Hidden on desktop where breadcrumbs and sidebar are displayed in-page.
 */

import { Archive } from "lucide-react";
import Link from "next/link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function DocsMobileHeader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex md:hidden h-12 w-full items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm sticky top-0 z-30",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link
          href="/stash"
          className="flex items-center gap-2 font-medium text-sm text-foreground"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Archive className="size-3" />
          </div>
          <span>{siteConfig.name}</span>
        </Link>
      </div>

      <SearchTrigger variant="button">
        <span className="text-xs">Search</span>
      </SearchTrigger>
    </div>
  );
}
