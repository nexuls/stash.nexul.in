/**
 * The Stash mark: three folders stacked back to front.
 *
 * Drawn from the site's own tokens rather than fixed brand hexes, so the mark
 * follows the theme: the front folder takes the surrounding text colour, the
 * two behind it step back through the primary teal.
 *
 * Notable: the gaps between folders are cut with masks rather than painted
 * with a background-coloured stroke, so the mark sits on any surface. The mask
 * ids are constant; several instances on one page define identical masks, so
 * the first definition winning changes nothing.
 */

const FRONT =
  "M0 39Q0 32 7 32L34.5 32Q38 32 40.22 34.71L44.78 40.29Q47 43 50.5 43L91 43Q100 43 100 52L100 94Q100 104 90 104L10 104Q0 104 0 94Z";
const MIDDLE =
  "M21 23Q21 16 28 16L55.5 16Q59 16 61.22 18.71L65.78 24.29Q68 27 71.5 27L112 27Q121 27 121 36L121 78Q121 88 111 88L31 88Q21 88 21 78Z";
const BACK =
  "M42 7Q42 0 49 0L76.5 0Q80 0 82.22 2.71L86.78 8.29Q89 11 92.5 11L133 11Q142 11 142 20L142 62Q142 72 132 72L52 72Q42 72 42 62Z";

/** Cuts the shapes in front of a folder out of it, leaving an even gap. */
function Gap({ id, paths }: { id: string; paths: string[] }) {
  return (
    <mask
      id={id}
      maskUnits="userSpaceOnUse"
      x={-10}
      y={-10}
      width={162}
      height={124}
    >
      <rect x={-10} y={-10} width={162} height={124} fill="#fff" />
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          fill="#000"
          stroke="#000"
          strokeWidth={7.2}
          strokeLinejoin="round"
        />
      ))}
    </mask>
  );
}

export function StashMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 154 116"
      role="img"
      aria-hidden="true"
    >
      <g transform="translate(6 6)">
        <defs>
          <Gap id="stash-mark-gap-middle" paths={[FRONT]} />
          <Gap id="stash-mark-gap-back" paths={[MIDDLE, FRONT]} />
        </defs>
        <path
          d={BACK}
          className="fill-primary/45"
          mask="url(#stash-mark-gap-back)"
        />
        <path
          d={MIDDLE}
          className="fill-primary"
          mask="url(#stash-mark-gap-middle)"
        />
        <path d={FRONT} className="fill-current" />
      </g>
    </svg>
  );
}
