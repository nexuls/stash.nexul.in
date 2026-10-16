/**
 * Filesystem content loader and query API.
 *
 * Traverses the `content/` hierarchy to load entries, derive slugs, categories, permalinks,
 * and provide lookup helpers (`getAllEntries`, `getEntryBySlug`, `getAllCategories`).
 *
 * Directory names may open with an order prefix (`01 - hooks`). The prefix is
 * sorting information: it never reaches a slug, a route or a title.
 *
 * Notable: Strictly validated via Zod (`contentEntrySchema` and `contentCategorySchema`).
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { discoverAdjacentAssets } from "./assets";
import {
  compareOrder,
  parseOrderedSegment,
  stripOrderPrefix,
} from "./ordering";
import { parseDocument } from "./parser";
import {
  type ContentCategory,
  type ContentEntry,
  contentCategorySchema,
  contentEntrySchema,
} from "./types";

/**
 * Directory name that marks a category's index page.
 *
 * `content/react/home/README.mdx` is the entry point for the React category and
 * is served at `/stash/react`, not at `/stash/react/home`. It is an ordinary
 * entry in every other respect, so it carries frontmatter, assets and MDX like
 * any note.
 */
export const CATEGORY_INDEX_DIR = "home";

/**
 * Returns the default absolute path to the content directory.
 */
export function getContentDirectory(): string {
  return join(process.cwd(), "content");
}

/**
 * Recursively discovers all entry directories containing a README.mdx file.
 */
export function findEntryDirectories(baseDir: string): string[] {
  const entryDirs: string[] = [];

  if (!existsSync(baseDir)) {
    return entryDirs;
  }

  function traverse(dir: string) {
    let items: string[];
    try {
      items = readdirSync(dir);
    } catch {
      return;
    }

    let hasReadme = false;
    for (const item of items) {
      if (item.toLowerCase() === "readme.mdx") {
        hasReadme = true;
        break;
      }
    }

    if (hasReadme) {
      entryDirs.push(dir);
    }

    for (const item of items) {
      if (item.startsWith(".")) {
        continue;
      }
      const fullPath = join(dir, item);
      try {
        if (statSync(fullPath).isDirectory()) {
          traverse(fullPath);
        }
      } catch {
        // Ignore unreadable paths
      }
    }
  }

  traverse(baseDir);
  return entryDirs;
}

/**
 * Resolves slug segments to the directory that holds them.
 *
 * Directory names may carry an order prefix the slug does not, so segments are
 * matched against stripped names. Returns null when a segment names nothing.
 */
export function resolveEntryDirectory(
  segments: string[],
  contentDir: string = getContentDirectory(),
): string | null {
  let current = contentDir;

  for (const segment of segments) {
    let names: string[];
    try {
      names = readdirSync(current).sort();
    } catch {
      return null;
    }

    const match = names.find((name) => {
      if (name.startsWith(".") || stripOrderPrefix(name) !== segment) {
        return false;
      }
      try {
        return statSync(join(current, name)).isDirectory();
      } catch {
        return false;
      }
    });

    if (!match) return null;
    current = join(/*turbopackIgnore: true*/ current, match);
  }

  return current;
}

/**
 * Loads and constructs a ContentEntry from an entry directory path.
 */
