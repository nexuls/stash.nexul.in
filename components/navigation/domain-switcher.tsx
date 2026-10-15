"use client";

/**
 * Knowledge domain switcher for the documentation sidebar.
 *
 * The sidebar is scoped to one domain at a time; this control shows which one
 * and navigates to another. Selecting a domain opens its first note, so the
 * route stays the single source of truth for what the tree displays.
 */

import { CheckIcon, ChevronsUpDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { getDomainIcon } from "@/components/landing/domain-card";
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

interface DomainSwitcherProps {
  domains: NavDomain[];
  activeDomain: NavDomain;
}

export function DomainSwitcher({ domains, activeDomain }: DomainSwitcherProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const ActiveIcon = getDomainIcon(activeDomain.slug);

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
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ActiveIcon className="size-3.5" />
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
                const Icon = getDomainIcon(domain.slug);
                const isActive = domain.slug === activeDomain.slug;

                return (
                  <DropdownMenuItem
                    key={domain.slug}
                    render={<Link href={domain.firstPermalink} />}
                    onClick={closeMobileSidebar}
                    className="gap-2.5 px-2 py-1.5 text-[13px]"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
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
