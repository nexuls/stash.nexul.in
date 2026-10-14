"use client";

import { CheckIcon, ChevronsUpDown, Home } from "lucide-react";
import Link from "next/link";
import { getDomainIcon } from "@/components/landing/domain-card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/sidebar";

export interface DomainItem {
  slug: string;
  name: string;
  count: number;
  firstEntryPermalink: string;
}

interface DomainSwitcherProps {
  domains: DomainItem[];
  activeDomainSlug: string;
  onSelectDomain?: (slug: string) => void;
}

export function DomainSwitcher({
  domains,
  activeDomainSlug,
  onSelectDomain,
}: DomainSwitcherProps) {
  const activeDomain =
    domains.find((d) => d.slug === activeDomainSlug) || domains[0];

  const ActiveIcon = activeDomain
    ? getDomainIcon(activeDomain.name)
    : getDomainIcon("general");

  if (!activeDomain) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="w-full justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-2 shadow-2xs transition-all duration-200 hover:border-border hover:bg-card hover:shadow-xs data-[state=open]:border-primary/40 data-[state=open]:bg-sidebar-accent"
                aria-label={`Current domain: ${activeDomain.name}. Click to change domain`}
              />
            }
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors">
              <ActiveIcon className="size-4" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate text-xs font-medium text-muted-foreground">
                Domain
              </span>
              <span className="truncate text-sm font-semibold text-foreground">
                {activeDomain.name}
              </span>
            </div>

            <Badge
              variant="secondary"
              className="font-mono text-[10px] shrink-0"
            >
              {activeDomain.count}
            </Badge>

            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--anchor-width) min-w-60 rounded-xl p-1.5 shadow-md"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Knowledge Domains
            </DropdownMenuLabel>

            <DropdownMenuGroup className="space-y-0.5">
              {domains.map((domain) => {
                const isSelected = domain.slug === activeDomain.slug;
                const Icon = getDomainIcon(domain.name);

                return (
                  <DropdownMenuItem
                    key={domain.slug}
                    render={<Link href={domain.firstEntryPermalink} />}
                    onClick={() => {
                      if (onSelectDomain) {
                        onSelectDomain(domain.slug);
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-muted-foreground">
                        <Icon className="size-3.5" />
                      </div>
                      <span className="truncate font-semibold text-foreground">
                        {domain.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        {domain.count}
                      </Badge>
                      {isSelected ? (
                        <CheckIcon className="size-3.5 text-primary" />
                      ) : (
                        <span className="size-3.5" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1.5" />

            <DropdownMenuItem
              render={<Link href="/" />}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Home className="size-4" />
              <span>Back to Home (All Domains)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