export function loadEntry(
  entryDirectory: string,
  contentDir: string = getContentDirectory(),
): ContentEntry | null {
  let readmeFilename: string | undefined;

  try {
    const items = readdirSync(entryDirectory);
    readmeFilename = items.find((item) => item.toLowerCase() === "readme.mdx");
  } catch {
    return null;
  }

  if (!readmeFilename) {
    return null;
  }

  const absoluteFilePath = join(entryDirectory, readmeFilename);
  const rawContent = readFileSync(absoluteFilePath, "utf-8");

  const relativeDir = relative(contentDir, entryDirectory).replace(/\\/g, "/");
  const rawSlugSegments = relativeDir ? relativeDir.split("/") : [];
  // A directory may be numbered to fix its place among its siblings. The number
  // orders it and nothing else, so the slug is built from the names alone.
  const parsedSegments = rawSlugSegments.map(parseOrderedSegment);
  const slugSegments = parsedSegments.map((segment) => segment.name);
  const slug = slugSegments.join("/");

  // A `home` directory stands for the category that contains it, so it answers
  // at the category's path. Its slug still names the directory on disk, which
  // is what adjacent assets are served under.
  const isCategoryIndex =
    slugSegments.length > 1 &&
    slugSegments[slugSegments.length - 1] === CATEGORY_INDEX_DIR;
  const routeSegments = isCategoryIndex
    ? slugSegments.slice(0, -1)
    : slugSegments;
  const permalink = `/stash/${routeSegments.join("/")}`;
  const filePath = relative(process.cwd(), absoluteFilePath).replace(
    /\\/g,
    "/",
  );

  const parsed = parseDocument(rawContent, slug);
  const assets = discoverAdjacentAssets(entryDirectory);

  // A category index belongs to the category it opens; every other entry
  // belongs to the directories above it, and a root-level note to none.
  const categories = isCategoryIndex
    ? routeSegments
    : slugSegments.length > 1
      ? slugSegments.slice(0, -1)
      : [];
  const categoryOrders = parsedSegments
    .slice(0, -1)
    .map((segment) => segment.order);
  const primaryCategory =
    parsed.frontmatter.category || (categories[0] ?? "general");

  const rawTags = parsed.frontmatter.tags;
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
        .map(String)
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // The directory's own number places the entry among its siblings; an entry
  // that is not numbered on disk can still say so in frontmatter.
  const directoryOrder =
    parsedSegments[parsedSegments.length - 1]?.order ?? null;
  const frontmatterOrder =
    typeof parsed.frontmatter.order === "number"
      ? parsed.frontmatter.order
      : null;

  const rawEntry = {
    slug,
    slugSegments,
    rawSlugSegments,
    order: directoryOrder ?? frontmatterOrder,
    permalink,
    isCategoryIndex,
    directoryPath: relativeDir,
    filePath,
    absoluteDirectoryPath: entryDirectory,
    absoluteFilePath,
    title: parsed.title,
    description: parsed.description,
    frontmatter: parsed.frontmatter,
    body: parsed.body,
    rawContent,
    categories,
    categoryOrders,
    category: primaryCategory,
    tags,
    headings: parsed.headings,
    links: parsed.links,
    assets,
    date: parsed.frontmatter.date ? String(parsed.frontmatter.date) : undefined,
    updated: parsed.frontmatter.updated
      ? String(parsed.frontmatter.updated)
      : undefined,
    draft: Boolean(parsed.frontmatter.draft),
    readingTime: parsed.readingTime,
  };

  // Strictly validate entry through Zod schema
  return contentEntrySchema.parse(rawEntry);
}

export interface EntryFilterOptions {
  includeDrafts?: boolean;
  /**
   * Include the `home` entries that open each category. They are excluded by
   * default: they are the heading of a category, not a note in it, so counting
   * or listing them beside real notes would misreport the archive.
   */
  includeCategoryIndexes?: boolean;
  contentDir?: string;
}

/**
 * Retrieves all discovered content entries.
 * Sorted deterministically by date (newest first) or title.
 */
export async function getAllEntries(
  options: EntryFilterOptions = {},
): Promise<ContentEntry[]> {
  const contentDir = options.contentDir || getContentDirectory();
  const entryDirs = findEntryDirectories(contentDir);

  const entries: ContentEntry[] = [];

  for (const dir of entryDirs) {
    const entry = loadEntry(dir, contentDir);
    if (entry) {
      if (!options.includeDrafts && entry.draft) {
        continue;
      }
      if (!options.includeCategoryIndexes && entry.isCategoryIndex) {
        continue;
      }
      entries.push(entry);
    }
  }

  return entries.sort(compareEntriesByContentOrder);
}

