"use client";

/**
 * Documentation navigation sidebar using standard shadcn Sidebar primitives.
 *
 * Renders the sidebar with header, search, category navigation tree, and footer.
 * Uses shadcn's built-in mobile sheet drawer and desktop sidebar behaviors.
 */

import {
  Archive,
  BookOpen,
  ChevronRight,
  FileText,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { ContentCategory, ContentEntry } from "@/lib/content/types";
import { siteConfig } from "@/lib/site-config";

interface DocsSidebarProps {
  entries: ContentEntry[];
  categories: ContentCategory[];
  currentSlug?: string;
}

export function DocsSidebar({
  entries,
  categories: _categories,
  currentSlug,
}: DocsSidebarProps) {
  const pathname = usePathname();

  // Group entries by top-level category → subCategory → entries
  const categorizedEntries = React.useMemo(() => {
    const map = new Map<string, Map<string, ContentEntry[]>>();

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
    <Sidebar>
      {/* Sidebar Header: Logo, Title */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/stash" />}>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Archive className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{siteConfig.name}</span>
                <Badge
                  variant="secondary"
                  className="w-fit text-[10px] px-1.5 py-0 font-mono"
                >
                  v0.1
                </Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Search Trigger */}
        <SearchTrigger variant="sidebar" />
      </SidebarHeader>

      <SidebarSeparator />

      {/* Scrollable Navigation Tree */}
      <SidebarContent>
        {/* Archive Index */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/stash" />}
                  isActive={pathname === "/stash"}
                >
                  <BookOpen className="size-4" />
                  <span>Archive Index</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dynamic Category Sections */}
        {Array.from(categorizedEntries.entries()).map(
          ([categoryKey, subMap]) => {
            const formattedCategoryName = categoryKey
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            return (
              <SidebarGroup key={categoryKey}>
                <SidebarGroupLabel>
                  <FolderOpen className="size-3" />
                  <span>{formattedCategoryName}</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {Array.from(subMap.entries()).map(
                      ([subKey, subEntries]) => {
                        const hasSubcategory = subKey !== "default";

                        if (hasSubcategory) {
                          const formattedSubName = subKey
                            .split("-")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ");

                          return (
                            <Collapsible
                              key={subKey}
                              defaultOpen
                              className="group/collapsible"
                            >
                              <SidebarMenuItem>
                                <CollapsibleTrigger
                                  render={
                                    <SidebarMenuButton>
                                      <FolderOpen className="size-4" />
                                      <span>{formattedSubName}</span>
                                      <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                  }
                                />
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {subEntries.map((entry) => {
                                      const isActive =
                                        currentSlug === entry.slug ||
                                        pathname === entry.permalink;
                                      return (
                                        <SidebarMenuSubItem key={entry.slug}>
                                          <SidebarMenuSubButton
                                            render={
                                              <Link href={entry.permalink} />
                                            }
                                            isActive={isActive}
                                          >
                                            <span>{entry.title}</span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      );
                                    })}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuItem>
                            </Collapsible>
                          );
                        }

                        // Root entries in category (no subcategory)
                        return subEntries.map((entry) => {
                          const isActive =
                            currentSlug === entry.slug ||
                            pathname === entry.permalink;

                          return (
                            <SidebarMenuItem key={entry.slug}>
                              <SidebarMenuButton
                                render={<Link href={entry.permalink} />}
                                isActive={isActive}
                              >
                                <FileText className="size-4" />
                                <span>{entry.title}</span>
                              </SidebarMenuButton>
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

      {/* Sidebar Footer: GitHub Link and Theme Toggle */}
      <SidebarFooter>
        <div className="flex items-center justify-between">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label="View source repository on GitHub"
            title="GitHub Repository"
          >
            <span className="sr-only">GitHub</span>
            <svg
              className="size-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>

          <ThemeToggle variant="compact" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
