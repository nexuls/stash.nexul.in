import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ContentEntry } from "@/lib/content/types";

interface EntryRowProps {
  entry: ContentEntry;
}

export function EntryRow({ entry }: EntryRowProps) {
  const formattedDate = entry.updated || entry.date;

  return (
    <article className="flex flex-col justify-between gap-3 p-4 transition-colors duration-150 hover:bg-muted/30 sm:flex-row sm:items-center">
      <div className="min-w-0 space-y-1">
        <Link
          href={entry.permalink}
          className="line-clamp-1 font-semibold text-foreground transition-colors hover:text-primary"
        >
          {entry.title}
        </Link>
        {entry.description && (
          <p className="line-clamp-1 max-w-xl text-xs text-muted-foreground">
            {entry.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px] capitalize">
          {entry.category}
        </Badge>

        <span className="flex items-center gap-1 text-[11px]">
          <Clock className="size-3" />
          <span>{entry.readingTime.minutes}m</span>
        </span>

        {formattedDate && (
          <span className="hidden items-center gap-1 text-[11px] md:flex">
            <Calendar className="size-3" />
            <span>{formattedDate}</span>
          </span>
        )}
      </div>
    </article>
  );
}
