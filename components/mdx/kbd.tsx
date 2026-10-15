/**
 * Kbd: a physical key, as printed on a keyboard.
 *
 * The key cap itself is drawn by `.stash-doc kbd` in globals.css. MDX passes a
 * `<kbd>` an author types straight through as HTML without consulting the
 * component registry, so styling the element rather than the component is what
 * keeps both forms identical.
 */

import type * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"kbd">) {
  return (
    <kbd className={cn(className)} {...props}>
      {children}
    </kbd>
  );
}
