/**
 * Reading the archive: the tree, one node in detail, the totals, the routes,
 * and a search over the documents.
 *
 * Everything shown here is derived at call time, so it is what the next build
 * will emit.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { calculateReadingTime } from "../../../lib/content";
import { fieldDisplay, readFrontmatter } from "../frontmatter";
import {
  type Archive,
  type ContentNode,
  displayName,
  documentsUnder,
  ENTRY_FILE,
  loadNodeEntry,
  quickTitle,
} from "../model";
import { log, notePanel, panel, pc, renderTree } from "../ui";

/**
 * The tree prints outside a box: it is the one view wide enough that wrapping
 * it inside a border would cost more than the border is worth.
 */
export function printTree(archive: Archive, root: ContentNode | null): void {
  const nodes = root ? [root] : archive.roots;
  const title = root ? `content/${root.dirPath}` : "content/";
  console.log(
    `\n${pc.bold(title)}${root?.route ? pc.dim(`  ${root.route}`) : ""}`,
  );
  console.log(renderTree(nodes, { baseDepth: root ? root.depth : 0 }));
  console.log("");
}

/** Adjacent files that ship with a document: code samples, diagrams, data. */
function adjacentAssets(node: ContentNode): string[] {
  try {
    return readdirSync(node.absPath)
      .filter((name) => {
        if (name === ENTRY_FILE || name.startsWith(".")) return false;
        return statSync(join(node.absPath, name)).isFile();
      })
      .sort();
  } catch {
    return [];
  }
}

export function showNode(node: ContentNode): void {
  const rows: string[] = [
    `${pc.dim("kind")}      ${node.kind}`,
    `${pc.dim("path")}      content/${node.dirPath}`,
    `${pc.dim("slug")}      ${node.slug}`,
    `${pc.dim("route")}     ${node.route ?? pc.dim("— serves nothing")}`,
    `${pc.dim("order")}     ${node.order ?? pc.dim("unnumbered")}`,
  ];

  if (node.kind === "category") {
    const documents = documentsUnder(node);
    rows.push(`${pc.dim("documents")} ${documents.length}`);
    panel(
      [rows.join("\n"), "", renderTree([node], { baseDepth: node.depth })].join(
        "\n",
      ),
      displayName(node),
    );
    return;
  }

  const entry = loadNodeEntry(node);
  const frontmatter = readFrontmatter(node);
  const assets = adjacentAssets(node);

  rows.push(`${pc.dim("title")}     ${entry?.title ?? quickTitle(node)}`);
  if (entry?.description)
    rows.push(`${pc.dim("summary")}   ${entry.description}`);

  const tags = fieldDisplay(frontmatter, "tags");
  if (tags) rows.push(`${pc.dim("tags")}      ${tags}`);

  const date = fieldDisplay(frontmatter, "date");
  const updated = fieldDisplay(frontmatter, "updated");
  if (date)
    rows.push(
      `${pc.dim("date")}      ${date}${updated ? pc.dim(` · updated ${updated}`) : ""}`,
    );
  if (frontmatter.draft === true)
    rows.push(`${pc.dim("draft")}     ${pc.yellow("yes")}`);

  if (entry) {
    rows.push(
      `${pc.dim("length")}    ${entry.readingTime.words} words · ${entry.readingTime.minutes} min read`,
    );
    rows.push(`${pc.dim("links")}     ${entry.links.length}`);
  }
  if (assets.length > 0)
    rows.push(`${pc.dim("assets")}    ${assets.join(", ")}`);

  const headings = (entry?.headings ?? [])
    .filter((heading) => heading.depth >= 2 && heading.depth <= 3)
    .map(
      (heading) =>
        `${"  ".repeat(heading.depth - 2)}${pc.dim("#".repeat(heading.depth))} ${heading.text}`,
    );

  panel(
    [
      rows.join("\n"),
      ...(headings.length > 0 ? ["", headings.join("\n")] : []),
    ].join("\n"),
    entry?.title ?? displayName(node),
  );
}

