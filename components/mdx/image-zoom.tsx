"use client";

/**
 * Zoom for standalone figures.
 *
 * Clicking a figure lifts it out of the document and into a full-screen
 * overlay. The overlay image is laid out at its final geometry and then
 * animated from the thumbnail's rectangle back to that geometry, so the
 * picture appears to grow out of the page rather than fade in over it.
 *
 * Only figures are zoomable; an image inside a sentence stays inline.
 */

import { XIcon } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Breathing room kept between the zoomed figure and the viewport edges. */
const VIEWPORT_PADDING = 32;
const DURATION = 260;
const EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

type ImageZoomProps = React.ComponentPropsWithoutRef<"img"> &
  Record<string, unknown>;

/** The rectangle the figure occupies once zoomed: centred, aspect preserved. */
function zoomedRect(thumbnail: DOMRect) {
  const availableWidth = window.innerWidth - VIEWPORT_PADDING * 2;
  const availableHeight = window.innerHeight - VIEWPORT_PADDING * 2;
  const scale = Math.min(
    availableWidth / thumbnail.width,
    availableHeight / thumbnail.height,
  );
  const width = thumbnail.width * scale;
  const height = thumbnail.height * scale;

  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
    width,
    height,
  };
}

/** The transform that puts an element at `from` while it is laid out at `to`. */
function invertedTransform(from: DOMRect, to: ReturnType<typeof zoomedRect>) {
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${
    from.width / to.width
  })`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ImageZoom({ className, alt, ...props }: ImageZoomProps) {
  const [zoomed, setZoomed] = React.useState(false);
  const thumbnailRef = React.useRef<HTMLButtonElement>(null);
  // Geometry comes from the image, not the button: the button spans the column
  // so an SVG without intrinsic dimensions has a width to resolve against.
  const thumbnailImageRef = React.useRef<HTMLImageElement>(null);
  const zoomedRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const backdropRef = React.useRef<HTMLButtonElement>(null);
  const closingRef = React.useRef(false);

  const close = React.useCallback(() => {
    const thumbnail = thumbnailImageRef.current;
    const element = zoomedRef.current;
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;

    const finish = () => {
      closingRef.current = false;
      setZoomed(false);
      thumbnailRef.current?.focus({ preventScroll: true });
    };

    if (!thumbnail || !element || prefersReducedMotion()) {
      finish();
      return;
    }

    // The chrome fades while the figure settles back into the document.
    for (const chrome of [backdropRef.current, closeRef.current]) {
      chrome?.animate(
        { opacity: [1, 0] },
        { duration: DURATION, easing: EASING, fill: "forwards" },
      );
    }

    const from = thumbnail.getBoundingClientRect();
    const to = zoomedRect(from);
    // The animation holds its last frame: without `forwards` the image snaps
    // back to full size for a frame before React unmounts the overlay.
    element.animate(
      { transform: ["none", invertedTransform(from, to)] },
      { duration: DURATION, easing: EASING, fill: "forwards" },
    ).onfinish = finish;
  }, []);

  // Grow the overlay image out of the thumbnail's rectangle.
  React.useEffect(() => {
    if (!zoomed) {
      return;
    }

    const thumbnail = thumbnailImageRef.current;
    const element = zoomedRef.current;
    if (!thumbnail || !element) {
      return;
    }

    const from = thumbnail.getBoundingClientRect();
    const to = zoomedRect(from);
    element.style.left = `${to.left}px`;
    element.style.top = `${to.top}px`;
    element.style.width = `${to.width}px`;
    element.style.height = `${to.height}px`;

    if (!prefersReducedMotion()) {
      element.animate(
        { transform: [invertedTransform(from, to), "none"] },
        { duration: DURATION, easing: EASING },
      );
    }

    closeRef.current?.focus({ preventScroll: true });
  }, [zoomed]);

  // Escape closes; the page underneath stays put while the overlay is up.
  React.useEffect(() => {
    if (!zoomed) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - body.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) {
      body.style.paddingRight = `${scrollbar}px`;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [zoomed, close]);

  const imageClassName = cn(
    "stash-figure-image block h-auto max-w-full rounded-lg border border-border",
    className,
  );

  return (
    <>
      <button
        ref={thumbnailRef}
        type="button"
        aria-label={alt ? `Zoom image: ${alt}` : "Zoom image"}
        onClick={() => setZoomed(true)}
        className={cn(
          "block w-full cursor-zoom-in rounded-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          zoomed && "invisible",
        )}
      >
        {/** biome-ignore lint/performance/noImgElement: no intrinsic size is known for entry assets */}
        <img
          ref={thumbnailImageRef}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          className={cn(imageClassName, "mx-auto")}
          {...props}
        />
      </button>

      {zoomed &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt ? `Zoomed image: ${alt}` : "Zoomed image"}
            className="fixed inset-0 z-50 animate-in fade-in-0 duration-150 motion-reduce:animate-none"
          >
            <button
              ref={backdropRef}
              type="button"
              aria-label="Close zoomed image"
              onClick={close}
              className="absolute inset-0 cursor-zoom-out bg-background/85 supports-backdrop-filter:backdrop-blur-sm"
            />

            <button
              ref={closeRef}
              type="button"
              aria-label="Close zoomed image"
              onClick={close}
              className="absolute right-3 top-3 z-10 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon className="size-5" aria-hidden />
            </button>

            <button
              ref={zoomedRef}
              type="button"
              aria-label="Close zoomed image"
              onClick={close}
              // Laid out by the open effect, which also runs the animation.
              className="fixed cursor-zoom-out origin-top-left rounded-lg focus-visible:outline-none"
            >
              {/** biome-ignore lint/performance/noImgElement: no intrinsic size is known for entry assets */}
              <img
                alt={alt ?? ""}
                decoding="async"
                className={cn(imageClassName, "h-full w-full max-w-none")}
                {...props}
              />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
