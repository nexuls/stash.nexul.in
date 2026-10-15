"use client";

/**
 * Copies a permalink to the heading it sits in.
 *
 * Replaces the plain fragment anchor the headings used to carry: a reader who
 * wants to point someone at a section wants the URL on their clipboard, which
 * an anchor only offers through the context menu.
 *
 * Sizing is in `em`, so the control scales with the heading level it belongs to
 * instead of being the same chrome next to an h2 and an h6. It keeps a fixed
 * footprint and swaps only the icon, so confirming a copy does not reflow the
 * heading text beside it.
 */

import { Check, Link2, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

/** How long the confirmed state stays visible. */
const COPIED_FEEDBACK_MS = 2000;

type CopyStatus = "idle" | "copied" | "failed";

const LABELS: Record<CopyStatus, string> = {
  idle: "Copy link to this section",
  copied: "Link copied",
  failed: "Could not copy link",
};

interface HeadingLinkButtonProps {
  /** The heading's `id`, used as the fragment of the copied URL. */
  id: string;
  className?: string;
}

export function HeadingLinkButton({ id, className }: HeadingLinkButtonProps) {
  const [status, setStatus] = React.useState<CopyStatus>("idle");
  const timeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  const handleCopy = async () => {
    // Resolved at click time: the origin is not known while prerendering, and
    // the query string is not part of an entry's identity.
    const url = `${window.location.origin}${window.location.pathname}#${id}`;

    const copied = await copyText(url);

    setStatus(copied ? "copied" : "failed");
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setStatus("idle"), COPIED_FEEDBACK_MS);
  };

  const label = LABELS[status];
  const Icon = status === "copied" ? Check : status === "failed" ? X : Link2;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={handleCopy}
      aria-label={label}
      title={label}
      // Keeps the reveal-on-hover rule in components/mdx/styles/headings.css
      // from hiding the feedback as soon as the pointer leaves.
      data-copied={status === "idle" ? undefined : true}
      className={cn(
        "stash-anchor size-[2.5em] rounded-md text-muted-foreground",
        status === "copied" && "text-tip hover:text-tip",
        status === "failed" && "text-danger hover:text-danger",
        className,
      )}
    >
      {/* An explicit size opts out of the size variant's icon sizing, which is
          in rem and would not track the heading. */}
      <Icon className="size-[1.25em]" aria-hidden />
      <span aria-live="polite" className="sr-only">
        {status === "idle" ? "" : label}
      </span>
    </Button>
  );
}
