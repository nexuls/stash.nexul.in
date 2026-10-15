"use client";

/**
 * The living background behind the opening of the landing page.
 *
 * A handful of invisible sources drift along slow elliptical paths; the canvas
 * draws the contour lines of the field they add up to, the way a survey map
 * draws elevation. Nothing represents data here — it is the one piece of the
 * page allowed to be atmosphere — but contours belong to the same world as the
 * material the archive collects, and they move slowly enough to read as weather
 * rather than animation.
 *
 * Notable: Client Component, and the only script the landing page needs. It
 * draws at 30fps, stops entirely while off-screen or on a hidden tab, and
 * renders a single still frame when the reader prefers reduced motion.
 */

import { useEffect, useRef } from "react";

/** Spacing of the sampling grid, in CSS pixels. Larger reads softer and costs less. */
const CELL = 18;

/**
 * How many contours to draw, and where the lowest and highest sit within the
 * range the field actually covers this frame. Fixed heights would leave the
 * canvas nearly empty, because four overlapping sources rarely use their whole
 * nominal range; measuring instead keeps the texture even as the field moves.
 */
const LEVEL_COUNT = 13;
const LEVEL_FLOOR = 0.06;
const LEVEL_CEILING = 0.97;

/** The field moves slowly enough that 30fps is indistinguishable from 60. */
const FRAME_MS = 1000 / 30;

/** Upper bound on backing-store scale; past 2 there is nothing left to resolve. */
const MAX_DPR = 2;

/**
 * The drifting sources the field is made of. Each travels an ellipse at its own
 * rate, so the sum never repeats within any time anyone will sit and watch.
 */
const SOURCES = [
  {
    ax: 0.3,
    ay: 0.22,
    sx: 0.055,
    sy: 0.038,
    phase: 0.0,
    radius: 0.5,
    weight: 1,
  },
  {
    ax: 0.26,
    ay: 0.3,
    sx: -0.041,
    sy: 0.063,
    phase: 1.9,
    radius: 0.42,
    weight: 0.85,
  },
  {
    ax: 0.34,
    ay: 0.18,
    sx: 0.071,
    sy: -0.047,
    phase: 3.6,
    radius: 0.46,
    weight: 0.7,
  },
  {
    ax: 0.2,
    ay: 0.28,
    sx: -0.059,
    sy: -0.034,
    phase: 5.1,
    radius: 0.38,
    weight: 0.6,
  },
] as const;

