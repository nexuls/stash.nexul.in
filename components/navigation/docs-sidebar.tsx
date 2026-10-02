"use client";

/**
 * Documentation navigation sidebar supporting:
 * 1. Centered in-flow desktop sidebar with smooth width transition & left background fill
 * 2. Graceful conversion to floating pop-out sidebar on cursor hover when closed
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

  // When user collapses fixed sidebar, gracefully transition into floating mode
  const handleCollapse = () => {
    setOpen(false);
    setIsFloatingOpen(true);
  };

  // When user pins floating sidebar, convert back to fixed docked mode
  const handlePin = () => {
    setOpen(true);
    setIsFloatingOpen(false);
  };

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFloatingOpen) {
        setIsFloatingOpen(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isMobile, isFloatingOpen]);

  const handleFloatingMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsFloatingOpen(true);
  };

  const handleFloatingMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsFloatingOpen(false);
    }, 250);
  };

  return (
    <>
      {/* 1. Desktop In-flow Sidebar Slot */}
      {/* Contains smooth width collapse/expand transition and left-edge background fill */}
      {!isMobile && (
        <aside
          className={cn(
            "relative hidden md:flex flex-col shrink-0 sticky top-0 h-screen transition-[width,opacity] duration-300 ease-in-out",
            open
              ? "w-[280px] opacity-100 pointer-events-auto"
              : "w-0 opacity-0 pointer-events-none overflow-hidden",
            className,
          )}
          aria-hidden={!open}
        >
          {/* Left background fill: fills from the left edge of the viewport to the sidebar's right border */}
          <div
            className={cn(
              "absolute inset-y-0 right-0 w-[100vw] bg-sidebar border-r border-sidebar-border -z-10 pointer-events-none transition-opacity duration-300 ease-in-out",
              open ? "opacity-100" : "opacity-0",
            )}
          />

          {/* Docked Sidebar Content Container (retains fixed width during slot animation) */}
          <div className="w-[280px] h-full flex flex-col py-2 pl-2 pr-3">
            <DocsSidebarContent
              entries={entries}
              categories={categories}
              currentSlug={currentSlug}
              onCollapse={handleCollapse}
            />
          </div>
        </aside>
      )}

      {/* 2. Desktop Floating Sidebar (When closed / hovering / gracefully converting) */}
      {!isMobile && !open && (
        <>
          {/* Left edge hover detector strip */}
          <div
            className="fixed inset-y-0 left-0 w-8 z-40 cursor-e-resize"
            onMouseEnter={handleFloatingMouseEnter}
            aria-hidden="true"
          />

          {/* Floating Sidebar Card */}
          <aside
            className={cn(
              "fixed left-4 top-3 bottom-3 z-50 w-[280px] rounded-2xl border border-sidebar-border bg-sidebar/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
              isFloatingOpen
                ? "translate-x-0 opacity-100 scale-100 pointer-events-auto"
                : "-translate-x-[calc(100%+2rem)] opacity-0 scale-95 pointer-events-none",
            )}
            onMouseEnter={handleFloatingMouseEnter}
            onMouseLeave={handleFloatingMouseLeave}
            aria-label="Floating navigation sidebar"
          >
            <DocsSidebarContent
              entries={entries}
              categories={categories}
              currentSlug={currentSlug}
              isFloating={true}
              onPin={handlePin}
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