/**
 * Orders entries the way the content directory reads: numbered directories
 * first in their numbered order, the rest alphabetically after them, level by
 * level down the path.
 *
 * Every surface that lists entries — the sidebar, the archive index, previous
 * and next links — derives its order from this one, so the archive cannot
 * disagree with itself about what follows what.
 */
export function compareEntriesByContentOrder(
  a: ContentEntry,
  b: ContentEntry,
): number {
  const depth = Math.max(a.slugSegments.length, b.slugSegments.length);

  for (let index = 0; index < depth; index++) {
    const left = a.slugSegments[index];
    const right = b.slugSegments[index];

    // A shorter path is a parent of the longer one and comes first.
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (left === right) continue;

    const byOrder = compareOrder(
      segmentOrder(a, index),
      segmentOrder(b, index),
    );
    if (byOrder !== 0) return byOrder;

    // Unnumbered siblings read alphabetically: directories by their name, and
    // notes by their title, which is the name a reader actually sees.
    return segmentKey(a, index).localeCompare(segmentKey(b, index));
  }

  return 0;
}

/** Whether the path segment at `index` is a directory above the entry. */
function isCategorySegment(entry: ContentEntry, index: number): boolean {
  return index < entry.categoryOrders.length;
}

/** The order of an entry's path segment: a category's, or the entry's own. */
function segmentOrder(entry: ContentEntry, index: number): number | null {
  return isCategorySegment(entry, index)
    ? entry.categoryOrders[index]
    : entry.order;
}

/** The text an unnumbered path segment sorts by. */
function segmentKey(entry: ContentEntry, index: number): string {
  return isCategorySegment(entry, index)
    ? entry.slugSegments[index]
    : entry.title;
}

/**
 * Retrieves an entry by slug string or slug path segments.
 */
export async function getEntryBySlug(
  slug: string | string[],
  options: EntryFilterOptions = {},
): Promise<ContentEntry | null> {
  const normalizedSlug = Array.isArray(slug) ? slug.join("/") : slug;
  const contentDir = options.contentDir || getContentDirectory();
  const segments = normalizedSlug.split("/").filter(Boolean);

  // A slug names directories by their names, not by the numbers in front of
  // them, so each segment is matched against the stripped directory names.
  const targetDir = resolveEntryDirectory(segments, contentDir);
  const indexDir = resolveEntryDirectory(
    [...segments, CATEGORY_INDEX_DIR],
    contentDir,
  );

  // `/stash/react` is answered by `content/react/home`, so a path that is a
  // category rather than an entry falls through to its index.
  const entry =
    (targetDir ? loadEntry(targetDir, contentDir) : null) ??
    (indexDir ? loadEntry(indexDir, contentDir) : null);

  if (!entry) {
    return null;
  }

  if (!options.includeDrafts && entry.draft) {
    return null;
  }

  return entry;
}

/**
 * Returns the index entries that open each category, keyed by category path
 * (e.g. `react`). A category without a `home` directory has no entry page.
 */
export async function getCategoryIndexes(
  options: EntryFilterOptions = {},
): Promise<Map<string, ContentEntry>> {
  const contentDir = options.contentDir || getContentDirectory();
  const indexes = new Map<string, ContentEntry>();

  for (const dir of findEntryDirectories(contentDir)) {
    const entry = loadEntry(dir, contentDir);
    if (!entry?.isCategoryIndex) continue;
    if (!options.includeDrafts && entry.draft) continue;
    indexes.set(entry.categories.join("/"), entry);
  }

  return indexes;
}

/**
 * Groups discovered entries by their hierarchical category path.
 */
