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
  const permalink = `/stash/${slug}`;
  const filePath = relative(process.cwd(), absoluteFilePath).replace(
    /\\/g,
    "/",
  );

  const parsed = parseDocument(rawContent, slug);
  const assets = discoverAdjacentAssets(entryDirectory);

  const categories = slugSegments.length > 1 ? slugSegments.slice(0, -1) : [];
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
  const targetDir = join(contentDir, ...normalizedSlug.split("/"));

  const entry = loadEntry(targetDir, contentDir);
  if (!entry) {
    return null;
  }

  if (!options.includeDrafts && entry.draft) {
    return null;
  }

  return entry;
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
  const entries = await getAllEntries(options);
  return entries.map((entry) => entry.slugSegments);
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
