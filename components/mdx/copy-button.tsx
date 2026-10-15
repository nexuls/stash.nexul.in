"use client";

/**
 * Copy-to-clipboard control for code panels.
 *
 * Prefers an explicit `code` string; otherwise reads the neighbouring
 * `<pre><code>` text. Line numbers are generated content, so they are never
 * part of what gets copied either way.
 *
 * The button keeps a fixed footprint and swaps only the icon, so confirming a
 * copy does not nudge the rest of the header.
 */

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/** How long the confirmed state stays visible. */
const COPIED_FEEDBACK_MS = 2000;

export interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  code?: string;
}

export function CopyButton({ code, className, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  const handleCopy = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      let textToCopy = code;

      if (!textToCopy) {
        const container =
          event.currentTarget.closest(".stash-code") ??
          event.currentTarget.closest("[data-rehype-pretty-code-figure]");
        const codeElement =
          container?.querySelector("pre code") ??
          container?.querySelector("pre");
        textToCopy = codeElement?.textContent ?? "";
      }

      if (!textToCopy) return;

      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Clipboard API is unavailable outside secure contexts.
          const textarea = document.createElement("textarea");
          textarea.value = textToCopy;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        setHasCopied(true);
        clearTimeout(timeout.current);
        timeout.current = setTimeout(
          () => setHasCopied(false),
          COPIED_FEEDBACK_MS,
        );
      } catch {
        // Copying can be denied by permissions policy; the code stays selectable.
      }
    },
    [code],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={hasCopied ? "Copied" : "Copy code"}
      title={hasCopied ? "Copied" : "Copy code"}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-foreground/8 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--code-header)]",
        hasCopied && "text-tip hover:text-tip",
        className,
      )}
      {...props}
    >
      {hasCopied ? (
        <Check className="size-3.5 animate-in fade-in zoom-in-50 duration-150" />
      ) : (
        <Copy className="size-3.5" />
      )}
      <span aria-live="polite" className="sr-only">
        {hasCopied ? "Code copied to clipboard" : ""}
      </span>
    </button>
  );
}
