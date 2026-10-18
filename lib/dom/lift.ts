/**
 * The FLIP primitives shared by the two things in a document that lift out
 * of the page: a zoomed figure and a full-screen preview.
 *
 * Both are laid out at their final geometry first and then animated from the
 * rectangle they left behind, so they appear to grow out of the document
 * rather than fade in over it. Keeping the timing here is what makes the two
 * read as one gesture.
 */

/** Milliseconds a lift or a return takes. */
export const LIFT_DURATION = 260;

/** Decelerating curve: quick to leave the page, gentle on arrival. */
export const LIFT_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

/** The part of a `DOMRect` a lift needs, so a computed target also fits. */
export interface LiftRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The transform that puts an element at `from` while it is laid out at `to`. */
export function invertedTransform(from: LiftRect, to: LiftRect) {
  // Both axes are scaled. A figure is lifted into a rectangle of its own
  // aspect ratio, so the two factors agree there; a frame growing to fill
  // the viewport changes shape, and one factor would start it at the wrong
  // height.
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${
    from.width / to.width
  }, ${from.height / to.height})`;
}
