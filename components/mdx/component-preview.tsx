/**
 * Shows a component running beside the source it was built from.
 *
 * An entry is a directory, so a demo is written where the implementation
 * already lives: `preview.tsx` beside `README.mdx`, exporting one component
 * per example. The author names the export and the files worth reading:
 *
 * ```mdx
 * <ComponentPreview demo="Justified" files="masonry-row-grid.tsx" fps />
 * ```
 *
 * Nothing about that is registered anywhere. `remarkPreviewSource` fills the
 * tag with the named files at compile time, and `PreviewFrame` resolves the
 * demo from the entry directory in the browser. The division of labour is the
 * usual one in this pipeline: whatever the compiler can know, the compiler
 * does, and the client component is left with the reader's choices.
 */

import { PreviewFrame } from "@/components/mdx/preview-frame";
import {
  type ComponentPreviewProps,
  componentPreviewPropsSchema,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

/**
 * A compile-time problem the author can fix, rendered where the preview would
 * have been so it cannot be missed.
 */
function PreviewDiagnostic({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="my-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
    >
      <p className="font-mono text-xs font-medium text-destructive">
        {message}
      </p>
    </div>
  );
}

export function ComponentPreview({
  demo,
  directory,
  title,
  resizable,
  fps,
  height,
  defaultTab,
  files,
  error,
  className,
  children,
}: ComponentPreviewProps) {
  const validation = componentPreviewPropsSchema.safeParse({
    demo,
    directory,
    title,
    resizable,
    fps,
    height,
    defaultTab,
    files,
    error,
    className,
  });

  if (!validation.success) {
    return (
      <PreviewDiagnostic
        message={`Malformed ComponentPreview: ${validation.error.issues[0]?.message}`}
      />
    );
  }

  const props = validation.data;

  if (props.error) {
    return <PreviewDiagnostic message={props.error} />;
  }

  if (!props.directory) {
    return (
      <PreviewDiagnostic message="<ComponentPreview> was compiled without an entry directory, so there is nothing to preview." />
    );
  }

  return (
    <PreviewFrame
      directory={props.directory}
      demo={props.demo}
      title={props.title}
      resizable={props.resizable}
      fps={props.fps}
      height={props.height}
      defaultTab={props.defaultTab}
      // One label per code panel, in the order the pipeline appended them.
      files={props.files ? props.files.split(",").filter(Boolean) : []}
      className={cn(className)}
    >
      {children}
    </PreviewFrame>
  );
}
