"use client";

/**
 * The interactive shell around a live component demo.
 *
 * Two tabs over one frame: the component running, and the source it was built
 * from. The source arrives already highlighted from the compile pipeline (see
 * `remarkPreviewSource`), so this component only owns what a reader can
 * change — which tab is open, how wide the viewport is, and whether the frame
 * is reporting its frame rate.
 *
 * The demo itself is resolved from the entry directory at runtime. A preview
 * is a client module living beside the document it illustrates, so there is no
 * registry to keep in step with `content/`; the static prefix and suffix of
 * the import keep the resolution narrow enough for the bundler to enumerate.
 */

import {
  Activity,
  GripVertical,
  Maximize2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";
import { CodePanelFrameContext } from "@/components/mdx/code-panel";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFps } from "@/hooks/use-fps";
import { cn } from "@/lib/utils";

/** Width of the drag thumb. It overlays the frame rather than taking a
 *  column of its own, so a full-width preview still reaches the frame edge.
 *  `--stash-thumb` keeps the preview's scrollbar clear of it. */
const THUMB_WIDTH = 16;

/** Narrowest viewport the thumb can produce, below any phone worth testing. */
const MIN_VIEWPORT = 280;

/** Keyboard steps on the thumb, plain and with Shift held. */
const STEP = 16;
const COARSE_STEP = 64;

const PRESETS = [
  { label: "Phone", width: 390, icon: Smartphone },
  { label: "Tablet", width: 768, icon: Tablet },
  { label: "Desktop", width: 1280, icon: Monitor },
] as const;

export interface PreviewFrameProps {
  /** Entry directory relative to `content/`, order prefixes included. */
  directory: string;
  /** Export to render from that entry's `preview.tsx`. */
  demo: string;
  title?: string;
  resizable: boolean;
  fps: boolean;
  height: number;
  defaultTab: "preview" | "code";
  /** Names of the files the tag listed, in the order their panels arrive. */
  files: string[];
  className?: string;
  /** The highlighted code panels for the files the tag named. */
  children: React.ReactNode;
}

/**
 * Renders the message a reader can act on when `preview.tsx` has no such
 * export, in place of the blank frame React would otherwise show.
 */
function MissingDemo({ directory, demo }: { directory: string; demo: string }) {
  return (
    <p className="p-4 font-mono text-xs text-destructive">
      <code>{directory}/preview.tsx</code> does not export <code>{demo}</code>.
    </p>
  );
}

/**
 * Lazily loads one entry's preview module.
 *
 * Both ends of the specifier are static, so the bundler resolves this to the
 * set of `content/**{/}preview.tsx` modules and nothing else.
 */
function loadDemo(directory: string, demo: string) {
  return dynamic(
    () =>
      import(`@/content/${directory}/preview.tsx`).then((module) => ({
        default:
          (module[demo] as React.ComponentType | undefined) ??
          (() => <MissingDemo directory={directory} demo={demo} />),
      })),
    {
      loading: () => (
        <div aria-hidden className="h-full w-full animate-pulse bg-muted/40" />
      ),
    },
  );
}

function HeaderButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-foreground/8 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-code-header",
        "disabled:pointer-events-none disabled:opacity-40",
        active && "bg-foreground/10 text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PreviewFrame({
  directory,
  demo,
  title,
  resizable,
  fps,
  height,
  defaultTab,
  files,
  className,
  children,
}: PreviewFrameProps) {
  const baseId = React.useId();
  const [tab, setTab] = React.useState<"preview" | "code">(defaultTab);
  const [file, setFile] = React.useState(0);
  const [available, setAvailable] = React.useState<number | null>(null);
  const [width, setWidth] = React.useState<number | null>(null);
  const [onScreen, setOnScreen] = React.useState(false);

  const trackRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const tabListRef = React.useRef<HTMLDivElement>(null);

  // One panel per listed file, kept mounted so each one remembers its own
  // wrap setting and scroll position while the reader moves between them.
  const panels = React.Children.toArray(children);

  const Demo = React.useMemo(
    () => loadDemo(directory, demo),
    [directory, demo],
  );

  // Measuring beats guessing: the track is as wide as the document column,
  // which varies with the sidebar, the window and the reader's zoom.
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(([entry]) => {
      const next = Math.floor(entry.contentRect.width);
      setAvailable(next);
      // A window that narrowed below the chosen width has to win, or the
      // preview overflows the page it is sitting in.
      setWidth((current) =>
        current === null ? null : Math.min(current, next),
      );
    });

    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // The frame rate is only worth sampling while it is being watched.
  React.useEffect(() => {
    const frame = frameRef.current;
    if (!fps || !frame) return;

    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [fps]);

  const framesPerSecond = useFps(fps && onScreen && tab === "preview");

  const maximum = available ?? 0;
  const current = width === null ? maximum : width;

  const resize = React.useCallback(
    (next: number) => {
      if (available === null) return;
      setWidth(Math.max(MIN_VIEWPORT, Math.min(next, available)));
    },
    [available],
  );

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || available === null) return;

    const left = track.getBoundingClientRect().left;
    // Where inside the thumb the pointer landed, so the edge follows the
    // grip rather than jumping it under the cursor.
    const grab = event.clientX - left - current;
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (pointer: PointerEvent) =>
      resize(Math.round(pointer.clientX - left - grab));

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  const onThumbKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? COARSE_STEP : STEP;
    switch (event.key) {
      case "ArrowLeft":
        resize(current - step);
        break;
      case "ArrowRight":
        resize(current + step);
        break;
      case "Home":
        resize(MIN_VIEWPORT);
        break;
      case "End":
        setWidth(null);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = tab === "preview" ? "code" : "preview";
    setTab(next);
    tabListRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      ?.[next === "preview" ? 0 : 1]?.focus();
  };

  const onFileKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = panels.length - 1;
    let next = file;
    if (event.key === "ArrowLeft") next = file === 0 ? last : file - 1;
    else if (event.key === "ArrowRight") next = file === last ? 0 : file + 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    setFile(next);
    // The strip lives in the visible panel's own bar, so the tab to focus is
    // found by id rather than by position in a container.
    document.getElementById(`${baseId}-file-${next}`)?.focus();
  };

  const tabs = [
    { value: "preview", label: "Preview" },
    { value: "code", label: "Code" },
  ] as const;

  /* One bar, not two: the file tabs are handed to the code panel and take
     the place of the filename it would otherwise print. */
  const fileTabs = (
    <div
      role="tablist"
      aria-label={title ? `${title} files` : "Preview files"}
      className="flex min-w-0 items-center gap-1 overflow-x-auto"
    >
      {panels.map((_, index) => {
        const name = files[index] ?? `File ${index + 1}`;
        const selected = index === file;
        return (
          <button
            key={name}
            type="button"
            role="tab"
            id={`${baseId}-file-${index}`}
            aria-controls={`${baseId}-file-panel-${index}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => setFile(index)}
            onKeyDown={onFileKeyDown}
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 font-mono text-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-code-header",
              selected
                ? "bg-foreground/10 font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {name.split("/").pop()}
          </button>
        );
      })}
    </div>
  );

  return (
    <figure
      ref={frameRef}
      className={cn(
        "stash-preview my-6 overflow-hidden rounded-xl border border-code-rule bg-card",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-1 border-b border-code-rule bg-code-header px-2">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label={title ? `${title} preview` : "Component preview"}
          className="flex items-stretch gap-1"
        >
          {tabs.map((item) => {
            const selected = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                id={`${baseId}-tab-${item.value}`}
                aria-controls={`${baseId}-panel-${item.value}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(item.value)}
                onKeyDown={onTabKeyDown}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-code-header",
                  selected
                    ? "bg-foreground/10 font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {title && (
          <span className="ml-2 hidden truncate font-mono text-xs text-muted-foreground sm:inline">
            {title}
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {fps && tab === "preview" && (
            <span
              // Polite would queue a sentence for every sample; the number is
              // there to be watched, not announced.
              aria-live="off"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground tabular-nums bg-muted py-1 px-1 rounded-sm"
            >
              <Activity className="size-3.5 text-primary" aria-hidden />
              <span className="sr-only">Frames per second: </span>
              {framesPerSecond ?? "—"}
              <span aria-hidden> fps</span>
            </span>
          )}

          {resizable && tab === "preview" && (
            <>
              <div className="flex items-center rounded-sm bg-muted/50 pl-1.5">
                <span className="mr-1 hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:inline">
                  {available === null ? "—" : `${current}px`}
                </span>

                {/* The presets are one choice with three answers, so they read
                  as one control rather than three loose icons. */}
                <ButtonGroup
                  aria-label="Preview width presets"
                  className="[&>button]:rounded-sm"
                >
                  {PRESETS.map((preset) => {
                    const label = `${preset.label} width, ${preset.width}px`;
                    const active = width !== null && current === preset.width;
                    return (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={label}
                        title={label}
                        aria-pressed={active}
                        disabled={
                          available !== null && preset.width > available
                        }
                        onClick={() => resize(preset.width)}
                        className={cn(
                          "text-muted-foreground",
                          active && "bg-muted text-foreground",
                        )}
                      >
                        <preset.icon className="size-3.5" />
                      </Button>
                    );
                  })}
                </ButtonGroup>
              </div>
              <HeaderButton
                label="Full width"
                active={width === null}
                onClick={() => setWidth(null)}
              >
                <Maximize2 className="size-3.5" />
              </HeaderButton>
            </>
          )}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-preview`}
        aria-labelledby={`${baseId}-tab-preview`}
        hidden={tab !== "preview"}
      >
        <div
          ref={trackRef}
          className="stash-preview-track relative flex items-stretch overflow-hidden"
          style={
            {
              height,
              "--stash-thumb": `${THUMB_WIDTH}px`,
            } as React.CSSProperties
          }
        >
          <ScrollArea
            className={cn(
              "h-full min-w-0 shrink-0 bg-background",
              resizable && "stash-preview-pane-inset",
            )}
            style={{ width: width === null ? "100%" : width }}
          >
            <Demo />
          </ScrollArea>

          {resizable && available !== null && (
            /* biome-ignore lint/a11y/useSemanticElements: an <hr> cannot be
               focused or dragged; the separator role is the pattern for a
               splitter the reader moves. */
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Preview width"
              title="Drag to resize the preview"
              aria-valuemin={MIN_VIEWPORT}
              aria-valuemax={maximum}
              aria-valuenow={current}
              aria-valuetext={`${current} pixels`}
              tabIndex={0}
              onPointerDown={startDrag}
              onKeyDown={onThumbKeyDown}
              // Beside the frame while there is room for it, over the
              // frame's own edge once the preview fills the track.
              style={{
                insetInlineStart: Math.max(
                  0,
                  Math.min(current, maximum - THUMB_WIDTH),
                ),
              }}
              className={cn(
                "group/thumb absolute inset-y-0 z-10 flex w-4 cursor-col-resize touch-none items-center justify-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              )}
            >
              {/* A bare 1px rule reads as decoration; a grip with a border
                  and a background reads as something to take hold of. */}
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-10 w-3.5 items-center justify-center rounded-full",
                  "border border-code-rule bg-code-header text-muted-foreground shadow-sm",
                )}
              >
                <GripVertical className="size-3" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-code`}
        aria-labelledby={`${baseId}-tab-code`}
        hidden={tab !== "code"}
      >
        {/* The frame keeps its height across both tabs: the code scrolls
            inside it rather than pushing the document down. */}
        <div style={{ height }}>
          {panels.map((panel, index) => (
            <div
              key={files[index] ?? index}
              {...(panels.length > 1 && {
                role: "tabpanel",
                id: `${baseId}-file-panel-${index}`,
                "aria-labelledby": `${baseId}-file-${index}`,
                hidden: index !== file,
              })}
              className="h-full"
            >
              {/* Only the panel on screen carries the strip, so the tab ids
                  stay unique however many files the entry lists. */}
              <CodePanelFrameContext.Provider
                value={{
                  tabs: panels.length > 1 && index === file ? fileTabs : null,
                }}
              >
                {panel}
              </CodePanelFrameContext.Provider>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
