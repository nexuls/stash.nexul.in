"use client";

/**
 * Copies an entry's raw Markdown source.
 *
 * Sits in the entry's metadata row, so it is styled as a quiet inline control
 * rather than a button competing with the title.
 */

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

/** How long the confirmed state stays visible. */
const COPIED_FEEDBACK_MS = 2000;

interface CopyMarkdownButtonProps {
  content: string;
  className?: string;
}

export function CopyMarkdownButton({
  content,
  className,
}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  const handleCopy = async () => {
    try {
      await copyText(content);
      setCopied(true);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Copying can be denied by permissions policy; the source stays on disk.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 border rounded px-2 py-1.5 font-mono tracking-wide text-sm transition-colors",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        copied ? "text-tip" : "text-muted-foreground",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      <span>{copied ? "Copied Markdown" : "Copy Markdown"}</span>
    </button>
  );
}
