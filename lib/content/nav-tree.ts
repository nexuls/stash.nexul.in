/**
 * Navigation tree derivation for the documentation sidebar.
 *
 * Content hierarchy comes from directory paths, so the sidebar tree is derived
 * from each entry's `categories` path rather than a hand-maintained registry.
 * Supports arbitrary nesting depth, label formatting, filtering, and resolution
 * of the open "trail" of groups leading to the active entry.
 */

import type { ContentEntry } from "@/lib/content/types";

export interface NavEntryNode {
  kind: "entry";
  /** Entry slug, unique within the tree */
  id: string;
  /** Depth in the tree, 0 for entries at the content root */
  depth: number;
  entry: ContentEntry;
}

export interface NavGroupNode {
  kind: "group";
  /** Slash-joined category path, e.g. "react/hooks" */
  id: string;
  /** Raw directory segment, e.g. "hooks" */
  segment: string;
  /** Human-readable segment, e.g. "Hooks" */
  label: string;
  /** Depth in the tree, 0 for top-level domains */
  depth: number;
  /** Total entries contained in this group, including nested groups */
  entryCount: number;
  children: NavNode[];
}

export type NavNode = NavGroupNode | NavEntryNode;

/**
 * Names that capitalisation rules get wrong, keyed by their lowercase form.
 * A directory called `typescript` should read as TypeScript, not Typescript.
 */
const WORD_CASING: Record<string, string> = {
  api: "API",
  cli: "CLI",
  css: "CSS",
  graphql: "GraphQL",
  html: "HTML",
  javascript: "JavaScript",
  jsx: "JSX",
  mdx: "MDX",
  nodejs: "Node.js",
  sql: "SQL",
  tsx: "TSX",
  typescript: "TypeScript",
  ui: "UI",
  ux: "UX",
};

/** Converts a kebab-case directory segment into a human-readable label. */
export function formatSegmentLabel(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        WORD_CASING[word.toLowerCase()] ??
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function compareEntries(a: ContentEntry, b: ContentEntry): number {
  const orderA =
    typeof a.frontmatter.order === "number" ? a.frontmatter.order : null;
  const orderB =
    typeof b.frontmatter.order === "number" ? b.frontmatter.order : null;

  if (orderA !== null && orderB !== null && orderA !== orderB) {
    return orderA - orderB;
  }
  if (orderA !== null && orderB === null) return -1;
  if (orderA === null && orderB !== null) return 1;

  return a.title.localeCompare(b.title);
}

/** Groups are listed before entries, each alphabetically, at every level. */
function sortNodes(nodes: NavNode[]): NavNode[] {
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "group" ? -1 : 1;
    if (a.kind === "group" && b.kind === "group") {
      return a.segment.localeCompare(b.segment);
    }
    if (a.kind === "entry" && b.kind === "entry") {
      return compareEntries(a.entry, b.entry);
    }
    return 0;
  });
}

function countEntriesIn(nodes: NavNode[]): number {
  return nodes.reduce(
    (total, node) =>
      total + (node.kind === "entry" ? 1 : countEntriesIn(node.children)),
    0,
  );
}

/**
 * Builds the sidebar navigation tree from the flat entry list.
 *
 * Each entry is placed under its `categories` directory path; entries at the
 * content root become top-level nodes alongside the domain groups.
 */
export function buildNavTree(entries: ContentEntry[]): NavNode[] {
  const root: NavNode[] = [];
  const groups = new Map<string, NavGroupNode>();

  for (const entry of entries) {
    let siblings = root;
    let path = "";

    for (const [index, segment] of entry.categories.entries()) {
      path = path ? `${path}/${segment}` : segment;
      let group = groups.get(path);

      if (!group) {
        group = {
          kind: "group",
          id: path,
          segment,
          label: formatSegmentLabel(segment),
          depth: index,
          entryCount: 0,
          children: [],
        };
        groups.set(path, group);
        siblings.push(group);
      }

      siblings = group.children;
    }

    siblings.push({
      kind: "entry",
      id: entry.slug,
      depth: entry.categories.length,
      entry,
    });
  }

  for (const group of groups.values()) {
    group.children = sortNodes(group.children);
    group.entryCount = countEntriesIn(group.children);
  }

  return sortNodes(root);
}

/** Total number of entry nodes in a tree. */
export function countNavEntries(nodes: NavNode[]): number {
  return countEntriesIn(nodes);
}

