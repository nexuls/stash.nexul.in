"use client";

/**
 * Knowledge domain switcher for the documentation sidebar.
 *
 * The sidebar is scoped to one domain at a time; this control shows which one
 * and navigates to another. Selecting a domain opens that domain's own page, so
 * the route stays the single source of truth for what the tree displays.
 */

import { CheckIcon, ChevronsUpDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavDomain } from "@/lib/content/nav-tree";
import type { DomainIcons } from "@/lib/icons/domain-icon-svg";
import { getDomainIcon } from "@/lib/icons/domain-icons";
import { cn } from "@/lib/utils";

interface DomainSwitcherProps {
  domains: NavDomain[];
  activeDomain: NavDomain;
  /**
   * Material Icon Theme markup for the domains that have a glyph, resolved on
   * the server. A domain without one keeps its Lucide icon.
   */
  domainIcons?: DomainIcons;
}

interface DomainGlyphProps {
  slug: string;
  icons?: DomainIcons;
  className?: string;
}

/**
 * The mark for one domain: the theme glyph when the server resolved one,
 * otherwise the Lucide icon.
 *
 * A theme glyph carries its own colours — being recognised by hue is half of
 * what it is for — so `className` sizes it and does not recolour it.
 */
function DomainGlyph({ slug, icons, className }: DomainGlyphProps) {
  const svg = icons?.[slug];

  if (svg) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={svg.viewBox}
        className={cn("shrink-0", className)}
        // Build-time markup from the icon theme package, not from content.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted package asset
        dangerouslySetInnerHTML={{ __html: svg.body }}
      />
    );
  }

  const Icon = getDomainIcon(slug);
  return <Icon className={cn("shrink-0", className)} />;
}

export function DomainSwitcher({
  domains,
  activeDomain,
  domainIcons,
}: DomainSwitcherProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobileSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-10 gap-2.5 bg-sidebar-accent/50 hover:bg-sidebar-accent data-open:bg-sidebar-accent"
                aria-label={`Knowledge domain: ${activeDomain.label}. Switch domain`}
              />
            }
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-primary">
              <DomainGlyph
                slug={activeDomain.slug}
                icons={domainIcons}
                className="size-5!"
              />
            </span>

            <span className="truncate font-mono text-[13px] tracking-tight text-foreground">
              {activeDomain.slug}
            </span>

            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {activeDomain.entryCount}
            </span>

            <ChevronsUpDown className="shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 p-1"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                Knowledge domains
              </DropdownMenuLabel>
              {domains.map((domain) => {
                const isActive = domain.slug === activeDomain.slug;

                return (
                  <DropdownMenuItem
                    key={domain.slug}
                    render={<Link href={domain.homePermalink} />}
                    onClick={closeMobileSidebar}
                    className="gap-2.5 px-2 py-1.5 text-[13px]"
                  >
                    <DomainGlyph
                      slug={domain.slug}
                      icons={domainIcons}
                      className="size-4.5! text-muted-foreground"
                    />
                    <span className="truncate font-mono tracking-tight">
                      {domain.slug}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {domain.entryCount}
                    </span>
                    <CheckIcon
                      className={
                        isActive
                          ? "size-3.5 shrink-0 text-primary"
                          : "size-3.5 shrink-0 text-transparent"
                      }
                    />
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              render={<Link href="/" />}
              onClick={closeMobileSidebar}
              className="gap-2.5 px-2 py-1.5 text-[13px] text-muted-foreground"
            >
              <LayoutGrid className="size-4 shrink-0" />
              <span>All domains</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
