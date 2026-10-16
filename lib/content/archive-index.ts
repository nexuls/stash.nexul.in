/**
 * Derivation of the landing page's archive index.
 *
 * The landing page presents the archive the way it exists on disk: domains, the
 * directories inside them, and the notes those directories hold. This module
 * turns loaded entries into that shape and keeps only the fields the index
 * needs, so the filterable list ships as a few kilobytes of metadata instead of
 * whole MDX documents.
 */

import { formatSegmentLabel } from "@/lib/content/nav-tree";
import { compareOrder } from "@/lib/content/ordering";
import type { ContentEntry } from "@/lib/content/types";

export interface ArchiveNote {
  title: string;
  description: string;
  permalink: string;
  /** Date of the note's last edit as YYYY-MM-DD, or null when it records none. */
  date: string | null;
  /** Lowercase title, description, path and tags, matched by the index filter. */
  haystack: string;
}

export interface ArchiveGroup {
  /** Directory label, or null for notes sitting directly inside the domain. */
  label: string | null;
  /** Path from the content root, e.g. "react/hooks". */
  path: string;
  notes: ArchiveNote[];
}

export interface ArchiveDomain {
  label: string;
  slug: string;
  /** Path from the content root, e.g. "react". */
  path: string;
  /** Route of the category's own page. */
  href: string;
  /** Summary from the category's `home` entry, when it has one. */
  description: string | null;
  noteCount: number;
  groups: ArchiveGroup[];
}

export interface ArchiveIndex {
  domains: ArchiveDomain[];
  noteCount: number;
  /** Date of the most recently touched note, formatted; null when none carry one. */
  lastUpdated: string | null;
}

/** Notes with no category directory of their own are collected under this key. */
const ROOT_GROUP = "";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function toNote(entry: ContentEntry): ArchiveNote {
  const timestamp = entryTimestamp(entry);

  return {
    title: entry.title,
    description: entry.description,
    permalink: entry.permalink,
    date:
      timestamp === null
        ? null
        : new Date(timestamp).toISOString().slice(0, 10),
    haystack: [entry.title, entry.description, entry.slug, ...entry.tags]
      .join(" ")
      .toLowerCase(),
  };
}

