/**
 * The content tree as this tool needs to see it.
 *
 * `lib/content` answers what the site serves: entries, slugs, permalinks,
 * ordering. It does not describe the directories between them, because the site
 * never needs to — a category with no `home` page serves nothing. Managing
 * content does need them, so this module walks `content/` for the shape and
 * defers to `lib/content` for everything derived from a document.
 *
 * Nothing here re-implements the order-prefix convention: `parseOrderedSegment`
 * and friends come from `lib/content/ordering`, so a change to the convention
 * reaches this tool for free.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ContentEntry } from "../../lib/content";
import { CATEGORY_INDEX_DIR, loadEntry } from "../../lib/content";
import {
  compareOrder,
  parseOrderedSegment,
  stripOrderPrefix,
} from "../../lib/content/ordering";

/** The repository root, resolved from this file rather than the shell's cwd. */
export const REPO_ROOT = resolve(import.meta.dir, "../..");

/**
 * The archive being managed. `STASH_CONTENT_DIR` points it somewhere else,
 * which is how the tests drive the tool over a fixture instead of the real
 * `content/`.
 */
export const CONTENT_DIR = process.env.STASH_CONTENT_DIR
  ? resolve(process.env.STASH_CONTENT_DIR)
  : join(REPO_ROOT, "content");
export const ENTRY_FILE = "README.mdx";

/**
 * What a directory under `content/` is.
 *
 * - `note` holds a README.mdx and is served at its own route.
 * - `index` is the `home` directory that serves its category's route.
 * - `category` holds other directories and serves nothing by itself.
 */
export type NodeKind = "category" | "note" | "index";

export interface ContentNode {
  /** Directory name on disk, order prefix included (`01 - hooks`). */
  name: string;
  /** Path relative to `content/`, as it is on disk. */
  dirPath: string;
  absPath: string;
  kind: NodeKind;
  /** The order prefix's number, or null when the directory carries none. */
  order: number | null;
  /** Path with every order prefix stripped (`react/hooks`). */
  slug: string;
  /** The URL the build emits, or null for a category that serves nothing. */
  route: string | null;
  /** Parent's `dirPath`; empty string for a domain. */
  parentPath: string;
  depth: number;
  children: ContentNode[];
}

