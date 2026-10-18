"use client";

/**
 * Demos for the SVG particle field, rendered by `<ComponentPreview>` in
 * README.mdx. The frame around them owns the viewport width and the
 * frame-rate readout, so nothing here measures itself.
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import SVGParticles from "./svg-particles";

/**
 * One shape the field can sample. Everything here is passed straight through
 * to the component: it never reads an SVG file, only the `d` attributes and
 * the viewBox they were authored against.
 */
interface Logo {
  name: string;
  path: string | string[];
  viewBoxWidth: number;
  viewBoxHeight: number;
  scatteredColor: string;
  particleColor?: string;
  pathStyle?: "fill" | "stroke";
  strokeWidth?: number;
  lineJoin?: CanvasLineJoin;
  lineCap?: CanvasLineCap;
}

/**
 * A filled single path, a filled path with holes, and a stroked pair of
 * subpaths: the three cases the sampler has to get right.
 */
const LOGOS: Logo[] = [
  {
    name: "React",
    path: "M418.2 177.2c-5.4-1.8-10.8-3.5-16.2-5.1.9-3.7 1.7-7.4 2.5-11.1 12.3-59.6 4.2-107.5-23.1-123.3-26.3-15.1-69.2.6-112.6 38.4-4.3 3.7-8.5 7.6-12.5 11.5-2.7-2.6-5.5-5.2-8.3-7.7-45.5-40.4-91.1-57.4-118.4-41.5-26.2 15.2-34 60.3-23 116.7 1.1 5.6 2.3 11.1 3.7 16.7-6.4 1.8-12.7 3.8-18.6 5.9C38.3 196.2 0 225.4 0 255.6c0 31.2 40.8 62.5 96.3 81.5 4.5 1.5 9 3 13.6 4.3-1.5 6-2.8 11.9-4 18-10.5 55.5-2.3 99.5 23.9 114.6 27 15.6 72.4-.4 116.6-39.1 3.5-3.1 7-6.3 10.5-9.7 4.4 4.3 9 8.4 13.6 12.4 42.8 36.8 85.1 51.7 111.2 36.6 27-15.6 35.8-62.9 24.4-120.5-.9-4.4-1.9-8.9-3-13.5 3.2-.9 6.3-1.9 9.4-2.9 57.7-19.1 99.5-50 99.5-81.7 0-30.3-39.4-59.7-93.8-78.4zM282.9 92.3c37.2-32.4 71.9-45.1 87.7-36 16.9 9.7 23.4 48.9 12.8 100.4-.7 3.4-1.4 6.7-2.3 10-22.2-5-44.7-8.6-67.3-10.6-13-18.6-27.2-36.4-42.6-53.1 3.9-3.7 7.7-7.2 11.7-10.7zM167.2 307.5c5.1 8.7 10.3 17.4 15.8 25.9-15.6-1.7-31.1-4.2-46.4-7.5 4.4-14.4 9.9-29.3 16.3-44.5 4.6 8.8 9.3 17.5 14.3 26.1zm-30.3-120.3c14.4-3.2 29.7-5.8 45.6-7.8-5.3 8.3-10.5 16.8-15.4 25.4-4.9 8.5-9.7 17.2-14.2 26-6.3-14.9-11.6-29.5-16-43.6zm27.4 68.9c6.6-13.8 13.8-27.3 21.4-40.6s15.8-26.2 24.4-38.9c15-1.1 30.3-1.7 45.9-1.7s31 .6 45.9 1.7c8.5 12.6 16.6 25.5 24.3 38.7s14.9 26.7 21.7 40.4c-6.7 13.8-13.9 27.4-21.6 40.8-7.6 13.3-15.7 26.2-24.2 39-14.9 1.1-30.4 1.6-46.1 1.6s-30.9-.5-45.6-1.4c-8.7-12.7-16.9-25.7-24.6-39s-14.8-26.8-21.5-40.6zm180.6 51.2c5.1-8.8 9.9-17.7 14.6-26.7 6.4 14.5 12 29.2 16.9 44.3-15.5 3.5-31.2 6.2-47 8 5.4-8.4 10.5-17 15.5-25.6zm14.4-76.5c-4.7-8.8-9.5-17.6-14.5-26.2-4.9-8.5-10-16.9-15.3-25.2 16.1 2 31.5 4.7 45.9 8-4.6 14.8-10 29.2-16.1 43.4zM256.2 118.3c10.5 11.4 20.4 23.4 29.6 35.8-19.8-.9-39.7-.9-59.5 0 9.8-12.9 19.9-24.9 29.9-35.8zM140.2 57c16.8-9.8 54.1 4.2 93.4 39 2.5 2.2 5 4.6 7.6 7-15.5 16.7-29.8 34.5-42.9 53.1-22.6 2-45 5.5-67.2 10.4-1.3-5.1-2.4-10.3-3.5-15.5-9.4-48.4-3.2-84.9 12.6-94zm-24.5 263.6c-4.2-1.2-8.3-2.5-12.4-3.9-21.3-6.7-45.5-17.3-63-31.2-10.1-7-16.9-17.8-18.8-29.9 0-18.3 31.6-41.7 77.2-57.6 5.7-2 11.5-3.8 17.3-5.5 6.8 21.7 15 43 24.5 63.6-9.6 20.9-17.9 42.5-24.8 64.5zm116.6 98c-16.5 15.1-35.6 27.1-56.4 35.3-11.1 5.3-23.9 5.8-35.3 1.3-15.9-9.2-22.5-44.5-13.5-92 1.1-5.6 2.3-11.2 3.7-16.7 22.4 4.8 45 8.1 67.9 9.8 13.2 18.7 27.7 36.6 43.2 53.4-3.2 3.1-6.4 6.1-9.6 8.9zm24.5-24.3c-10.2-11-20.4-23.2-30.3-36.3 9.6.4 19.5.6 29.5.6 10.3 0 20.4-.2 30.4-.7-9.2 12.7-19.1 24.8-29.6 36.4zm130.7 30c-.9 12.2-6.9 23.6-16.5 31.3-15.9 9.2-49.8-2.8-86.4-34.2-4.2-3.6-8.4-7.5-12.7-11.5 15.3-16.9 29.4-34.8 42.2-53.6 22.9-1.9 45.7-5.4 68.2-10.5 1 4.1 1.9 8.2 2.7 12.2 4.9 21.6 5.7 44.1 2.5 66.3zm18.2-107.5c-2.8.9-5.6 1.8-8.5 2.6-7-21.8-15.6-43.1-25.5-63.8 9.6-20.4 17.7-41.4 24.5-62.9 5.2 1.5 10.2 3.1 15 4.7 46.6 16 79.3 39.8 79.3 58 0 19.6-34.9 44.9-84.8 61.4zm-149.7-15c25.3 0 45.8-20.5 45.8-45.8s-20.5-45.8-45.8-45.8c-25.3 0-45.8 20.5-45.8 45.8s20.5 45.8 45.8 45.8z",
    viewBoxWidth: 512,
    viewBoxHeight: 512,
    scatteredColor: "#61DAFB",
  },
  {
    name: "Next.js",
    path: ["M9 15v-6l7.745 10.65a9 9 0 1 1 2.255 -1.993", "M15 12v-3"],
    viewBoxWidth: 24,
    viewBoxHeight: 24,
    scatteredColor: "#ffffff",
    particleColor: "#8a8a8a",
    pathStyle: "stroke",
    strokeWidth: 2,
    lineJoin: "round",
    lineCap: "round",
  },
  {
    name: "TypeScript",
    path: "M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z",
    viewBoxWidth: 24,
    viewBoxHeight: 24,
    scatteredColor: "#3178C6",
  },
  {
    name: "Tailwind CSS",
    path: "M12 6.036c-2.667 0-4.333 1.325-5 3.976 1-1.325 2.167-1.822 3.5-1.491.761.189 1.305.738 1.906 1.345C13.387 10.855 14.522 12 17 12c2.667 0 4.333-1.325 5-3.976-1 1.325-2.166 1.822-3.5 1.491-.761-.189-1.305-.738-1.907-1.345-.98-.99-2.114-2.134-4.593-2.134zM7 12c-2.667 0-4.333 1.325-5 3.976 1-1.326 2.167-1.822 3.5-1.491.761.189 1.305.738 1.907 1.345.98.989 2.115 2.134 4.594 2.134 2.667 0 4.333-1.325 5-3.976-1 1.325-2.167 1.822-3.5 1.491-.761-.189-1.305-.738-1.906-1.345C10.613 13.145 9.478 12 7 12z",
    viewBoxWidth: 24,
    viewBoxHeight: 24,
    scatteredColor: "#38BDF8",
  },
];

