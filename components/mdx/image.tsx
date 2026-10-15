/**
 * Images in MDX.
 *
 * A diagram that stands on its own line becomes a figure and can carry a
 * caption, taken from the Markdown title: `![alt](./diagram.svg "Caption")`.
 * An image inside a sentence stays inline. `remarkImageFigures` decides which
 * is which and marks the node, because only the compiler can see the context.
 */

import type * as React from "react";
import { cn } from "@/lib/utils";

type ImageProps = React.ComponentPropsWithoutRef<"img"> &
  Record<string, unknown>;

export function MdxImage({ className, alt, title, ...props }: ImageProps) {
  const isFigure = props["data-figure"] !== undefined;

  const image = (
    // Entry assets are served from `content/` at their natural size and have
    // no dimensions recorded, which next/image requires.
    // biome-ignore lint/performance/noImgElement: no intrinsic size is known for entry assets
    <img
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      className={cn(
        isFigure
          ? // Diagrams are drawn for a light surface, so a figure keeps one in
            // both themes rather than leaving dark-on-dark text unreadable.
            "stash-figure-image mx-auto block h-auto max-w-full rounded-lg border border-border"
          : "inline-block h-[1.25em] w-auto align-text-bottom",
        className,
      )}
      {...props}
    />
  );

  if (!isFigure) {
    return image;
  }

  return (
    <figure className="my-6">
      {image}
      {title && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {title}
        </figcaption>
      )}
    </figure>
  );
}