/** Timestamp of the last edit an entry records, or null when it records none. */
function entryTimestamp(entry: ContentEntry): number | null {
  const raw = entry.updated ?? entry.date;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Groups entries into domains and their directories.
 *
 * `categoryIndexes` supplies each category's authored title and summary, keyed
 * by category path; a category without a `home` entry keeps the label derived
 * from its directory name and has no summary.
 *
 * A numbered directory keeps the place its number asks for. Beyond that,
 * domains are ordered by how much they hold, so the deepest part of the archive
 * leads, and directories and notes keep the order `getAllEntries` reports:
 * numbered first, then alphabetical.
 */
export function buildArchiveIndex(
  entries: ContentEntry[],
  categoryIndexes: Map<string, ContentEntry> = new Map(),
): ArchiveIndex {
  const domains = new Map<string, Map<string, ArchiveNote[]>>();
  // Order prefixes, recorded as the directories are first met.
  const domainOrders = new Map<string, number | null>();
  const groupOrders = new Map<string, number | null>();
  let lastTimestamp: number | null = null;

  for (const entry of entries) {
    const domainSlug = entry.categories[0] ?? entry.category;
    const groupSlug = entry.categories[1] ?? ROOT_GROUP;

    if (!domainOrders.has(domainSlug)) {
      domainOrders.set(domainSlug, entry.categoryOrders[0] ?? null);
    }
    const groupKey = `${domainSlug}/${groupSlug}`;
    if (!groupOrders.has(groupKey)) {
      groupOrders.set(groupKey, entry.categoryOrders[1] ?? null);
    }

    const groups = domains.get(domainSlug) ?? new Map<string, ArchiveNote[]>();
    const notes = groups.get(groupSlug) ?? [];
    notes.push(toNote(entry));
    groups.set(groupSlug, notes);
    domains.set(domainSlug, groups);

    const timestamp = entryTimestamp(entry);
    if (
      timestamp !== null &&
      (lastTimestamp === null || timestamp > lastTimestamp)
    ) {
      lastTimestamp = timestamp;
    }
  }

  // A category that authored a `home` page exists whether or not it holds a
  // note yet. Its page is served and linked, so leaving it out of the index
  // would hide it from the landing page until its first note landed.
  for (const [path, index] of categoryIndexes) {
    const [domainSlug, groupSlug] = path.split("/");
    if (!domainSlug) continue;

    const groups = domains.get(domainSlug) ?? new Map<string, ArchiveNote[]>();
    if (!domainOrders.has(domainSlug)) {
      domainOrders.set(domainSlug, index.categoryOrders[0] ?? null);
    }
    if (groupSlug) {
      const groupKey = `${domainSlug}/${groupSlug}`;
      if (!groupOrders.has(groupKey)) {
        groupOrders.set(groupKey, index.categoryOrders[1] ?? null);
      }
      if (!groups.has(groupSlug)) groups.set(groupSlug, []);
    }
    domains.set(domainSlug, groups);
  }

  const resolved: ArchiveDomain[] = [];

  for (const [domainSlug, groups] of domains) {
    const resolvedGroups: ArchiveGroup[] = [];

    for (const [groupSlug, notes] of groups) {
      // A seeded group with nothing in it yet would render as a heading over
      // an empty list, so it is left out of the listing; the category itself
      // is still reachable from the sidebar and from its own page.
      if (notes.length === 0) continue;

      resolvedGroups.push({
        label: groupSlug === ROOT_GROUP ? null : formatSegmentLabel(groupSlug),
        path:
          groupSlug === ROOT_GROUP ? domainSlug : `${domainSlug}/${groupSlug}`,
        // `entries` arrives in content order, so the notes are already in it.
        notes,
      });
    }

    resolvedGroups.sort((a, b) => {
      // Notes sitting directly in the domain open it, above its directories.
      if (a.label === null) return -1;
      if (b.label === null) return 1;
      return (
        compareOrder(
          groupOrders.get(a.path) ?? null,
          groupOrders.get(b.path) ?? null,
        ) || a.label.localeCompare(b.label)
      );
    });

    const index = categoryIndexes.get(domainSlug);

    resolved.push({
      // A category that has authored a `home` entry titles itself; the rest
      // fall back to the directory name.
      label: index?.title ?? formatSegmentLabel(domainSlug),
      slug: domainSlug,
      path: domainSlug,
      href: `/stash/${domainSlug}`,
      description: index?.description || null,
      noteCount: resolvedGroups.reduce((sum, g) => sum + g.notes.length, 0),
      groups: resolvedGroups,
    });
  }

  resolved.sort(
    (a, b) =>
      compareOrder(
        domainOrders.get(a.slug) ?? null,
        domainOrders.get(b.slug) ?? null,
      ) ||
      b.noteCount - a.noteCount ||
      a.label.localeCompare(b.label),
  );

  return {
    domains: resolved,
    noteCount: entries.length,
    lastUpdated:
      lastTimestamp === null ? null : dateFormat.format(lastTimestamp),
  };
}

/**
 * The index entry for one category path, at any depth.
 *
 * A domain answers with itself. A directory inside one answers with a domain
 * shaped around that directory alone, so a nested category's page lists the
 * notes it holds rather than the whole domain's. A path the index does not
 * know, such as a category that holds nothing yet, answers `undefined`.
 */
export function findCategory(
  domains: ArchiveDomain[],
  path: string,
): ArchiveDomain | undefined {
  const domain = domains.find((candidate) => candidate.path === path);
  if (domain) return domain;

  const [domainSlug] = path.split("/");
  const parent = domains.find((candidate) => candidate.path === domainSlug);
  if (!parent) return undefined;

  const groups = parent.groups.filter(
    (group) => group.path === path || group.path.startsWith(`${path}/`),
  );
  if (groups.length === 0) return undefined;

  return {
    ...parent,
    label: groups[0]?.label ?? parent.label,
    slug: path,
    path,
    href: `/stash/${path}`,
    description: null,
    noteCount: groups.reduce((sum, group) => sum + group.notes.length, 0),
    groups,
  };
}

/**
 * Narrows the index to the notes matching every term in `query`, dropping any
 * directory or domain left with nothing in it.
 *
 * Terms are matched independently so "hooks debounce" finds the same note as
 * "debounce hooks", and each domain's count is restated for what survived.
 */
export function filterArchive(
  domains: ArchiveDomain[],
  query: string,
): ArchiveDomain[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return domains;

  const narrowed: ArchiveDomain[] = [];

  for (const domain of domains) {
    const groups = domain.groups
      .map((group) => ({
        ...group,
        notes: group.notes.filter((note) =>
          terms.every((term) => note.haystack.includes(term)),
        ),
      }))
      .filter((group) => group.notes.length > 0);

    if (groups.length === 0) continue;

    narrowed.push({
      ...domain,
      groups,
      noteCount: groups.reduce((sum, group) => sum + group.notes.length, 0),
    });
  }

  return narrowed;
}
