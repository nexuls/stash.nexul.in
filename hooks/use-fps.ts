"use client";

/**
 * Frame-rate sampling for live component previews.
 *
 * Counts animation frames over a fixed window rather than measuring a single
 * frame, so the readout is steady enough to watch while dragging a preview
 * wider. The loop only runs while `enabled` is true, which callers tie to the
 * preview being both on screen and the visible tab, so an idle page is not
 * paying for a measurement nobody is looking at.
 */

import * as React from "react";

/** Milliseconds of frames averaged into one reported value. */
const SAMPLE_WINDOW_MS = 500;

/**
 * A gap longer than this means the tab was backgrounded: requestAnimationFrame
 * stops firing there, so the window spans real time that was never rendered
 * and would be reported as a few frames per second.
 */
const STALE_GAP_MS = 2000;

export function useFps(enabled: boolean): number | null {
  const [fps, setFps] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      setFps(null);
      return;
    }

    let frames = 0;
    let windowStart = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      frames += 1;

      const elapsed = now - windowStart;
      if (elapsed < SAMPLE_WINDOW_MS) return;

      if (elapsed <= STALE_GAP_MS) {
        setFps(Math.round((frames * 1000) / elapsed));
      }
      frames = 0;
      windowStart = now;
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [enabled]);

  return fps;
}
