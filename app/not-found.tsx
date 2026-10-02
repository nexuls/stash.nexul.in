/**
 * Root site-wide not-found page.
 */

import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-6 shadow-xs">
        <FileQuestion className="size-7" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        404
      </span>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        The page you are looking for doesn't exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/stash" />}>
          <ArrowLeft className="size-4 mr-2" />
          <span>Go to Documentation</span>
        </Button>

        <Button variant="outline" render={<Link href="/" />}>
          <span>Return Home</span>
        </Button>
      </div>
    </div>
  );
}
