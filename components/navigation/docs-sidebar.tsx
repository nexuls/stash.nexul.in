"use client";

/**
 * Documentation navigation sidebar.
 *
 * Scoped to one knowledge domain at a time: a switcher selects the domain and
 * the tree below it shows that domain's contents as the directory structure it
 * is derived from. The group containing the current note is expanded and
 * scrolled into view on navigation.
 *
 * Keyboard: "/" focuses the filter, arrow keys walk the tree, Left/Right
 * collapse and expand groups, Enter in the filter opens the first match.
 */

import { Archive, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { GitHubIcon } from "@/components/icons/github-icon";
import { DomainSwitcher } from "@/components/navigation/domain-switcher";
import { SidebarNavTree } from "@/components/navigation/sidebar-nav-tree";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInput,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  buildNavTree,
  countNavEntries,
  filterNavTree,
  getActiveDomain,
  getActiveTrail,
  getNavDomains,
} from "@/lib/content/nav-tree";
import type { ContentEntry } from "@/lib/content/types";
import { siteConfig } from "@/lib/site-config";

interface DocsSidebarProps {
  entries: ContentEntry[];
}

/** Moves focus between visible tree rows, wrapping at both ends. */
function moveRowFocus(
  container: HTMLElement,
  delta: number | "first" | "last",
) {
  const rows = Array.from(
    container.querySelectorAll<HTMLElement>("[data-nav-row]"),
  ).filter((row) => row.offsetParent !== null);

  if (rows.length === 0) return;

  if (delta === "first") {
    rows[0]?.focus();
    return;
  }
  if (delta === "last") {
    rows[rows.length - 1]?.focus();
    return;
  }

  const index = rows.indexOf(document.activeElement as HTMLElement);
  const next = index === -1 ? 0 : (index + delta + rows.length) % rows.length;
  rows[next]?.focus();
}

