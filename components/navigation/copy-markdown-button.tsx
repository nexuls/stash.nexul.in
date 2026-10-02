"use client";

/**
 * Copy Markdown button component.
 *
 * Copies the raw markdown source of the current documentation entry to clipboard.
 */

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyMarkdownButtonProps {
  content: string;
  className?: string;
}

export function CopyMarkdownButton({
  content,
  className,
}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn("h-7 px-2.5 text-xs text-muted-foreground", className)}
    >
      {copied ? (
        <>
          <Check className="size-3.5 mr-1.5 text-green-500" />
          <span>Copied Markdown</span>
        </>
      ) : (
        <>
          <Copy className="size-3.5 mr-1.5" />
          <span>Copy Markdown</span>
        </>
      )}
    </Button>
  );
}
