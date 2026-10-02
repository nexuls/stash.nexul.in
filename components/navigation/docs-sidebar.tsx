"use client";

/**
 * Documentation navigation sidebar supporting:
 * 1. Centered in-flow desktop sidebar (pushed close to the content)
 * 2. Floating pop-out sidebar on cursor hover when closed
 * 3. Mobile sheet drawer on small screens
 */

import * as React from "react";
import { DocsSidebarContent } from "@/components/navigation/docs-sidebar-content";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import type { ContentCategory, ContentEntry } from "@/lib/content/types";
import { cn } from "@/lib/utils";

interface DocsSidebarProps {
  entries: ContentEntry[];
  categories: ContentCategory[];
  currentSlug?: string;
  className?: string;
}

export function DocsSidebar({
  entries,
  categories,
  currentSlug,
  className,
}: DocsSidebarProps) {
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  const [isFloatingOpen, setIsFloatingOpen] = React.useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Clear hover timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Window mouse listener when sidebar is closed on desktop
  React.useEffect(() => {
    if (open || isMobile) {
      setIsFloatingOpen(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Trigger floating sidebar when cursor is within 40px of left screen edge
      if (e.clientX <= 40) {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setIsFloatingOpen(true);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [open, isMobile]);

  const handleFloatingMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsFloatingOpen(true);
  };

  const handleFloatingMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsFloatingOpen(false);
    }, 200);
  };

  return (
    <>
      {/* 1. Desktop In-flow Sidebar (Centered next to content when pinned open) */}
      {!isMobile && open && (
        <aside
          className={cn(
            "hidden md:flex flex-col w-[270px] shrink-0 sticky top-0 h-screen border-r border-border/40 py-2 pl-2 pr-3 bg-background/50",
            className,
          )}
        >
          <DocsSidebarContent
            entries={entries}
            categories={categories}
            currentSlug={currentSlug}
            onCollapse={() => setOpen(false)}
          />
        </aside>
      )}

      {/* 2. Desktop Floating Hover Trigger Zone & Floating Sidebar (When closed) */}
      {!isMobile && !open && (
        <>
          {/* Subtle left hover detector strip */}
          <div
            className="fixed inset-y-0 left-0 w-8 z-40 group cursor-e-resize"
            onMouseEnter={handleFloatingMouseEnter}
            aria-hidden="true"
          />

          {/* Floating Sidebar Card */}
          <aside
            className={cn(
              "fixed left-4 top-4 bottom-4 z-50 w-[275px] rounded-2xl border border-sidebar-border bg-sidebar/95 backdrop-blur-md shadow-2xl transition-all duration-200 flex flex-col overflow-hidden",
              isFloatingOpen
                ? "translate-x-0 opacity-100 pointer-events-auto"
                : "-translate-x-full opacity-0 pointer-events-none",
            )}
            onMouseEnter={handleFloatingMouseEnter}
            onMouseLeave={handleFloatingMouseLeave}
          >
            <DocsSidebarContent
              entries={entries}
              categories={categories}
              currentSlug={currentSlug}
              isFloating={true}
              onPin={() => {
                setOpen(true);
                setIsFloatingOpen(false);
              }}
              onNavigate={() => {
                setIsFloatingOpen(false);
              }}
            />
          </aside>
        </>
      )}

      {/* 3. Mobile Sheet Drawer */}
      {isMobile && (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side="left"
            className="w-[280px] p-0 bg-sidebar border-sidebar-border text-sidebar-foreground"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Browse documentation topics</SheetDescription>
            </SheetHeader>
            <DocsSidebarContent
              entries={entries}
              categories={categories}
              currentSlug={currentSlug}
              onNavigate={() => setOpenMobile(false)}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