export function printStats(archive: Archive, asJson = false): void {
  const documents = archive.all.filter((node) => node.kind !== "category");
  const notes = documents.filter((node) => node.kind === "note");
  const indexes = documents.filter((node) => node.kind === "index");
  const categories = archive.all.filter((node) => node.kind === "category");

  let words = 0;
  for (const node of documents) {
    try {
      words += calculateReadingTime(
        readFileSync(join(node.absPath, ENTRY_FILE), "utf-8"),
      ).words;
    } catch {
      // A document that cannot be read is the validator's problem, not this one's.
    }
  }

  const perDomain = archive.roots.map((domain) => ({
    domain: displayName(domain),
    documents: documentsUnder(domain).length,
    categories: documentsUnder(domain).length
      ? domain.children.filter((child) => child.kind === "category").length
      : 0,
  }));

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          domains: archive.roots.length,
          categories: categories.length,
          notes: notes.length,
          categoryPages: indexes.length,
          routes: documents.length,
          words,
          perDomain,
        },
        null,
        2,
      ),
    );
    return;
  }

  const summary = [
    `${pc.dim("domains")}         ${archive.roots.length}`,
    `${pc.dim("categories")}      ${categories.length}`,
    `${pc.dim("notes")}           ${notes.length}`,
    `${pc.dim("category pages")}  ${indexes.length}`,
    `${pc.dim("routes")}          ${documents.length}`,
    `${pc.dim("words")}           ${words.toLocaleString("en-US")}`,
  ].join("\n");

  const breakdown = perDomain
    .map(
      (row) =>
        `${row.domain.padEnd(14)} ${String(row.documents).padStart(3)} documents${row.categories ? pc.dim(` · ${row.categories} director${row.categories === 1 ? "y" : "ies"}`) : ""}`,
    )
    .join("\n");

  panel([summary, "", breakdown].join("\n"), "Archive");
}

export function printRoutes(archive: Archive, asJson = false): void {
  const routes = archive.all
    .filter((node) => node.route)
    .map((node) => node.route as string)
    .sort();

  if (asJson) {
    console.log(JSON.stringify(routes, null, 2));
    return;
  }
  for (const route of routes) console.log(route);
}

export interface SearchHit {
  node: ContentNode;
  matches: { line: number; text: string }[];
}

/** Documents whose text mentions a query, with the lines that matched. */
export function searchArchive(archive: Archive, query: string): SearchHit[] {
  const needle = query.toLowerCase();
  const hits: SearchHit[] = [];

  for (const node of archive.all) {
    if (node.kind === "category") continue;
    let raw: string;
    try {
      raw = readFileSync(join(node.absPath, ENTRY_FILE), "utf-8");
    } catch {
      continue;
    }
    if (!raw.toLowerCase().includes(needle)) continue;

    const matches = raw
      .split("\n")
      .map((text, index) => ({ line: index + 1, text: text.trim() }))
      .filter((row) => row.text.toLowerCase().includes(needle))
      .slice(0, 3);

    hits.push({ node, matches });
  }

  return hits;
}

export function printSearch(hits: SearchHit[], query: string): void {
  if (hits.length === 0) {
    log.warn(`No document mentions "${query}".`);
    return;
  }

  const body = hits
    .map((hit) => {
      const head = `${pc.bold(quickTitle(hit.node))}\n${pc.dim(`${hit.node.route ?? hit.node.slug} · content/${hit.node.dirPath}`)}`;
      const lines = hit.matches
        .map(
          (match) =>
            `  ${pc.dim(`${match.line}:`)} ${match.text.slice(0, 96)}${match.text.length > 96 ? "…" : ""}`,
        )
        .join("\n");
      return `${head}\n${lines}`;
    })
    .join("\n\n");

  notePanel(
    body,
    `${hits.length} document${hits.length === 1 ? "" : "s"} matching "${query}"`,
  );
}
