"use client";

/**
 * Scroll-aware Table of Contents (TOC) component.
 *
 * Nesting is drawn as an SVG track: every item contributes a muted guide line (with a
 * curved connector when the depth changes) and a primary-coloured copy of the whole
 * track is laid over it, clipped to the headings currently in the viewport. A small dot
 * rides along the track path at the leading edge of that range, so it points in the
 * direction the reader is scrolling.
 */

import { AlignLeft, ArrowUp } from "lucide-react";
import * as React from "react";
import type { ContentHeading } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const SVG_NS = "http://www.w3.org/2000/svg";

interface DocsTocProps {
  headings: ContentHeading[];
  className?: string;
}

/** Nearest scrollable ancestor, since the page scrolls inside a container. */
function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/** Horizontal position of the guide line for a heading depth. */
function getLineOffset(depth: number): number {
  return depth <= 2 ? 8 : 16;
}

/** Text indentation for a heading depth. */
function getItemOffset(depth: number): number {
  return depth <= 2 ? 20 : 32;
}

/**
 * Tracks every heading currently visible in the viewport.
 *
 * Mirrors the behaviour of a documentation reader: all intersecting headings stay
 * active, a heading keeps its state until the observer reports otherwise, and when
 * nothing intersects the heading closest to the top of the viewport is used instead.
 */
function useActiveSlugs(headings: ContentHeading[]): string[] {
  const [activeSlugs, setActiveSlugs] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (headings.length === 0) {
      setActiveSlugs([]);
      return;
    }

    const items = headings.map((heading) => ({
      id: heading.slug,
      active: false,
      fallback: false,
    }));

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.length === 0) return;

        let hasActive = false;
        for (const item of items) {
          const entry = entries.find((e) => e.target.id === item.id);
          const active = entry
            ? entry.isIntersecting
            : item.active && !item.fallback;

          if (item.active !== active) {
            item.active = active;
            item.fallback = false;
          }
          if (active) hasActive = true;
        }

        // Nothing intersects (a long section fills the viewport): fall back to the
        // heading nearest the top edge.
        if (!hasActive && entries[0].rootBounds) {
          const viewTop = entries[0].rootBounds.top;
          let closest: (typeof items)[number] | undefined;
          let min = Number.MAX_VALUE;

          for (const item of items) {
            const element = document.getElementById(item.id);
            if (!element) continue;
            const distance = Math.abs(
              viewTop - element.getBoundingClientRect().top,
            );
            if (distance < min) {
              min = distance;
              closest = item;
            }
          }

          if (closest) {
            closest.active = true;
            closest.fallback = true;
          }
        }

        const next = items.filter((item) => item.active).map((item) => item.id);
        setActiveSlugs((prev) =>
          prev.length === next.length && prev.every((id, i) => id === next[i])
            ? prev
            : next,
        );
      },
      { threshold: 0.9 },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.slug);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [headings]);

  return activeSlugs;
}

interface TrackGeometry {
  /** Full track path, drawn once over every item. */
  d: string;
  width: number;
  height: number;
  /** `[top, bottom]` of each item's vertical segment, in track coordinates. */
  positions: [number, number][];
  /** `[start, end]` of each item's segment measured along the path, for the dot. */
  lengths: [number, number][];
}

/**
 * Measures the rendered items and derives the overlay path, per-item bands, and the
 * path-length range of each band.
 */
function useTrackGeometry(
  containerRef: React.RefObject<HTMLDivElement | null>,
  headings: ContentHeading[],
) {
  const [geometry, setGeometry] = React.useState<TrackGeometry | null>(null);

  const measure = React.useCallback(() => {
    const container = containerRef.current;
    if (!container || container.clientHeight === 0) return;
    if (headings.length === 0) {
      setGeometry(null);
      return;
    }

    let width = 0;
    let height = 0;
    let d = "";
    const positions: [number, number][] = [];
    const offsets: number[] = [];

    for (const heading of headings) {
      const element = container.querySelector<HTMLElement>(
        `a[href="#${CSS.escape(heading.slug)}"]`,
      );
      if (!element) continue;

      const styles = getComputedStyle(element);
      const x = getLineOffset(heading.depth) + 0.5;
      const top = element.offsetTop + Number.parseFloat(styles.paddingTop);
      const bottom =
        element.offsetTop +
        element.clientHeight -
        Number.parseFloat(styles.paddingBottom);

      width = Math.max(width, x + 8);
      height = Math.max(height, bottom);

      if (positions.length === 0) {
        d += `M${x} ${top} L${x} ${bottom}`;
      } else {
        const [, previousBottom] = positions[positions.length - 1];
        const previousX = offsets[offsets.length - 1];
        d += ` C ${previousX} ${top - 4} ${x} ${previousBottom + 4} ${x} ${top} L${x} ${bottom}`;
      }

      positions.push([top, bottom]);
      offsets.push(x);
    }

    // Map each band onto the path so the dot can be placed with `offset-distance`.
    const probe = document.createElementNS(SVG_NS, "path");
    probe.setAttribute("d", d);
    const total = probe.getTotalLength();
    const lengths: [number, number][] = [];

    for (let i = 0; i < positions.length; i++) {
      const [top, bottom] = positions[i];
      let start = i > 0 ? lengths[i - 1][1] + (top - positions[i - 1][1]) : top;
      while (start < total && probe.getPointAtLength(start).y < top) start++;
      lengths.push([start, start + bottom - top]);
    }

    setGeometry({ d, width, height, positions, lengths });
  }, [containerRef, headings]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    measure();

    return () => observer.disconnect();
  }, [containerRef, measure]);

  return geometry;
}

