/**
 * An ordinary source file sitting beside an entry document.
 *
 * It exists so the adjacent-files note has a real file to link to and to quote
 * from, rather than describing one.
 */

export interface RenderTarget {
  id: string;
  label: string;
  /** Milliseconds the last compile of this target took. */
  durationMs: number;
  status: "idle" | "compiling" | "rendered";
}

export function describeTarget(target: RenderTarget): string {
  return `[${target.status.toUpperCase()}] ${target.label}: ${target.durationMs}ms`;
}
