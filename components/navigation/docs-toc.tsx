"use client";

/**
 * Scroll-aware Table of Contents (TOC) component.
 *
 * Observes headings currently in view and highlights the active heading in the TOC.
 * Supports smooth scrolling and indentation for nested heading levels (h2, h3).
 */

import { AlignLeft, ArrowUp } from "lucide-react";
import * as React from "react";
import type { ContentHeading } from "@/lib/content/types";
import { cn } from "@/lib/utils";

interface DocsTocProps {
  headings: ContentHeading[];
  className?: string;
}

export function DocsToc({ headings, className }: DocsTocProps) {
  // Filter for readable TOC levels (h2 and h3)
  const tocHeadings = React.useMemo(
    () => headings.filter((h) => h.depth === 2 || h.depth === 3),
    [headings],
  );

  const [activeSlug, setActiveSlug] = React.useState<string>("");

  React.useEffect(() => {
    if (tocHeadings.length === 0) return;

    // Default to the first heading initially
    if (!activeSlug && tocHeadings[0]) {
      setActiveSlug(tocHeadings[0].slug);
    }

    const headingElements = tocHeadings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible intersecting headings
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-80px 0% -60% 0%",
        threshold: 0,
      },
    );

    for (const el of headingElements) {
      observer.observe(el);
    }

    // Window scroll listener for top and bottom edge handling
    const handleScroll = () => {
      if (window.scrollY < 80 && tocHeadings[0]) {
        setActiveSlug(tocHeadings[0].slug);
        return;
      }

      const isBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 60;
      if (isBottom && tocHeadings.length > 0) {
        setActiveSlug(tocHeadings[tocHeadings.length - 1].slug);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tocHeadings, activeSlug]);

  if (tocHeadings.length === 0) {
    return null;
  }

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    e.preventDefault();
    const target = document.getElementById(slug);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSlug(slug);
      window.history.pushState(null, "", `#${slug}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (tocHeadings[0]) {
      setActiveSlug(tocHeadings[0].slug);
    }
    window.history.pushState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  };

  return (
    <nav
      aria-label="Table of contents"
      className={cn("flex flex-col gap-2 text-sm", className)}
    >
      <div className="flex items-center gap-2 font-medium text-foreground text-xs uppercase tracking-wider text-muted-foreground mb-1">
        <AlignLeft className="size-3.5" />
        <span>On this page</span>
      </div>

      <div className="relative pl-3 border-l border-border/60 flex flex-col gap-1.5">
        {tocHeadings.map((heading) => {
          const isActive = activeSlug === heading.slug;
          return (
            <a
              key={heading.slug}
              href={`#${heading.slug}`}
              onClick={(e) => handleLinkClick(e, heading.slug)}
              className={cn(
                "block text-xs transition-colors duration-150 line-clamp-2",
                heading.depth === 3 && "pl-3 text-[11px]",
                isActive
                  ? "font-medium text-foreground relative -ml-[13px] pl-3 border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {heading.text}
            </a>
          );
        })}
      </div>

      <div className="pt-3 mt-1 border-t border-border/40">
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowUp className="size-3" />
          <span>Scroll to top</span>
        </button>
      </div>
    </nav>
  );
}