export function AmbientField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let field = new Float32Array(0);
    let stroke = "currentColor";
    let frame = 0;
    let lastDraw = 0;
    let onScreen = true;

    /** The foreground colour, re-read whenever the theme changes under us. */
    function readStroke() {
      if (canvas) stroke = getComputedStyle(canvas).color;
    }

    function resize() {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / CELL) + 1;
      rows = Math.ceil(height / CELL) + 1;
      field = new Float32Array(cols * rows);
    }

    /**
     * Samples the summed field onto the grid for the moment `time`, and reports
     * the range it covers so the contours can be spaced across it.
     */
    function sample(time: number): { min: number; max: number } {
      const span = Math.max(width, height);
      field.fill(0);

      for (const source of SOURCES) {
        const cx =
          width * (0.5 + source.ax * Math.sin(time * source.sx + source.phase));
        const cy =
          height *
          (0.5 + source.ay * Math.cos(time * source.sy + source.phase * 1.3));
        const falloff = (source.radius * span) ** 2;

        for (let row = 0; row < rows; row += 1) {
          const dy = row * CELL - cy;
          const dy2 = dy * dy;
          const offset = row * cols;

          for (let col = 0; col < cols; col += 1) {
            const dx = col * CELL - cx;
            field[offset + col] +=
              source.weight / (1 + (dx * dx + dy2) / falloff);
          }
        }
      }

      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < field.length; i += 1) {
        const value = field[i];
        if (value < min) min = value;
        if (value > max) max = value;
      }

      return { min, max };
    }

    /** Traces one contour of the sampled field with marching squares. */
    function traceLevel(level: number) {
      if (!context) return;
      context.beginPath();

      for (let row = 0; row < rows - 1; row += 1) {
        for (let col = 0; col < cols - 1; col += 1) {
          const topLeft = field[row * cols + col];
          const topRight = field[row * cols + col + 1];
          const bottomRight = field[(row + 1) * cols + col + 1];
          const bottomLeft = field[(row + 1) * cols + col];

          const code =
            (topLeft > level ? 8 : 0) |
            (topRight > level ? 4 : 0) |
            (bottomRight > level ? 2 : 0) |
            (bottomLeft > level ? 1 : 0);

          if (code === 0 || code === 15) continue;

          const x0 = col * CELL;
          const y0 = row * CELL;
          const x1 = x0 + CELL;
          const y1 = y0 + CELL;

          // Where the level crosses each edge of this cell.
          const top = x0 + (CELL * (level - topLeft)) / (topRight - topLeft);
          const right =
            y0 + (CELL * (level - topRight)) / (bottomRight - topRight);
          const bottom =
            x0 + (CELL * (level - bottomLeft)) / (bottomRight - bottomLeft);
          const left = y0 + (CELL * (level - topLeft)) / (bottomLeft - topLeft);

          switch (code) {
            case 1:
            case 14:
              context.moveTo(x0, left);
              context.lineTo(bottom, y1);
              break;
            case 2:
            case 13:
              context.moveTo(bottom, y1);
              context.lineTo(x1, right);
              break;
            case 3:
            case 12:
              context.moveTo(x0, left);
              context.lineTo(x1, right);
              break;
            case 4:
            case 11:
              context.moveTo(top, y0);
              context.lineTo(x1, right);
              break;
            case 6:
            case 9:
              context.moveTo(top, y0);
              context.lineTo(bottom, y1);
              break;
            case 7:
            case 8:
              context.moveTo(x0, left);
              context.lineTo(top, y0);
              break;
            // Saddles: the level passes through the cell twice.
            case 5:
              context.moveTo(top, y0);
              context.lineTo(x1, right);
              context.moveTo(x0, left);
              context.lineTo(bottom, y1);
              break;
            case 10:
              context.moveTo(x0, left);
              context.lineTo(top, y0);
              context.moveTo(bottom, y1);
              context.lineTo(x1, right);
              break;
          }
        }
      }

      context.stroke();
    }

    function draw(time: number) {
      if (!context || cols === 0) return;

      const { min, max } = sample(time);
      const range = max - min;
      if (range <= 0) return;

      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;
      context.strokeStyle = stroke;

      for (let i = 0; i < LEVEL_COUNT; i += 1) {
        const position = i / (LEVEL_COUNT - 1);
        // Inner contours sit slightly stronger, so the field reads as depth.
        context.globalAlpha = 0.04 + position * 0.06;
        traceLevel(
          min +
            range * (LEVEL_FLOOR + position * (LEVEL_CEILING - LEVEL_FLOOR)),
        );
      }

      context.globalAlpha = 1;
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      if (!onScreen || document.hidden) return;
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      draw(now / 1000);
    }

    readStroke();
    resize();

    if (reduceMotion) {
      draw(0);
    } else {
      frame = requestAnimationFrame(loop);
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(reduceMotion ? 0 : performance.now() / 1000);
    });
    resizeObserver.observe(canvas);

    // Stop drawing once the opening has scrolled away.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
      },
      { rootMargin: "100px" },
    );
    visibility.observe(canvas);

    // next-themes swaps a class on <html>; the stroke colour follows it.
    const theme = new MutationObserver(() => {
      readStroke();
      draw(reduceMotion ? 0 : performance.now() / 1000);
    });
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      theme.disconnect();
    };
  }, []);

  // The wrapper carries the hiding and the placement, so the canvas itself is
  // only ever a surface. The field is atmosphere: it must never sit between a
  // reader and a link.
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ pointerEvents: "none" }}
    >
      <canvas ref={canvasRef} className="size-full text-foreground" />
    </div>
  );
}
