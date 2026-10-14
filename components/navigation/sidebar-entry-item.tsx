"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { ContentEntry } from "@/lib/content/types";

interface SidebarEntryItemProps {
  entry: ContentEntry;
  currentSlug?: string;
  pathname: string;
}

export function SidebarEntryItem({
  entry,
  currentSlug,
  pathname,
}: SidebarEntryItemProps) {
  const isActive = currentSlug === entry.slug || pathname === entry.permalink;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={entry.permalink} />}
        isActive={isActive}
        className="rounded-lg text-xs font-medium transition-colors"
      >
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{entry.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
