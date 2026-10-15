/**
 * The dashed rules that frame the landing page's content column.
 *
 * Two guides run the full height of the page at the edges of the measure,
 * continuing past every section rather than stopping at one, so the layout
 * reads as something set out against a scale instead of a stack of boxes. The
 * hero's field is drawn wider than the guides on purpose: the archive spills
 * past its own frame.
 *
 * Notable: Server Component, purely decorative, and hidden from assistive
 * technology. Narrow screens leave the guides out, where they would sit on the
 * viewport edge and read as a border rather than a measurement.
 */
export function PageGuides() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden justify-center sm:flex"
    >
      <div className="h-full w-full max-w-5xl border-x border-dashed border-border" />
    </div>
  );
}