export function DocsSidebar({ entries }: DocsSidebarProps) {
  const pathname = usePathname() ?? "";
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  const filterRef = React.useRef<HTMLInputElement>(null);
  const navRef = React.useRef<HTMLDivElement>(null);

  const [query, setQuery] = React.useState("");

  const domains = React.useMemo(
    () => getNavDomains(buildNavTree(entries)),
    [entries],
  );
  const activeDomain = getActiveDomain(domains, pathname);

  const visibleNodes = React.useMemo(
    () => filterNavTree(activeDomain?.nodes ?? [], query),
    [activeDomain, query],
  );

  const isFiltering = query.trim().length > 0;
  const matchCount = React.useMemo(
    () => countNavEntries(visibleNodes),
    [visibleNodes],
  );

  // A filter is scoped to the open domain, so surface where the other hits are.
  const otherDomainMatches = React.useMemo(() => {
    if (!isFiltering || matchCount > 0) return [];

    return domains
      .filter((domain) => domain.slug !== activeDomain?.slug)
      .map((domain) => ({
        domain,
        count: countNavEntries(filterNavTree(domain.nodes, query)),
      }))
      .filter((candidate) => candidate.count > 0);
  }, [domains, activeDomain, query, isFiltering, matchCount]);

  // Directories start expanded, matching the shape of the archive at a glance;
  // only the ones a reader collapses are tracked.
  const [closedGroups, setClosedGroups] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const handleToggleGroup = React.useCallback((id: string, open: boolean) => {
    setClosedGroups((previous) => {
      if (open === !previous.has(id)) return previous;
      const next = new Set(previous);
      if (open) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // A filter is a way to get somewhere; once you arrive, show the full context.
  const lastPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    setQuery("");
  }, [pathname]);

  // Navigating to a note always reveals it, even inside a collapsed directory.
  React.useEffect(() => {
    const trail = getActiveTrail(entries, pathname);
    if (trail.length === 0) return;

    setClosedGroups((previous) => {
      if (trail.every((id) => !previous.has(id))) return previous;
      const next = new Set(previous);
      for (const id of trail) next.delete(id);
      return next;
    });
  }, [entries, pathname]);

  // Keep the current note visible, scrolling the sidebar only.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measures the DOM whenever the route or the expanded directories change
  React.useEffect(() => {
    const row = navRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    const scroller = row?.closest<HTMLElement>('[data-sidebar="content"]');
    if (!row || !scroller) return;

    const rowBox = row.getBoundingClientRect();
    const scrollerBox = scroller.getBoundingClientRect();

    if (rowBox.top < scrollerBox.top || rowBox.bottom > scrollerBox.bottom) {
      scroller.scrollTop +=
        rowBox.top - scrollerBox.top - scrollerBox.height / 3;
    }
  }, [pathname, closedGroups]);

  // "/" jumps to the filter from anywhere, opening the sidebar if it is closed.
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      event.preventDefault();
      if (isMobile) {
        setOpenMobile(true);
      } else {
        setOpen(true);
      }
      // Wait for the sidebar to mount its content before taking focus.
      requestAnimationFrame(() => filterRef.current?.focus());
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, setOpen, setOpenMobile]);

  function clearFilter() {
    setQuery("");
    filterRef.current?.focus();
  }

  function handleFilterKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (query) {
        event.preventDefault();
        setQuery("");
        return;
      }
      filterRef.current?.blur();
      return;
    }

    if (event.key === "ArrowDown" && navRef.current) {
      event.preventDefault();
      moveRowFocus(navRef.current, "first");
      return;
    }

    // Enter opens the top match by activating the link the tree already renders.
    if (event.key === "Enter") {
      const firstLink =
        navRef.current?.querySelector<HTMLAnchorElement>("a[data-nav-row]");
      if (!firstLink) return;
      event.preventDefault();
      firstLink.click();
    }
  }

  function handleTreeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const container = navRef.current;
    const row = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-nav-row]",
    );
    if (!container || !row) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveRowFocus(container, 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveRowFocus(container, -1);
        break;
      case "Home":
        event.preventDefault();
        moveRowFocus(container, "first");
        break;
      case "End":
        event.preventDefault();
        moveRowFocus(container, "last");
        break;
      case "ArrowRight":
      case "ArrowLeft": {
        const groupId = row.dataset.navGroup;
        if (!groupId) return;
        event.preventDefault();
        handleToggleGroup(groupId, event.key === "ArrowRight");
        break;
      }
      default:
        break;
    }
  }

  return (
    <Sidebar className="border-none overflow-clip py-2 bg-sidebar">
      <SidebarHeader className="gap-2.5">
        <div className="flex items-center justify-between gap-2 px-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Archive className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>

          <SidebarTrigger />
        </div>

        {activeDomain && (
          <DomainSwitcher domains={domains} activeDomain={activeDomain} />
        )}

        <div>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <SidebarInput
              ref={filterRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleFilterKeyDown}
              placeholder="Filter notes"
              aria-label={`Filter notes in ${activeDomain?.label ?? "this domain"} by title, path, or tag`}
              aria-describedby="sidebar-filter-status"
              className="pr-8 pl-8 text-[13px]"
            />
            {isFiltering ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearFilter}
                className="absolute top-1/2 right-1 size-6 -translate-y-1/2 text-muted-foreground"
              >
                <X className="size-3.5" />
                <span className="sr-only">Clear filter</span>
              </Button>
            ) : (
              <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                /
              </kbd>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <nav
            ref={navRef}
            onKeyDown={handleTreeKeyDown}
            aria-label={`${activeDomain?.label ?? "Archive"} contents`}
          >
            {matchCount === 0 ? (
              <div className="px-2 py-5 text-center">
                <p className="text-xs text-muted-foreground">
                  Nothing in{" "}
                  <span className="font-mono">{activeDomain?.slug}</span>{" "}
                  matches “{query.trim()}”.
                </p>

                {otherDomainMatches.length > 0 && (
                  <ul className="mt-3 space-y-1 text-left">
                    {otherDomainMatches.map(({ domain, count }) => (
                      <li key={domain.slug}>
                        <Link
                          href={domain.firstPermalink}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          <span className="font-mono">{domain.slug}</span>
                          <span className="ml-auto tabular-nums">{count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilter}
                  className="mt-2 h-7 text-xs"
                >
                  Clear filter
                </Button>
              </div>
            ) : (
              <SidebarNavTree
                nodes={visibleNodes}
                closedGroups={closedGroups}
                onToggleGroup={handleToggleGroup}
                activePermalink={pathname}
                forceOpen={isFiltering}
              />
            )}
          </nav>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0 my-1" />

      <SidebarFooter className="gap-0">
        <div className="flex items-center justify-between gap-2">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
            title="Source repository on GitHub"
          >
            <GitHubIcon className="size-4" />
            <span className="sr-only">GitHub source repository</span>
          </a>

          <ThemeToggle variant="compact" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
