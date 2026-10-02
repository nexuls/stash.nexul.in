"use client";

/**
 * Documentation navigation sidebar using shadcn Sidebar components.
 *
 * Dynamically renders category hierarchy and entries discovered from the filesystem.
 * Includes search visual element (dummy for Stage 5) and responsive mobile/desktop handling.
 */

import {
  Archive,
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { SearchTrigger } from "@/components/search/search-trigger";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { ContentCategory, ContentEntry } from "@/lib/content/types";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface DocsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  entries: ContentEntry[];
  categories: ContentCategory[];
  currentSlug?: string;
}

export function DocsSidebar({
  entries,
  categories,
  currentSlug,
  className,
  ...props
}: DocsSidebarProps) {
  const pathname = usePathname();

  // Group entries by primary top-level category
  const categorizedEntries = React.useMemo(() => {
    const map = new Map<
      string,
      Map<string, ContentEntry[]> // topCategory -> subCategory -> entries
    >();

    for (const entry of entries) {
      const topCategory = entry.categories[0] || entry.category || "general";
      const subCategory =
        entry.categories.length > 1 ? entry.categories[1] : "default";

      let subMap = map.get(topCategory);
      if (!subMap) {
        subMap = new Map();
        map.set(topCategory, subMap);
      }

      let subList = subMap.get(subCategory);
      if (!subList) {
        subList = [];
        subMap.set(subCategory, subList);
      }
      subList.push(entry);
    }

    return map;
  }, [entries]);

  return (
    <Sidebar
      className={cn("border-r border-sidebar-border", className)}
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
        <div className="flex items-center justify-between px-2 pt-1">
          <Link
            href="/stash"
            className="flex items-center gap-2 font-semibold text-foreground tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Archive className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">
                {siteConfig.name}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Technical Archive
              </span>
            </div>
          </Link>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-mono"
          >
            v0.1
          </Badge>
        </div>

        {/* Dummy Search Trigger visual element (prepares for Stage 5 search dialog) */}
        <div className="px-2 pt-2">
          <SearchTrigger variant="sidebar" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* All Documentation Overview Link */}
        <SidebarGroup className="py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <Link href="/stash">
                    <BookOpen className="size-4" />
                    <span>Archive Index</span>
                  </Link>
                }
                isActive={pathname === "/stash"}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Dynamic Categorized Content Groups */}
        {Array.from(categorizedEntries.entries()).map(
          ([categoryKey, subMap]) => {
            const formattedCategoryName = categoryKey
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            const totalCategoryEntries = Array.from(subMap.values()).reduce(
              (acc, curr) => acc + curr.length,
              0,
            );

            return (
              <SidebarGroup key={categoryKey} className="py-2">
                <SidebarGroupLabel className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="size-3.5 text-muted-foreground" />
                    <span>{formattedCategoryName}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                    {totalCategoryEntries}
                  </span>
                </SidebarGroupLabel>

                <SidebarGroupContent>
                  <SidebarMenu>
                    {Array.from(subMap.entries()).map(
                      ([subKey, subEntries]) => {
                        const hasSubcategory = subKey !== "default";
                        const formattedSubName = subKey
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ");

                        if (hasSubcategory) {
                          return (
                            <SidebarMenuItem key={subKey} className="my-1">
                              <div className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                                {formattedSubName}
                              </div>
                              <SidebarMenuSub>
                                {subEntries.map((entry) => {
                                  const isActive =
                                    currentSlug === entry.slug ||
                                    pathname === entry.permalink;

                                  return (
                                    <SidebarMenuSubItem key={entry.slug}>
                                      <SidebarMenuSubButton
                                        render={
                                          <Link href={entry.permalink}>
                                            <FileText className="size-3.5" />
                                            <span className="truncate">
                                              {entry.title}
                                            </span>
                                          </Link>
                                        }
                                        isActive={isActive}
                                      />
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </SidebarMenuItem>
                          );
                        }

                        // Root entries in category
                        return subEntries.map((entry) => {
                          const isActive =
                            currentSlug === entry.slug ||
                            pathname === entry.permalink;

                          return (
                            <SidebarMenuItem key={entry.slug}>
                              <SidebarMenuButton
                                render={
                                  <Link href={entry.permalink}>
                                    <FileText className="size-4" />
                                    <span className="truncate">
                                      {entry.title}
                                    </span>
                                  </Link>
                                }
                                isActive={isActive}
                              />
                            </SidebarMenuItem>
                          );
                        });
                      },
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          },
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">
              {siteConfig.author.name}
            </span>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            Curated engineering notes & reference.
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