export async function getAllCategories(
  options: EntryFilterOptions = {},
): Promise<ContentCategory[]> {
  const entries = await getAllEntries(options);
  const categoryMap = new Map<string, ContentEntry[]>();

  for (const entry of entries) {
    if (entry.categories.length === 0) {
      const existing = categoryMap.get("general") || [];
      existing.push(entry);
      categoryMap.set("general", existing);
      continue;
    }

    // Accumulate each category level in hierarchy
    let currentPath = "";
    for (const segment of entry.categories) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const existing = categoryMap.get(currentPath) || [];
      existing.push(entry);
      categoryMap.set(currentPath, existing);
    }
  }

  const result: ContentCategory[] = [];
  const sortKeys = new Map<string, string>();

  for (const [slug, categoryEntries] of categoryMap.entries()) {
    const path = slug.split("/");
    const name = path[path.length - 1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // The directory's number is recorded by the entries inside it, so any of
    // them can report the category's place among its siblings.
    const orders = categoryEntries[0]?.categoryOrders ?? [];
    const order = orders[path.length - 1] ?? null;
    sortKeys.set(slug, categorySortKey(path, orders));

    // Strictly validate category object through Zod schema
    const category = contentCategorySchema.parse({
      name,
      slug,
      path,
      order,
      count: categoryEntries.length,
      entries: categoryEntries,
    });

    result.push(category);
  }

  return result.sort((a, b) =>
    (sortKeys.get(a.slug) ?? a.slug).localeCompare(
      sortKeys.get(b.slug) ?? b.slug,
    ),
  );
}

/**
 * Sort key placing a category path in content order.
 *
 * Each level contributes its number, zero padded so 2 sorts before 10, or a
 * marker that sorts after every number when the directory has none.
 */
function categorySortKey(path: string[], orders: (number | null)[]): string {
  return path
    .map((segment, index) => {
      const order = orders[index] ?? null;
      const prefix = order === null ? "~" : String(order).padStart(6, "0");
      return `${prefix}${segment}`;
    })
    .join("/");
}

/**
 * Returns all slug segments for Next.js generateStaticParams.
 */
export async function getAllSlugs(
  options: EntryFilterOptions = {},
): Promise<string[][]> {
  // Route segments, not directory segments: a category index answers at its
  // category's path, so that is the path which has to be generated.
  const entries = await getAllEntries({
    ...options,
    includeCategoryIndexes: true,
  });

  return entries.map((entry) =>
    entry.permalink.replace(/^\/stash\//, "").split("/"),
  );
}

/**
 * Returns all unique tags across entries.
 */
export async function getAllTags(
  options: EntryFilterOptions = {},
): Promise<string[]> {
  const entries = await getAllEntries(options);
  const tagSet = new Set<string>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Retrieves the previous and next entries relative to a specific slug.
 */
export async function getPrevNextEntries(
  slug: string | string[],
  options: EntryFilterOptions = {},
): Promise<{ prev: ContentEntry | null; next: ContentEntry | null }> {
  const normalizedSlug = Array.isArray(slug) ? slug.join("/") : slug;
  const entries = await getAllEntries(options);

  const currentIndex = entries.findIndex((e) => e.slug === normalizedSlug);
  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const prev = currentIndex > 0 ? entries[currentIndex - 1] : null;
  const next =
    currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;

  return { prev, next };
}

/**
 * Finds related entries based on category and overlapping tags.
 */
export async function getRelatedEntries(
  currentEntry: ContentEntry,
  limit = 3,
  options: EntryFilterOptions = {},
): Promise<ContentEntry[]> {
  const entries = await getAllEntries(options);
  const candidates = entries.filter((e) => e.slug !== currentEntry.slug);

  const scored = candidates.map((entry) => {
    let score = 0;
    if (entry.category === currentEntry.category) {
      score += 2;
    }
    for (const cat of currentEntry.categories) {
      if (entry.categories.includes(cat)) {
        score += 1;
      }
    }
    for (const tag of currentEntry.tags) {
      if (entry.tags.includes(tag)) {
        score += 2;
      }
    }
    return { entry, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);
}
