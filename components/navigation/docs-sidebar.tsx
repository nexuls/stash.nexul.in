"use client";

/**
 * Documentation navigation sidebar using standard shadcn Sidebar primitives.
 *
 * Scoped to the currently active knowledge domain, with a top domain switcher
 * dropdown, collapsible subcategory groups, and search integration.
 */

import { Archive, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { GitHubIcon } from "@/components/icons/github-icon";
import {
  type DomainItem,
  DomainSwitcher,
} from "@/components/navigation/domain-switcher";
import { SidebarCollapsibleGroup } from "@/components/navigation/sidebar-collapsible-group";
import { SidebarEntryItem } from "@/components/navigation/sidebar-entry-item";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
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
  SidebarSeparator,
  SidebarTrigger,
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

  // Extract all available domains from entries
  const domains: DomainItem[] = React.useMemo(() => {
    const domainMap = new Map<
      string,
      { count: number; firstEntry?: ContentEntry }
    >();

    for (const entry of entries) {
      const domainKey = entry.categories[0] || entry.category || "general";
      const existing = domainMap.get(domainKey) || { count: 0 };
      existing.count += 1;
      if (!existing.firstEntry) {
        existing.firstEntry = entry;
      }
      domainMap.set(domainKey, existing);
    }

    return Array.from(domainMap.entries()).map(([slug, data]) => {
      const formattedName = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return {
        slug,
        name: formattedName,
        count: data.count,
        firstEntryPermalink: data.firstEntry?.permalink || `/stash/${slug}`,
      };
    });
  }, [entries]);

  // Derive initial active domain from pathname or currentSlug
  const getDomainFromPath = React.useCallback(
    (path: string | undefined): string => {
      if (!path) return domains[0]?.slug || "react";

      // If currentSlug is provided e.g. "react/hooks/use-debounce"
      if (currentSlug) {
        const parts = currentSlug.split("/");
        if (parts[0]) return parts[0];
      }

      // If matching from pathname e.g. "/stash/react/hooks/use-debounce"
      const cleanPath = path.replace(/^\/stash\/?/, "").replace(/^\//, "");
      const segments = cleanPath.split("/");
      if (segments[0] && domains.some((d) => d.slug === segments[0])) {
        return segments[0];
      }

      return domains[0]?.slug || "react";
    },
    [domains, currentSlug],
  );

  const [activeDomainSlug, setActiveDomainSlug] = React.useState<string>(() =>
    getDomainFromPath(pathname),
  );

  // Sync active domain when route changes
  React.useEffect(() => {
    const matched = getDomainFromPath(pathname);
    if (matched && matched !== activeDomainSlug) {
      setActiveDomainSlug(matched);
    }
  }, [pathname, getDomainFromPath, activeDomainSlug]);

  // Group entries for ONLY the active domain: subCategory -> entries
  const activeDomainSubMap = React.useMemo(() => {
    const subMap = new Map<string, ContentEntry[]>();

    for (const entry of entries) {
      const domainKey = entry.categories[0] || entry.category || "general";
      if (domainKey !== activeDomainSlug) {
        continue;
      }

      const subCategory =
        entry.categories.length > 1 ? entry.categories[1] : "default";

      const subList = subMap.get(subCategory) || [];
      subList.push(entry);
      subMap.set(subCategory, subList);
    }

    return subMap;
  }, [entries, activeDomainSlug]);

  const activeDomainInfo = domains.find((d) => d.slug === activeDomainSlug);

  return (
    <Sidebar className="border-none overflow-clip py-2 bg-sidebar">
      {/* Sidebar Header: Logo, Toggle, Domain Switcher, and Search */}
      <SidebarHeader className="space-y-2">
        <SidebarMenu className="flex flex-row items-center justify-between">
          <SidebarMenuItem>
            <Link
              href="/"
              className="flex items-center gap-2 p-1.5 font-semibold text-foreground transition-opacity hover:opacity-85"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Archive className="size-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarTrigger size="icon-lg" />
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Domain Switcher Dropdown on top of sidebar */}
        <DomainSwitcher
          domains={domains}
          activeDomainSlug={activeDomainSlug}
          onSelectDomain={setActiveDomainSlug}
        />

        {/* Search Trigger */}
        <SearchTrigger variant="sidebar" />
      </SidebarHeader>

      <SidebarSeparator className="mx-0 my-1" />

      {/* Scrollable Navigation Tree for Active Domain */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {activeDomainInfo?.name || "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Array.from(activeDomainSubMap.entries()).map(
                ([subKey, subEntries]) => {
                  const hasSubcategory = subKey !== "default";

                  if (hasSubcategory) {
                    const formattedSubName = subKey
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ");

                    return (
                      <SidebarCollapsibleGroup
                        key={subKey}
                        title={formattedSubName}
                        entries={subEntries}
                        currentSlug={currentSlug}
                        pathname={pathname}
                        defaultOpen={true}
                      />
                    );
                  }

                  // Root entries in active domain
                  return subEntries.map((entry) => (
                    <SidebarEntryItem
                      key={entry.slug}
                      entry={entry}
                      currentSlug={currentSlug}
                      pathname={pathname}
                    />
                  ));
                },
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0 my-1" />

      {/* Sidebar Footer: Home link, GitHub repo, and Theme Toggle */}
      <SidebarFooter>
        <SidebarMenu className="mb-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Home className="size-4" />
              <span>Archive Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center justify-between pt-1">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="View source repository on GitHub"
            title="GitHub Repository"
          >
            <span className="sr-only">GitHub</span>
            <GitHubIcon className="size-4" />
          </a>

          <ThemeToggle variant="compact" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
