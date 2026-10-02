"use client";

/**
 * Interactive copy-to-clipboard button for code blocks.
 *
 * Copies either an explicitly provided code string or reads textContent
 * from the neighboring `<pre><code>` element within the enclosing code figure.
 * Provides accessible feedback and visual state transition.
 */

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  code?: string;
}

export function CopyButton({ code, className, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const handleCopy = React.useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      let textToCopy = code;

      // If no explicit code string is provided, traverse DOM to find neighboring code block
      if (!textToCopy) {
        const button = event.currentTarget;
        const container =
          button.closest("[data-rehype-pretty-code-figure]") ||
          button.closest(".stash-code-block");
        const pre = container?.querySelector("pre");
        const codeElement = pre?.querySelector("code") || pre;
        if (codeElement) {
          textToCopy = codeElement.textContent || "";
        }
      }

      if (!textToCopy) return;

      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textarea = document.createElement("textarea");
          textarea.value = textToCopy;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code to clipboard:", err);
      }
    },
    [code],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={
        hasCopied ? "Code copied to clipboard" : "Copy code to clipboard"
      }
      title={hasCopied ? "Copied!" : "Copy code"}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border border-border/60 bg-background/80 p-1 text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        hasCopied && "border-primary/50 text-primary hover:text-primary",
        className,
      )}
      {...props}
    >
      {hasCopied ? (
        <Check className="size-3.5 animate-in fade-in zoom-in-75 duration-150" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
