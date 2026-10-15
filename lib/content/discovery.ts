/**
 * Filesystem content loader and query API.
 *
 * Traverses the `content/` hierarchy to load entries, derive slugs, categories, permalinks,
 * and provide lookup helpers (`getAllEntries`, `getEntryBySlug`, `getAllCategories`).
 *
 * Notable: Strictly validated via Zod (`contentEntrySchema` and `contentCategorySchema`).
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { discoverAdjacentAssets } from "./assets";
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
  const slug = relativeDir;
  const slugSegments = slug ? slug.split("/") : [];

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
  const primaryCategory =
    parsed.frontmatter.category || (categories[0] ?? "general");

  const rawTags = parsed.frontmatter.tags;
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
        .map(String)
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const rawEntry = {
    slug,
    slugSegments,
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

  // Sort by date (descending) if present, then alphabetical by title
  return entries.sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });
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
  const targetDir = join(
    /*turbopackIgnore: true*/ contentDir,
    ...normalizedSlug.split("/"),
  );

  // `/stash/react` is answered by `content/react/home`, so a path that is a
  // category rather than an entry falls through to its index.
  const entry =
    loadEntry(targetDir, contentDir) ??
    loadEntry(join(targetDir, CATEGORY_INDEX_DIR), contentDir);

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
 * (e.g. `react`). Categories without a `home` directory simply have no entry.
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
  for (const [slug, categoryEntries] of categoryMap.entries()) {
    const path = slug.split("/");
    const name = path[path.length - 1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Strictly validate category object through Zod schema
    const category = contentCategorySchema.parse({
      name,
      slug,
      path,
      count: categoryEntries.length,
      entries: categoryEntries,
    });

    result.push(category);
  }

  return result.sort((a, b) => a.slug.localeCompare(b.slug));
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
