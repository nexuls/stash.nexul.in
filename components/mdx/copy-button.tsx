"use client";

/**
 * Interactive copy-to-clipboard button for code blocks.
 *
 * Copies either an explicitly provided code string or reads textContent
 * from the neighboring `<pre><code>` element within the enclosing code figure.
 * Provides accessible feedback and visual state transition.
 */

import { Clipboard, ClipboardCheck } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

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
    <Button
      type="button"
      variant="ghost"
      onClick={handleCopy}
      aria-label={
        hasCopied ? "Code copied to clipboard" : "Copy code to clipboard"
      }
      title={hasCopied ? "Copied!" : "Copy code"}
      className={cn(
        "group/copy inline-flex h-7 items-center justify-center gap-1.5 rounded-md px-2 opacity-75 transition-all duration-200 hover:bg-muted/80 hover:opacity-100",
        hasCopied && "text-emerald-500 hover:text-emerald-500",
        className,
      )}
      {...props}
    >
      {hasCopied ? (
        <>
          <ClipboardCheck className="size-4 animate-in fade-in zoom-in-75 duration-150 transition-all duration-200" />
          <span className="text-xs font-medium animate-in fade-in slide-in-from-left-1 duration-200">
            Copied!
          </span>
        </>
      ) : (
        <Clipboard className="size-3.5 transition-all duration-200" />
      )}
    </Button>
  );
}