/** The canvas paints its own opaque background, so it is set once here. */
const BACKGROUND = "#09090b";

/** Base UI hands a slider either one value or a range; this field is single. */
function first(value: number | readonly number[]): number {
  return Array.isArray(value) ? value[0] : (value as number);
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium">{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(next) => onChange(first(next))}
      />
    </div>
  );
}

/**
 * The whole surface: a shape to sample, the two interaction models, and the
 * three numbers that change how the field feels. Move the cursor over the
 * canvas, or drag a finger across it on a touch screen.
 */
export function Preview() {
  const [logo, setLogo] = React.useState(LOGOS[0]);
  const [interactionMode, setInteractionMode] = React.useState<
    "scatter" | "spill"
  >("scatter");
  const [forceMu, setForceMu] = React.useState(2);
  const [returnSpeed, setReturnSpeed] = React.useState(0.1);
  const [friction, setFriction] = React.useState(0.95);
  const [enableParticleDeath, setEnableParticleDeath] = React.useState(true);

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm">
                {logo.name}
                <ChevronDown className="size-3.5" aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            {LOGOS.map((option) => (
              <DropdownMenuItem
                key={option.name}
                onClick={() => setLogo(option)}
              >
                {option.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          {(["scatter", "spill"] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={interactionMode === mode ? "default" : "outline"}
              aria-pressed={interactionMode === mode}
              onClick={() => setInteractionMode(mode)}
              className="capitalize"
            >
              {mode}
            </Button>
          ))}
        </div>

        <Label className="ml-auto flex items-center gap-2 text-xs">
          <Switch
            checked={enableParticleDeath}
            onCheckedChange={setEnableParticleDeath}
          />
          Particle death
        </Label>
      </div>

      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Field
          label="Force"
          value={forceMu}
          min={0.1}
          max={3}
          step={0.1}
          onChange={setForceMu}
        />
        <Field
          label="Return speed"
          value={returnSpeed}
          min={0.01}
          max={0.5}
          step={0.01}
          onChange={setReturnSpeed}
        />
        {interactionMode === "spill" && (
          <Field
            label="Friction"
            value={friction}
            min={0.8}
            max={0.99}
            step={0.01}
            onChange={setFriction}
          />
        )}
      </div>

      <div className="h-full flex-1 grid place-items-center">
        <SVGParticles
          // A new shape is a new field: remounting rebuilds it from scratch
          // rather than animating particles between two unrelated sets.
          key={logo.name}
          svgPath={logo.path}
          viewBoxWidth={logo.viewBoxWidth}
          viewBoxHeight={logo.viewBoxHeight}
          logoHeight={400}
          mobileLogoHeight={210}
          scatteredColor={logo.scatteredColor}
          particleColor={logo.particleColor ?? "white"}
          backgroundColor={BACKGROUND}
          pathStyle={logo.pathStyle}
          strokeWidth={logo.strokeWidth}
          lineJoin={logo.lineJoin}
          lineCap={logo.lineCap}
          interactionMode={interactionMode}
          forceMu={forceMu}
          returnSpeed={returnSpeed}
          friction={friction}
          enableParticleDeath={enableParticleDeath}
          className="h-full w-full overflow-hidden rounded-lg"
        />
      </div>
    </div>
  );
}

/**
 * A stroked, two-subpath shape on its own: the case where the sampler has
 * the least area to hit and the particle budget matters most.
 */
export function Stroke() {
  return (
    <SVGParticles
      svgPath={["M9 15v-6l7.745 10.65a9 9 0 1 1 2.255 -1.993", "M15 12v-3"]}
      viewBoxWidth={24}
      viewBoxHeight={24}
      logoHeight={220}
      mobileLogoHeight={120}
      pathStyle="stroke"
      strokeWidth={2}
      lineJoin="round"
      lineCap="round"
      scatteredColor="#ffffff"
      particleColor="#8a8a8a"
      backgroundColor={BACKGROUND}
      interactionMode="spill"
      enableParticleDeath={false}
      className="h-96 w-full"
    />
  );
}