/** Primary-coloured overlay clipped to the active range, plus the travelling dot. */
function TocThumb({
  geometry,
  startIndex,
  endIndex,
}: {
  geometry: TrackGeometry;
  startIndex: number;
  endIndex: number;
}) {
  // Remembers which end of the range leads, so the dot sits where the reader is going.
  const directionRef = React.useRef({ startIndex, endIndex, isUp: false });
  const previous = directionRef.current;
  const isUp =
    previous.startIndex > startIndex ||
    previous.endIndex > endIndex ||
    (previous.startIndex === startIndex &&
      previous.endIndex === endIndex &&
      previous.isUp);
  directionRef.current = { startIndex, endIndex, isUp };

  const [top] = geometry.positions[startIndex];
  const [, bottom] = geometry.positions[endIndex];
  const offsetDistance = isUp
    ? geometry.lengths[startIndex][0]
    : geometry.lengths[endIndex][1];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 inset-s-0 z-10"
      style={{ width: geometry.width, height: geometry.height }}
    >
      <svg
        aria-hidden="true"
        className="absolute transition-[clip-path] duration-300 ease-out"
        style={{
          width: geometry.width,
          height: geometry.height,
          clipPath: `polygon(0 ${top}px, 100% ${top}px, 100% ${bottom}px, 0 ${bottom}px)`,
        }}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      >
        <path
          className="stroke-primary-foreground"
          d={geometry.d}
          fill="none"
          strokeWidth="1"
        />
      </svg>
      <div
        className="absolute left-0 size-1 rounded-full bg-primary-foreground transition-[offset-distance] duration-300 ease-out"
        style={{
          offsetPath: `path("${geometry.d}")`,
          offsetDistance: `${offsetDistance}px`,
        }}
      />
    </div>
  );
}

/** Muted guide line for a single item, including the connector to the previous item. */
function TocItemTrack({
  depth,
  previousDepth,
  nextDepth,
}: {
  depth: number;
  previousDepth: number;
  nextDepth: number;
}) {
  const line = getLineOffset(depth);
  const previousLine = getLineOffset(previousDepth);
  const nextLine = getLineOffset(nextDepth);
  const isConnector = previousLine !== line;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "absolute inset-s-0 -top-1.5 bottom-0 h-[calc(100%+0.375rem)]",
        line !== nextLine && "h-full bottom-1.5",
      )}
      style={{ width: Math.max(previousLine, line) + 9 }}
    >
      {isConnector && (
        <path
          className="stroke-border"
          d={`M ${previousLine + 0.5} 0 C ${previousLine + 0.5} 8 ${line + 0.5} 4 ${line + 0.5} 12`}
          fill="none"
          strokeWidth="1"
        />
      )}
      <line
        className="stroke-border"
        strokeWidth="1"
        x1={line + 0.5}
        x2={line + 0.5}
        y1={isConnector ? 12 : 6}
        y2="100%"
      />
    </svg>
  );
}

export function DocsToc({ headings, className }: DocsTocProps) {
  // Filter for readable TOC levels (h2 and h3)
  const tocHeadings = React.useMemo(
    () => headings.filter((h) => h.depth === 2 || h.depth === 3),
    [headings],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const geometry = useTrackGeometry(containerRef, tocHeadings);
  const activeSlugs = useActiveSlugs(tocHeadings);

  if (tocHeadings.length === 0) {
    return null;
  }

  const startIndex = tocHeadings.findIndex((h) => activeSlugs.includes(h.slug));
  const endIndex = tocHeadings.findLastIndex((h) =>
    activeSlugs.includes(h.slug),
  );

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    e.preventDefault();
    const target = document.getElementById(slug);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${slug}`);
    }
  };

  const scrollToTop = () => {
    // Walk up from the content, not from the TOC: the TOC rail scrolls on its own.
    const scrollParent = getScrollParent(
      tocHeadings[0] ? document.getElementById(tocHeadings[0].slug) : null,
    );
    if (scrollParent) {
      scrollParent.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="mb-1 flex items-center gap-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
        <AlignLeft className="size-4" />
        <span>On this page</span>
      </div>

      <div className="relative flex flex-col" ref={containerRef}>
        {geometry && startIndex >= 0 && endIndex >= 0 && (
          <TocThumb
            endIndex={endIndex}
            geometry={geometry}
            startIndex={startIndex}
          />
        )}

        {tocHeadings.map((heading, index) => {
          const isActive = activeSlugs.includes(heading.slug);
          const isFirst = index === 0;
          const isLast = index === tocHeadings.length - 1;

          return (
            <a
              className={cn(
                "relative py-1.5 text-sm transition-colors duration-150",
                isFirst && "pt-0",
                isLast && "pb-0",
                isActive
                  ? "font-medium text-primary-foreground/70"
                  : "text-muted-foreground hover:text-foreground",
              )}
              href={`#${heading.slug}`}
              key={heading.slug}
              onClick={(e) => handleLinkClick(e, heading.slug)}
              style={{ paddingInlineStart: getItemOffset(heading.depth) }}
            >
              <TocItemTrack
                depth={heading.depth}
                nextDepth={
                  isLast ? heading.depth : tocHeadings[index + 1].depth
                }
                previousDepth={
                  isFirst ? heading.depth : tocHeadings[index - 1].depth
                }
              />
              {heading.text}
            </a>
          );
        })}
      </div>

      <div className="mt-1 border-border/40 border-t pt-3">
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
          onClick={scrollToTop}
          type="button"
        >
          <ArrowUp className="size-3" />
          <span>Scroll to top</span>
        </button>
      </div>
    </nav>
  );
}
