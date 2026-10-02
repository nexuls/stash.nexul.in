"use client";

/**
 * Reusable sidebar presentation content.
 *
 * Renders header with brand and collapse button, search input, category taxonomy,
 * active item highlighting, and footer with GitHub link and theme toggle.
 */

import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  PanelLeftClose,
  Pin,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContentCategory, ContentEntry } from "@/lib/content/types";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface DocsSidebarContentProps {
  entries: ContentEntry[];
  categories: ContentCategory[];
  currentSlug?: string;
  isFloating?: boolean;
  onCollapse?: () => void;
  onPin?: () => void;
  onNavigate?: () => void;
  className?: string;
}

export function DocsSidebarContent({
  entries,
  categories: _categories,
  currentSlug,
  isFloating = false,
  onCollapse,
  onPin,
  onNavigate,
  className,
}: DocsSidebarContentProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = React.useState<
    Record<string, boolean>
  >({});

  // Group entries by top-level category -> subCategory -> entries
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

  // Toggle category collapse
  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col text-sidebar-foreground select-none",
        className,
      )}
    >
      {/* Sidebar Header: Logo, Title, and Collapse/Pin Button */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <Link
          href="/stash"
          onClick={onNavigate}
          className="flex items-center gap-2.5 font-semibold text-foreground tracking-tight hover:opacity-85 transition-opacity"
        >
          <div className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Archive className="size-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            {siteConfig.name}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-mono"
          >
            v0.1
          </Badge>
        </Link>

        {/* Collapse or Pin button */}
        {isFloating ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onPin}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Pin sidebar"
            aria-label="Pin sidebar"
          >
            <Pin className="size-3.5" />
          </Button>
        ) : onCollapse ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCollapse}
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-3.5" />
          </Button>
        ) : null}
      </div>

      {/* Search Trigger */}
      <div className="px-3 pt-1 pb-2">
        <SearchTrigger variant="sidebar" />
      </div>

      {/* Scrollable Navigation Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 scrollbar-thin">
        {/* All Documentation Index */}
        <div className="space-y-1">
          <Link
            href="/stash"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              pathname === "/stash"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <BookOpen className="size-4 shrink-0" />
            <span>Archive Index</span>
          </Link>
        </div>

        {/* Dynamic Category Sections */}
        {Array.from(categorizedEntries.entries()).map(
          ([categoryKey, subMap]) => {
            const formattedCategoryName = categoryKey
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            const isCollapsed = expandedCategories[categoryKey] ?? false;

            return (
              <div key={categoryKey} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleCategory(categoryKey)}
                  className="flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="size-3 text-muted-foreground" />
                    <span>{formattedCategoryName}</span>
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="size-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3 text-muted-foreground" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {Array.from(subMap.entries()).map(
                      ([subKey, subEntries]) => {
                        const hasSubcategory = subKey !== "default";
                        const formattedSubName = subKey
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ");

                        if (hasSubcategory) {
                          return (
                            <div key={subKey} className="space-y-0.5 pt-1">
                              <div className="px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                {formattedSubName}
                              </div>
                              <div className="pl-2 border-l border-border/40 ml-2 space-y-0.5">
                                {subEntries.map((entry) => {
                                  const isActive =
                                    currentSlug === entry.slug ||
                                    pathname === entry.permalink;

                                  return (
                                    <Link
                                      key={entry.slug}
                                      href={entry.permalink}
                                      onClick={onNavigate}
                                      className={cn(
                                        "flex! items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors line-clamp-1",
                                        isActive
                                          ? "bg-accent text-accent-foreground font-medium"
                                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                      )}
                                    >
                                      <FileText className="size-3.5 shrink-0" />
                                      <span className="truncate">
                                        {entry.title}
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // Root entries in category
                        return subEntries.map((entry) => {
                          const isActive =
                            currentSlug === entry.slug ||
                            pathname === entry.permalink;

                          return (
                            <Link
                              key={entry.slug}
                              href={entry.permalink}
                              onClick={onNavigate}
                              className={cn(
                                "flex! items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors line-clamp-1",
                                isActive
                                  ? "bg-accent text-accent-foreground font-medium"
                                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                              )}
                            >
                              <FileText className="size-3.5 shrink-0" />
                              <span className="truncate">{entry.title}</span>
                            </Link>
                          );
                        });
                      },
                    )}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>

      {/* Sidebar Footer: GitHub Link on left, Theme Toggle on right */}
      <div className="mt-auto border-t border-sidebar-border/60 px-3 py-2.5 flex items-center justify-between">
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
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

        {/* Compact Theme Toggle */}
        <ThemeToggle variant="compact" />
      </div>
    </div>
  );
}
