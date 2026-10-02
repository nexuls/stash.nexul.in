"use client";

/**
 * Accessible theme switcher component using next-themes.
 *
 * Supports dropdown menu variant and compact inline variant for sidebar footer.
 */

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "dropdown" | "compact";
}

export function ThemeToggle({
  className,
  variant = "dropdown",
}: ThemeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:text-foreground cursor-pointer",
            mounted &&
              resolvedTheme === "light" &&
              "bg-background text-foreground shadow-xs",
          )}
          title="Light theme"
          aria-label="Switch to light theme"
        >
          <Sun className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:text-foreground cursor-pointer",
            mounted &&
              resolvedTheme === "dark" &&
              "bg-background text-foreground shadow-xs",
          )}
          title="Dark theme"
          aria-label="Switch to dark theme"
        >
          <Moon className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={className}
            aria-label="Toggle theme"
          />
        }
      >
        {mounted ? (
          resolvedTheme === "dark" ? (
            <Moon className="size-4 transition-transform" />
          ) : (
            <Sun className="size-4 transition-transform" />
          )
        ) : (
          <span className="size-4 inline-block" />
        )}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="gap-2 cursor-pointer"
        >
          <Sun className="size-4" />
          <span>Light</span>
          {mounted && theme === "light" && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="gap-2 cursor-pointer"
        >
          <Moon className="size-4" />
          <span>Dark</span>
          {mounted && theme === "dark" && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="gap-2 cursor-pointer"
        >
          <Laptop className="size-4" />
          <span>System</span>
          {mounted && theme === "system" && (
            <span className="ml-auto text-xs text-muted-foreground">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
