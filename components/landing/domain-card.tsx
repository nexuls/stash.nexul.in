import {
  ArrowRight,
  Code2,
  Database,
  FileCode2,
  FolderOpen,
  Server,
  Sparkles,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ContentCategory, ContentEntry } from "@/lib/content/types";

interface DomainCardProps {
  category: ContentCategory;
  entries: ContentEntry[];
}

export function getDomainIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("react")) return Code2;
  if (normalized.includes("typescript") || normalized.includes("type"))
    return FileCode2;
  if (normalized.includes("showcase") || normalized.includes("demo"))
    return Sparkles;
  if (normalized.includes("linux") || normalized.includes("bash"))
    return Terminal;
  if (normalized.includes("backend") || normalized.includes("api"))
    return Server;
  if (normalized.includes("db") || normalized.includes("database"))
    return Database;
  return FolderOpen;
}

export function DomainCard({ category, entries }: DomainCardProps) {
  const Icon = getDomainIcon(category.name);
  const domainEntries = entries.filter((e) =>
    e.categories.includes(category.name.toLowerCase()),
  );
  const firstEntry = domainEntries[0];

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-sm">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="size-4" />
            </div>
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
              {category.name}
            </h3>
          </div>
          <Badge variant="secondary" className="font-mono text-[11px]">
            {domainEntries.length}{" "}
            {domainEntries.length === 1 ? "note" : "notes"}
          </Badge>
        </div>

        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {domainEntries.slice(0, 3).map((entry) => (
            <li key={entry.slug} className="truncate">
              <Link
                href={entry.permalink}
                className="transition-colors hover:text-foreground"
              >
                • {entry.title}
              </Link>
            </li>
          ))}
          {domainEntries.length > 3 && (
            <li className="text-[11px] italic text-muted-foreground/70">
              +{domainEntries.length - 3} more
            </li>
          )}
        </ul>
      </div>

      {firstEntry && (
        <div className="mt-4 border-t border-border/40 pt-3">
          <Link
            href={firstEntry.permalink}
            className="inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            <span>Explore domain</span>
            <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
