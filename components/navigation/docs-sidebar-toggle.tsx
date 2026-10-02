"use client";

/**
 * Desktop sidebar toggle button.
 *
 * Renders next to in-content breadcrumbs on desktop when the sidebar is collapsed,
 * allowing users to easily pin the sidebar open again.
 */

import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function DocsSidebarToggle({ className }: { className?: string }) {
  const { open, setOpen, isMobile } = useSidebar();

  if (isMobile || open) return null;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setOpen(true)}
      className={cn(
        "size-7 mr-2 -ml-1 text-muted-foreground hover:text-foreground shrink-0 transition-colors",
        className,
      )}
      title="Expand and pin sidebar"
      aria-label="Expand and pin sidebar"
    >
      <PanelLeft className="size-4" />
    </Button>
  );
}
