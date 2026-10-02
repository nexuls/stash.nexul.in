/**
 * Not-found error page for invalid documentation URLs in /stash.
 */

import { ArrowLeft, FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { Button } from "@/components/ui/button";

export default function StashNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-6 shadow-xs">
        <FileQuestion className="size-7" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        404 Not Found
      </span>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Documentation Entry Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        The documentation path or technical note you requested does not exist in
        the archive. It may have been moved, renamed, or deleted.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/stash" />}>
          <ArrowLeft className="size-4 mr-2" />
          <span>Browse Archive</span>
        </Button>

        <Button variant="outline" render={<Link href="/" />}>
          <Home className="size-4 mr-2" />
          <span>Home</span>
        </Button>

        <SearchTrigger variant="button">Search (⌘K)</SearchTrigger>
      </div>
    </div>
  );
}
