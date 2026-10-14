"use client";

import { ChevronRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { ContentEntry } from "@/lib/content/types";

interface SidebarCollapsibleGroupProps {
  title: string;
  entries: ContentEntry[];
  currentSlug?: string;
  pathname: string;
  defaultOpen?: boolean;
}

export function SidebarCollapsibleGroup({
  title,
  entries,
  currentSlug,
  pathname,
  defaultOpen = true,
}: SidebarCollapsibleGroupProps) {
  // Check if any child entry is currently active
  const hasActiveChild = entries.some(
    (e) => currentSlug === e.slug || pathname === e.permalink,
  );

  return (
    <Collapsible
      defaultOpen={defaultOpen || hasActiveChild}
      className="group/collapsible transition-all duration-200"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton className="w-full justify-between gap-2 rounded-lg font-medium transition-colors hover:bg-sidebar-accent">
              <div className="flex items-center gap-2 truncate">
                <FolderOpen className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/collapsible:text-foreground" />
                <span className="truncate">{title}</span>
              </div>
              <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent className="transition-all duration-200 data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
          <SidebarMenuSub className="my-0.5 border-l border-border/50 py-0.5 pl-2.5">
            {entries.map((entry) => {
              const isActive =
                currentSlug === entry.slug || pathname === entry.permalink;

              return (
                <SidebarMenuSubItem key={entry.slug}>
                  <SidebarMenuSubButton
                    render={<Link href={entry.permalink} />}
                    isActive={isActive}
                    className="relative rounded-md text-xs font-normal transition-colors"
                  >
                    <span className="truncate">{entry.title}</span>
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
