/**
 * Finds the element a given node actually scrolls inside.
 *
 * Pages here scroll within a `ScrollArea` rather than the document, so anything
 * that reacts to scrolling has to read that container instead of `window`.
 *
 * A container that is not currently taller than its box is kept only as a
 * fallback: an ancestor can declare `overflow: auto` and have nothing to scroll
 * yet, and the real scroller is the first one with content overflowing it.
 */
export function getScrollParent(
  element: HTMLElement | null,
): HTMLElement | null {
  let current = element?.parentElement ?? null;
  let candidate: HTMLElement | null = null;

  while (current) {
    const { overflowY } = getComputedStyle(current);

    if (overflowY === "auto" || overflowY === "scroll") {
      if (current.scrollHeight > current.clientHeight) return current;
      candidate ??= current;
    }

    current = current.parentElement;
  }

  return candidate;
}
