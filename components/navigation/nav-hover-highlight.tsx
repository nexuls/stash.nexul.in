"use client";

/**
 * Shared hover background for a navigation tree.
 *
 * One highlight element is measured onto whichever row the cursor (or keyboard
 * focus) is on, so the background appears to slide between rows instead of
 * each row painting its own. Rows opt in with `data-nav-row`; the rows
 * themselves keep their own hover background suppressed.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface HighlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: string;
}

function measure(container: HTMLElement, row: HTMLElement): HighlightBox {
  const containerBox = container.getBoundingClientRect();
  const rowBox = row.getBoundingClientRect();

  return {
    top: rowBox.top - containerBox.top,
    left: rowBox.left - containerBox.left,
    width: rowBox.width,
    height: rowBox.height,
    radius: getComputedStyle(row).borderRadius,
  };
}

function rowFrom(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>("[data-nav-row]")
    : null;
}

export function NavHoverHighlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rowRef = React.useRef<HTMLElement | null>(null);

  const [box, setBox] = React.useState<HighlightBox | null>(null);
  const [visible, setVisible] = React.useState(false);

  // Purely decorative, so the listeners are attached to the element rather
  // than turning this wrapper into something that looks interactive.
  React.useEffect(() => {
    if (!containerRef.current) return;
    const root: HTMLDivElement = containerRef.current;

    function track(target: EventTarget | null) {
      const container = containerRef.current;
      const row = rowFrom(target);
      if (!container || !row || !container.contains(row)) return false;

      rowRef.current = row;
      setBox(measure(container, row));
      setVisible(true);
      return true;
    }

    // The box is kept so the highlight fades out where it was, not at the origin.
    function clear() {
      rowRef.current = null;
      setVisible(false);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!track(event.target)) clear();
    }

    function handleFocusIn(event: FocusEvent) {
      track(event.target);
    }

    function handleFocusOut(event: FocusEvent) {
      if (!root.contains(event.relatedTarget as Node | null)) clear();
    }

    root.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("pointerleave", clear);
    root.addEventListener("focusin", handleFocusIn);
    root.addEventListener("focusout", handleFocusOut);

    // Expanding a group or resizing the sidebar moves the tracked row without
    // a pointer event of its own.
    const observer = new ResizeObserver(() => {
      const row = rowRef.current;
      if (!row || !root.contains(row)) return;
      setBox(measure(root, row));
    });
    observer.observe(root);

    return () => {
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", clear);
      root.removeEventListener("focusin", handleFocusIn);
      root.removeEventListener("focusout", handleFocusOut);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {box && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-0 bg-sidebar-accent",
            "transition-[translate,width,height,opacity] duration-200 ease-out",
            "motion-reduce:transition-none",
            visible ? "opacity-100" : "opacity-0",
          )}
          style={{
            translate: `${box.left}px ${box.top}px`,
            width: box.width,
            height: box.height,
            borderRadius: box.radius,
          }}
        />
      )}
      {children}
    </div>
  );
}
