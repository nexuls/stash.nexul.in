"use client";

/**
 * Accessible theme switcher component using next-themes.
 *
 * Two presentations: a dropdown listing every theme, and a compact control that
 * shows the themes as a segmented group.
 *
 * The compact group is one button rather than one per segment. It reads as a
 * set of choices, but it behaves as a single control: clicking anywhere in it
 * advances to the next theme, so there is one hit target, one tab stop and one
 * accessible name instead of two or three that each claim to do something
 * different.
 */

import { Laptop, type LucideIcon, Moon, Sun } from "lucide-react";
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

type ThemeName = "light" | "dark" | "system";

interface ThemeOption {
  value: ThemeName;
  label: string;
  Icon: LucideIcon;
}

/** Every theme, in the order the group cycles through them. */
const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Laptop },
];

interface ThemeToggleProps {
  className?: string;
  variant?: "dropdown" | "compact";
  /**
   * Offer the system preference as a third segment of the compact group.
   *
   * Left out by default, where the group is a plain light/dark switch and
   * follows whichever of the two the system currently resolves to.
   */
  showSystem?: boolean;
}

export function ThemeToggle({
  className,
  variant = "dropdown",
  showSystem = false,
}: ThemeToggleProps) {
  const { setTheme: setNextTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function setTheme(next: string) {
    // Not every browser has the View Transitions API, and calling it when it is
    // missing throws before the theme is ever set.
    if (!document.startViewTransition) {
      setNextTheme(next);
      return;
    }

    document.startViewTransition(() => setNextTheme(next));
  }

  if (variant === "compact") {
    const options = showSystem
      ? THEME_OPTIONS
      : THEME_OPTIONS.filter((option) => option.value !== "system");

    // With the system segment on show, the group reflects the preference
    // itself; without it, there is no segment for "system", so it reflects
    // whichever of light and dark that preference currently resolves to.
    const current = (showSystem ? theme : resolvedTheme) as
      | ThemeName
      | undefined;

    // An unrecognised or not-yet-known theme lands on the first option, so the
    // first click always has somewhere sensible to go.
    const index = options.findIndex((option) => option.value === current);
    const next = options[(index + 1) % options.length];
    const label =
      mounted && index !== -1
        ? `Theme: ${options[index].label}. Switch to ${next.label.toLowerCase()}`
        : "Switch theme";

    return (
      <button
        type="button"
        onClick={() => setTheme(next.value)}
        aria-label={label}
        title={label}
        className={cn(
          "group flex cursor-pointer items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        {options.map(({ value, Icon }) => {
          const active = mounted && value === current;

          return (
            <span
              key={value}
              data-theme-option={value}
              data-active={active || undefined}
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all",
                active
                  ? "bg-background text-foreground shadow-xs"
                  : "group-hover:text-foreground/70",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          );
        })}
      </button>
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
          <span className="inline-block size-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer gap-2"
          >
            <Icon className="size-4" />
            <span>{label}</span>
            {mounted && theme === value && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