function entryHaystack(entry: ContentEntry): string {
  return [entry.slug, entry.title, entry.description, ...entry.tags]
    .join(" ")
    .toLowerCase();
}

/**
 * Prunes the tree to entries matching every whitespace-separated query token.
 *
 * Tokens match against an entry's path, title, description, and tags. A group
 * whose own path matches a token satisfies that token for all of its
 * descendants, so filtering by "hooks" reveals the whole `hooks` directory.
 */
export function filterNavTree(nodes: NavNode[], query: string): NavNode[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return nodes;

  function prune(candidates: NavNode[], satisfied: string[]): NavNode[] {
    const result: NavNode[] = [];

    for (const node of candidates) {
      if (node.kind === "entry") {
        const haystack = entryHaystack(node.entry);
        const matches = tokens.every(
          (token) => satisfied.includes(token) || haystack.includes(token),
        );
        if (matches) result.push(node);
        continue;
      }

      const groupHaystack = node.id.toLowerCase();
      const nextSatisfied = tokens.filter(
        (token) => satisfied.includes(token) || groupHaystack.includes(token),
      );
      const children = prune(node.children, nextSatisfied);

      if (children.length > 0) {
        result.push({
          ...node,
          children,
          entryCount: countEntriesIn(children),
        });
      }
    }

    return result;
  }

  return prune(nodes, []);
}

/**
 * Group ids leading to the entry at `pathname`, used to expand the active trail.
 *
 * Returns an empty array when no entry matches the current route.
 */
export function getActiveTrail(
  entries: ContentEntry[],
  pathname: string,
): string[] {
  const active = entries.find((entry) => entry.permalink === pathname);
  if (!active) return [];

  const trail: string[] = [];
  let path = "";
  for (const segment of active.categories) {
    path = path ? `${path}/${segment}` : segment;
    trail.push(path);
  }

  return trail;
}

/** First entry in tree order, used to resolve a filter to a destination. */
export function findFirstNavEntry(nodes: NavNode[]): NavEntryNode | null {
  for (const node of nodes) {
    if (node.kind === "entry") return node;
    const nested = findFirstNavEntry(node.children);
    if (nested) return nested;
  }
  return null;
}

export interface NavDomain {
  /** Top-level directory segment, e.g. "react" */
  slug: string;
  /** Human-readable segment, e.g. "React" */
  label: string;
  entryCount: number;
  /** Destination when switching to this domain */
  firstPermalink: string;
  /** Contents of the domain, used as the scoped sidebar tree */
  nodes: NavNode[];
}

function containsPermalink(nodes: NavNode[], permalink: string): boolean {
  return nodes.some((node) =>
    node.kind === "entry"
      ? node.entry.permalink === permalink
      : containsPermalink(node.children, permalink),
  );
}

/**
 * Knowledge domains, one per top-level content directory.
 *
 * Entries stored at the content root are collected into a trailing "general"
 * domain so that nothing in the archive is unreachable from the switcher.
 */
export function getNavDomains(tree: NavNode[]): NavDomain[] {
  const domains: NavDomain[] = [];
  const looseEntries: NavNode[] = [];

  for (const node of tree) {
    if (node.kind === "entry") {
      looseEntries.push(node);
      continue;
    }

    domains.push({
      slug: node.id,
      label: node.label,
      entryCount: node.entryCount,
      firstPermalink: findFirstNavEntry(node.children)?.entry.permalink ?? "/",
      nodes: node.children,
    });
  }

  if (looseEntries.length > 0) {
    domains.push({
      slug: "general",
      label: "General",
      entryCount: looseEntries.length,
      firstPermalink: findFirstNavEntry(looseEntries)?.entry.permalink ?? "/",
      nodes: looseEntries,
    });
  }

  return domains;
}

/**
 * Domain owning the current route, falling back to the first domain.
 *
 * Resolved from the route rather than held in state, so the switcher only has
 * to navigate and the sidebar cannot disagree with the page being displayed.
 */
export function getActiveDomain(
  domains: NavDomain[],
  pathname: string,
): NavDomain | null {
  const owning = domains.find((domain) =>
    containsPermalink(domain.nodes, pathname),
  );
  if (owning) return owning;

  const segment = pathname.replace(/^\/stash\/?/, "").split("/")[0];
  return (
    domains.find((domain) => domain.slug === segment) ?? domains[0] ?? null
  );
}
