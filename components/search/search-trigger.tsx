"use client";

/**
 * Client-side search trigger button.
 *
 * Emits the `stash:open-search` custom event to open the search modal dialog (Stage 5).
 * Available in 'header', 'sidebar', and 'button' display variants.
 */

import { Search } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  variant?: "header" | "sidebar" | "button";
  className?: string;
  children?: React.ReactNode;
}

export function SearchTrigger({
  variant = "button",
  className,
  children,
}: SearchTriggerProps) {
  const triggerSearch = () => {
    window.dispatchEvent(
      new CustomEvent("stash:open-search", { bubbles: true }),
    );
  };

  if (variant === "header") {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "relative h-8 w-9 p-0 sm:w-44 sm:justify-start sm:px-3 sm:py-1.5 md:w-56 text-muted-foreground shadow-none hover:text-foreground cursor-pointer",
          className,
        )}
        onClick={triggerSearch}
        aria-label="Search documentation"
      >
        <Search className="size-3.5 sm:mr-2" />
        <span className="hidden sm:inline-flex text-xs">Search docs...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </Button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-input bg-background/50 px-3 py-1.5 text-xs text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
          className,
        )}
        onClick={triggerSearch}
      >
        <span className="flex items-center gap-2">
          <Search className="size-3.5 text-muted-foreground" />
          <span>Search docs...</span>
        </span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      className={cn("cursor-pointer", className)}
      onClick={triggerSearch}
    >
      <Search className="size-4 mr-1.5 text-muted-foreground" />
      <span>{children || "Search repository (⌘K)"}</span>
    </Button>
  );
}
