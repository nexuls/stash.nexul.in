"use client";

/**
 * Re-export of the shadcn SidebarTrigger for use in content headers.
 *
 * Renders the standard sidebar toggle button from the shadcn sidebar system.
 */

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function DocsSidebarToggle({ className }: { className?: string }) {
  return <SidebarTrigger className={cn("-ml-1", className)} />;
}
