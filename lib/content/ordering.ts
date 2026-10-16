/**
 * Order prefixes on content directory names.
 *
 * Content hierarchy comes from directory paths, so the order a reader meets
 * those directories in has to come from the paths too. A directory may open its
 * name with a number — `01 - hooks` — and that number is sorting information
 * only: it is stripped before the segment becomes a slug, a route or a label.
 * Directories without a number follow the numbered ones, alphabetically.
 */

/**
 * A number followed by whitespace, optionally with a hyphen, then the name.
 *
 * The whitespace is what makes the prefix a prefix: `2025-review` is a name,
 * not entry 2025, so a segment only counts as ordered when the number is
 * separated from the rest by a space.
 */
const ORDERED_SEGMENT = /^(\d+)(?:[ \t]+-?[ \t]*|-[ \t]+)(.+)$/;

export interface OrderedSegment {
  /** The directory name as it exists on disk, e.g. `01 - hooks`. */
  raw: string;
  /** The name with its order prefix removed, e.g. `hooks`. */
  name: string;
  /** The prefix's number, or null when the directory carries none. */
  order: number | null;
}

/** Splits a directory segment into its order prefix and its name. */
export function parseOrderedSegment(raw: string): OrderedSegment {
  const match = ORDERED_SEGMENT.exec(raw);
  if (!match) {
    return { raw, name: raw, order: null };
  }

  const order = Number.parseInt(match[1], 10);
  const name = match[2].trim();

  // A prefix with nothing after it names nothing, so the segment stands as-is.
  if (!name || Number.isNaN(order)) {
    return { raw, name: raw, order: null };
  }

  return { raw, name, order };
}

/** The directory segment without its order prefix. */
export function stripOrderPrefix(raw: string): string {
  return parseOrderedSegment(raw).name;
}

/** Strips the order prefix from every segment of a slash-separated path. */
export function stripOrderPrefixes(path: string): string {
  return path
    .split("/")
    .map((segment) => (segment ? stripOrderPrefix(segment) : segment))
    .join("/");
}

/**
 * Compares two order values: numbered first and ascending, unnumbered last.
 *
 * Returns 0 when neither carries a number or both carry the same one, leaving
 * the tie to the caller's own rule.
 */
export function compareOrder(a: number | null, b: number | null): number {
  if (a !== null && b !== null) return a - b;
  if (a !== null) return -1;
  if (b !== null) return 1;
  return 0;
}

/** Compares parsed segments by order, then alphabetically by name. */
export function compareOrderedSegments(
  a: Pick<OrderedSegment, "name" | "order">,
  b: Pick<OrderedSegment, "name" | "order">,
): number {
  return compareOrder(a.order, b.order) || a.name.localeCompare(b.name);
}
