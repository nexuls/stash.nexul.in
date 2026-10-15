"use client";

/**
 * The header's backdrop: transparent over the hero's field, solid once the page
 * has scrolled past it.
 *
 * Where scroll-driven animations exist the effect is pure CSS
 * (`.stash-header-backdrop` in `app/globals.css`) and this component does
 * nothing at all. Firefox does not implement them — `animation-timeline:
 * scroll()` does not even parse there — so the same ramp is driven from a
 * scroll listener instead.
 *
 * The page scrolls inside a `ScrollArea`, not the document, so both drivers
 * read that container: the CSS uses `scroll(nearest)` and this reads the
 * scrolling ancestor's `scrollTop`.
 *
 * Notable: Client Component, and deliberately the only one in the header, so
 * the header itself stays on the server and keeps the site config out of the
 * client bundle.
 */

import { useEffect, useRef } from "react";
import { getScrollParent } from "@/lib/dom/scroll-parent";

/** Scroll distance over which the backdrop reaches full strength, in rem. */
const SOLID_AT_REM = 10;

/**
 * Whether a scroll-driven animation is actually running on this element.
 *
 * Asking `CSS.supports` would be a guess: a browser can parse the property and
 * still not run the animation. The timeline an animation is attached to is the
 * fact itself — a scroll-driven one is never the document's timeline.
 */
function isDrivenByScrollTimeline(element: Element): boolean {
  if (typeof element.getAnimations !== "function") return false;

  return element
    .getAnimations()
    .some(
      (animation) =>
        animation.timeline != null && animation.timeline !== document.timeline,
    );
}

export function HeaderBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || isDrivenByScrollTimeline(element)) return;

    // The page scrolls inside a container, so the document never moves and
    // `window.scrollY` would stay at zero. `window` is kept only as the answer
    // for a page that is not wrapped in one.
    const scroller = getScrollParent(element);
    const source: Window | HTMLElement = scroller ?? window;

    let queued = 0;

    function measure() {
      queued = 0;
      if (!element) return;

      // Read the root font size rather than hard-coding 160px, so this and the
      // CSS `animation-range` stay in agreement if the root size changes.
      const rem =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16;
      const offset = scroller ? scroller.scrollTop : window.scrollY;
      const progress = Math.min(1, offset / (SOLID_AT_REM * rem));
      element.style.opacity = String(Math.max(0, progress));
    }

    function schedule() {
      if (queued) return;
      queued = requestAnimationFrame(measure);
    }

    measure();
    source.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (queued) cancelAnimationFrame(queued);
      source.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      element.style.removeProperty("opacity");
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="stash-header-backdrop absolute inset-0 -z-10 border-b border-border bg-background"
    />
  );
}
