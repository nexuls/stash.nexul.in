/**
 * LinkCard and CardGrid: cross-references between entries.
 *
 * A cross-reference earns a larger target than an inline link when it is the
 * next thing to read rather than an aside. The card stays flat — a border and
 * a hover tint, no shadow — so a row of them does not read as a product page.
 */

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { type LinkCardProps, linkCardPropsSchema } from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

export function CardGrid({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("my-6 grid gap-3 sm:grid-cols-2", className)} {...props}>
      {children}
    </div>
  );
}

export function LinkCard({
  href,
  title,
  description,
  eyebrow,
  className,
  children,
}: LinkCardProps) {
  const validation = linkCardPropsSchema.safeParse({
    href,
    title,
    description,
    eyebrow,
    className,
  });

  if (!validation.success) {
    return (
      <p className="font-mono text-xs text-destructive">
        Malformed LinkCard: {validation.error.issues[0]?.message}
      </p>
    );
  }

  const isExternal = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
  const Component = isExternal ? "a" : Link;

  return (
    <Component
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group/card flex flex-col gap-1 rounded-lg border border-border bg-card/40 px-4 py-3.5 no-underline",
        "transition-colors hover:border-primary/40 hover:bg-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {eyebrow && (
        <span className="font-mono text-[11px] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <span className="flex items-start gap-1.5 font-medium text-foreground leading-6">
        <span className="flex-1">{title}</span>
        <ArrowUpRight
          className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/card:text-primary"
          aria-hidden
        />
      </span>
      {(description || children) && (
        <span className="text-sm text-muted-foreground leading-relaxed">
          {description ?? children}
        </span>
      )}
    </Component>
  );
}
