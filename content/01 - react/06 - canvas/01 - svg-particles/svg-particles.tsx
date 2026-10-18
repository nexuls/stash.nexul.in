"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /** SVG path string(s) (d attribute) to render as particles. Can be a single path or an array of paths. */
  svgPath: string | string[];
  /** Original viewBox width of the SVG path */
  viewBoxWidth?: number;
  /** Original viewBox height of the SVG path */
  viewBoxHeight?: number;
  /** Height of the logo in pixels (desktop) */
  logoHeight?: number;
  /** Height of the logo in pixels (mobile) */
  mobileLogoHeight?: number;
  /** Color of particles when scattered by mouse interaction */
  scatteredColor?: string;
  /** Base color of particles */
  particleColor?: string;
  /** Background color of the canvas */
  backgroundColor?: string;
  /** Whether to fill or stroke the SVG path */
  pathStyle?: "fill" | "stroke";
  /** Stroke width when using stroke style (in viewBox units) */
  strokeWidth?: number;
  /** Line join style for stroke corners */
  lineJoin?: CanvasLineJoin;
  /** Line cap style for stroke endpoints */
  lineCap?: CanvasLineCap;
  /** Force multiplier for particle scattering */
  forceMu?: number;
  /** Interaction mode: "scatter" pushes particles while mouse is near, "spill" gives particles velocity that decays over time */
  interactionMode?: "scatter" | "spill";
  /** How quickly particles return to their base position (0-1, lower = slower) */
  returnSpeed?: number;
  /** Friction applied to particle velocity in spill mode (0-1, lower = more friction) */
  friction?: number;
  /** Whether to enable particle death */
  enableParticleDeath?: boolean;
};

export default function SVGParticles({
  svgPath,
  viewBoxWidth = 100,
  viewBoxHeight = 100,
  logoHeight: desktopLogoHeight = 120,
  mobileLogoHeight = 60,
  scatteredColor = "#00DCFF",
  particleColor = "white",
  backgroundColor = "black",
  pathStyle = "fill",
  strokeWidth = 1,
  lineJoin = "miter",
  lineCap = "butt",
  forceMu = 1,
  interactionMode = "scatter",
  returnSpeed = 0.1,
  friction = 0.95,
  enableParticleDeath = true,
  className,
  ...props
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isTouchingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setIsMobile(rect.width < 768);
    };

    updateCanvasSize();

    let particles: {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      life: number;
      vx: number;
      vy: number;
    }[] = [];

    let textImageData: ImageData | null = null;

    function createTextImage() {
      if (!ctx || !canvas) return;

      ctx.fillStyle = particleColor;
      ctx.save();

      const logoHeight = isMobile ? mobileLogoHeight : desktopLogoHeight;
      const scale = logoHeight / viewBoxHeight;
      const logoWidth = viewBoxWidth * scale;

      ctx.translate(
        canvas.width / 2 - logoWidth / 2,
        canvas.height / 2 - logoHeight / 2,
      );

      ctx.scale(scale, scale);

      // Support both single path and array of paths
      const paths = Array.isArray(svgPath) ? svgPath : [svgPath];
      for (const pathStr of paths) {
        const path = new Path2D(pathStr);
        if (pathStyle === "stroke") {
          ctx.strokeStyle = particleColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineJoin = lineJoin;
          ctx.lineCap = lineCap;
          ctx.stroke(path);
        } else {
          ctx.fill(path);
        }
      }

      ctx.restore();

      // Guard against zero-size canvas (can happen during unmount)
      if (canvas.width === 0 || canvas.height === 0) {
        return;
      }

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null;

      const data = textImageData.data;

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1 + 0.5,
            life: Math.random() * 100 + 50,
            vx: 0,
            vy: 0,
          };
        }
      }

      return null;
    }

    function createInitialParticles() {
      if (!ctx || !canvas) return;

      const baseParticleCount = 7000;
      const particleCount = Math.floor(
        baseParticleCount *
          Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      );
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle();
        if (particle) particles.push(particle);
      }
    }

    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { x: mouseX, y: mouseY } = mousePositionRef.current;
      const maxDistance = 240;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const isInteracting =
          distance < maxDistance &&
          (isTouchingRef.current || !("ontouchstart" in window));

        if (interactionMode === "spill") {
          // Spill mode: add velocity when mouse is near, particles drift and return slowly
          if (isInteracting) {
            const force = (forceMu * (maxDistance - distance)) / maxDistance;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force * 2;
            p.vy -= Math.sin(angle) * force * 2;
          }

          // Apply velocity
          p.x += p.vx;
          p.y += p.vy;

          // Apply friction to slow down
          p.vx *= friction;
          p.vy *= friction;

          // Slowly return to base position
          const returnDx = p.baseX - p.x;
          const returnDy = p.baseY - p.y;
          p.vx += returnDx * returnSpeed * 0.1;
          p.vy += returnDy * returnSpeed * 0.1;

          // Color based on distance from base position
          const distFromBase = Math.sqrt(
            returnDx * returnDx + returnDy * returnDy,
          );
          if (distFromBase > 2) {
            ctx.fillStyle = scatteredColor;
          } else {
            ctx.fillStyle = particleColor;
          }
        } else {
          // Scatter mode: particles move away while mouse is near, snap back when it leaves
          if (isInteracting) {
            const force = (forceMu * (maxDistance - distance)) / maxDistance;
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * force * 60;
            const moveY = Math.sin(angle) * force * 60;
            p.x = p.baseX - moveX;
            p.y = p.baseY - moveY;

            ctx.fillStyle = scatteredColor;
          } else {
            p.x += (p.baseX - p.x) * returnSpeed;
            p.y += (p.baseY - p.y) * returnSpeed;
            ctx.fillStyle = particleColor;
          }
        }

        ctx.fillRect(p.x, p.y, p.size, p.size);

        if (enableParticleDeath) p.life--;
        if (p.life <= 0) {
          const newParticle = createParticle();
          if (newParticle) {
            particles[i] = newParticle;
          } else {
            particles.splice(i, 1);
            i--;
          }
        }
      }

      const baseParticleCount = 7000;
      const targetParticleCount = Math.floor(
        baseParticleCount *
          Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      );
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle();
        if (newParticle) particles.push(newParticle);
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    createTextImage();
    createInitialParticles();
    animate();

    const handleResize = () => {
      updateCanvasSize();
      createTextImage();
      particles = [];
      createInitialParticles();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const handleMove = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      mousePositionRef.current = { x: x - rect.left, y: y - rect.top };
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = () => {
      isTouchingRef.current = true;
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      mousePositionRef.current = { x: 0, y: 0 };
    };

    const handleMouseLeave = () => {
      if (!("ontouchstart" in window)) {
        mousePositionRef.current = { x: 0, y: 0 };
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    svgPath,
    isMobile,
    viewBoxWidth,
    viewBoxHeight,
    desktopLogoHeight,
    mobileLogoHeight,
    scatteredColor,
    particleColor,
    backgroundColor,
    pathStyle,
    strokeWidth,
    lineJoin,
    lineCap,
    forceMu,
    interactionMode,
    returnSpeed,
    friction,
    enableParticleDeath,
  ]);

  return (
    <div ref={containerRef} className={cn("relative", className)} {...props}>
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0 touch-none"
        aria-label="Interactive particle effect"
      />
    </div>
  );
}