/** A node plus the entry `lib/content` loads for it. */
export interface LoadedNode extends ContentNode {
  entry: ContentEntry | null;
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function childDirectories(absPath: string): string[] {
  try {
    return readdirSync(absPath).filter(
      (name) => !name.startsWith(".") && isDirectory(join(absPath, name)),
    );
  } catch {
    return [];
  }
}

/**
 * Classifies a directory the way `loadEntry` does.
 *
 * `discovery.ts` decides a category index from the *stripped* last slug
 * segment, and only below the top level: `01 - home` inside a category is an
 * index, while `home` at the content root is an ordinary note served at
 * `/stash/home`. Matching that exactly is the point — a tool that disagreed
 * with the loader about which directory serves which route would be worse than
 * no tool.
 */
function kindOf(absPath: string, name: string, depth: number): NodeKind {
  if (!existsSync(join(absPath, ENTRY_FILE))) return "category";
  const isIndex = depth > 0 && stripOrderPrefix(name) === CATEGORY_INDEX_DIR;
  return isIndex ? "index" : "note";
}

/**
 * Sorts siblings the way the archive reads: numbered first and ascending, the
 * rest alphabetically after them.
 */
export function compareNodes(a: ContentNode, b: ContentNode): number {
  return (
    compareOrder(a.order, b.order) ||
    stripOrderPrefix(a.name).localeCompare(stripOrderPrefix(b.name))
  );
}

function buildNode(
  parentPath: string,
  name: string,
  depth: number,
): ContentNode {
  const dirPath = parentPath ? `${parentPath}/${name}` : name;
  const absPath = join(CONTENT_DIR, dirPath);
  const kind = kindOf(absPath, name, depth);
  const { order } = parseOrderedSegment(name);

  const slug = dirPath.split("/").map(stripOrderPrefix).join("/");
  const parentSlug = slug.split("/").slice(0, -1).join("/");

  // A `home` directory is its category's page, so it answers at the category's
  // own route and nothing is served at `…/home`.
  const route =
    kind === "index"
      ? `/stash/${parentSlug}`
      : kind === "note"
        ? `/stash/${slug}`
        : null;

  const node: ContentNode = {
    name,
    dirPath,
    absPath,
    kind,
    order,
    slug,
    route,
    parentPath,
    depth,
    children: [],
  };

  node.children = childDirectories(absPath)
    .map((child) => buildNode(dirPath, child, depth + 1))
    .sort(compareNodes);

  return node;
}

/** The archive as a forest of domains, in content order. */
export function loadTree(): ContentNode[] {
  if (!existsSync(CONTENT_DIR)) return [];
  return childDirectories(CONTENT_DIR)
    .map((name) => buildNode("", name, 0))
    .sort(compareNodes);
}

/** Every node under a root (or the whole archive), parents before children. */
export function flatten(nodes: ContentNode[]): ContentNode[] {
  const out: ContentNode[] = [];
  const walk = (list: ContentNode[]) => {
    for (const node of list) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

export function descendants(node: ContentNode): ContentNode[] {
  return flatten(node.children);
}

/** The documents under a node, which is what its routes are. */
export function documentsUnder(node: ContentNode): ContentNode[] {
  const self = node.kind === "category" ? [] : [node];
  return [...self, ...descendants(node).filter((n) => n.kind !== "category")];
}

export interface Archive {
  roots: ContentNode[];
  all: ContentNode[];
  byDirPath: Map<string, ContentNode>;
  bySlug: Map<string, ContentNode>;
  byRoute: Map<string, ContentNode>;
}

export function loadArchive(): Archive {
  const roots = loadTree();
  const all = flatten(roots);
  return {
    roots,
    all,
    byDirPath: new Map(all.map((node) => [node.dirPath, node])),
    bySlug: new Map(all.map((node) => [node.slug, node])),
    byRoute: new Map(
      all.filter((n) => n.route).map((node) => [node.route as string, node]),
    ),
  };
}

/**
 * Resolves whatever a reader is likely to type: a path on disk
 * (`01 - react/01 - hooks`), a slug (`react/hooks`), or a route
 * (`/stash/react/hooks`).
 */
export function resolveNode(
  archive: Archive,
  query: string,
): ContentNode | null {
  const cleaned = query
    .trim()
    .replace(/^\.\//, "")
    .replace(/^content\//, "")
    .replace(/^\/?stash\//, "")
    .replace(/^\/+|\/+$/g, "");

  if (!cleaned) return null;

  return (
    archive.byDirPath.get(cleaned) ??
    archive.bySlug.get(cleaned) ??
    archive.byRoute.get(`/stash/${cleaned}`) ??
    archive.byRoute.get(query.trim()) ??
    null
  );
}

/** The children of a node, or the domains when no node is given. */
export function childrenOf(
  archive: Archive,
  parent: ContentNode | null,
): ContentNode[] {
  return parent ? parent.children : archive.roots;
}

/**
 * The next free order number among a parent's children. A `home` directory is
 * not numbered — it is the category's heading, not one of its notes.
 */
export function nextOrder(
  archive: Archive,
  parent: ContentNode | null,
): number {
  const numbers = childrenOf(archive, parent)
    .filter((child) => child.kind !== "index")
    .map((child) => child.order)
    .filter((order): order is number => order !== null);

  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
}

/** The sibling already holding a slug segment, if any. */
export function findSlugConflict(
  archive: Archive,
  parent: ContentNode | null,
  name: string,
  ignore?: ContentNode,
): ContentNode | null {
  return (
    childrenOf(archive, parent).find(
      (child) => child !== ignore && stripOrderPrefix(child.name) === name,
    ) ?? null
  );
}

/** The on-disk directory name for an order number and a slug segment. */
export function formatDirectoryName(
  order: number | null,
  name: string,
): string {
  return order === null ? name : `${String(order).padStart(2, "0")} - ${name}`;
}

/** The entry `lib/content` loads for a document node. */
export function loadNodeEntry(node: ContentNode): ContentEntry | null {
  if (node.kind === "category") return null;
  return loadEntry(node.absPath, CONTENT_DIR);
}

/**
 * The title a document carries, read from the file rather than through the MDX
 * pipeline: pickers show hundreds of these and a full parse per row is wasted
 * work. `loadNodeEntry` is the authority when the whole entry is wanted.
 */
export function quickTitle(node: ContentNode): string {
  if (node.kind === "category") return stripOrderPrefix(node.name);

  let raw = "";
  try {
    raw = readFileSync(join(node.absPath, ENTRY_FILE), "utf-8");
  } catch {
    return stripOrderPrefix(node.name);
  }

  const frontmatterTitle = raw.match(/^title:[ \t]*(.+)$/m);
  if (frontmatterTitle?.[1]) {
    return frontmatterTitle[1].trim().replace(/^["']|["']$/g, "");
  }
  const heading = raw.match(/^#[ \t]+(.+)$/m);
  if (heading?.[1]) return heading[1].trim();

  return stripOrderPrefix(node.name);
}

export function displayName(node: ContentNode): string {
  return stripOrderPrefix(node.name);
}

export function parentOf(
  archive: Archive,
  node: ContentNode,
): ContentNode | null {
  return node.parentPath
    ? (archive.byDirPath.get(node.parentPath) ?? null)
    : null;
}

export { stripOrderPrefix };
