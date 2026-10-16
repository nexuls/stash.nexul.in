/**
 * Pagination and related content navigation component for documentation entries.
 *
 * Implements previous/next navigation cards, restrained "See also" recommendations,
 * and entry metadata footer with GitHub source links.
 */

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ContentEntry } from "@/lib/content/types";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

interface DocsPagerProps {
  currentEntry: ContentEntry;
  prev: ContentEntry | null;
  next: ContentEntry | null;
  related?: ContentEntry[];
  className?: string;
}

export function DocsPager({
  currentEntry,
  prev,
  next,
  related = [],
  className,
}: DocsPagerProps) {
  const formattedDate = currentEntry.updated || currentEntry.date;
  const githubSourceUrl = `${siteConfig.links.github}/blob/main/${currentEntry.filePath}`;

  return (
    <div className={cn("mt-12 space-y-10", className)}>
      {/* Related entries */}
      {related.length > 0 && (
        <section aria-labelledby="see-also-heading" className="space-y-4">
          <Separator />
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <h3
              id="see-also-heading"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Related entries
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={item.permalink}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {item.category}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {item.readingTime.minutes} min
                    </span>
                  </div>
                  <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Linear Previous / Next Entry Navigation */}
      {(prev || next) && (
        <nav
          aria-label="Previous and next documentation pages"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={prev.permalink}
              className="group flex flex-col items-start rounded-xl border border-border/70 p-4 transition-all hover:border-foreground/40 hover:bg-muted/30"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors mb-1">
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Previous</span>
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:underline line-clamp-1">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          {next ? (
            <Link
              href={next.permalink}
              className="group flex flex-col items-end text-right rounded-xl border border-border/70 p-4 transition-all hover:border-foreground/40 hover:bg-muted/30"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors mb-1">
                <span>Next</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:underline line-clamp-1">
                {next.title}
              </span>
            </Link>
          ) : null}
        </nav>
      )}

      {/* Document Footer: Timestamps, Author, and Source link */}
      <footer className="flex flex-col gap-3 pt-6 border-t border-border/60 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>Last updated: {formattedDate}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>
              {currentEntry.readingTime.minutes} min read (
              {currentEntry.readingTime.words} words)
            </span>
          </div>
        </div>

        <div>
          <a
            href={githubSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            <span>Edit or view this page on GitHub</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
