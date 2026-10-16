/**
 * Reading and editing a document's frontmatter.
 *
 * Edits go through `yaml`'s document model, which keeps key order, comments and
 * block style intact, so setting a title does not rewrite the tag list
 * underneath it. `extractFrontmatter` from `lib/content/parser` does the
 * splitting, so this tool and the loader agree on where frontmatter ends.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { extractFrontmatter } from "../../lib/content";
import { type ContentNode, ENTRY_FILE } from "./model";

export type FrontmatterValue = string | number | boolean | string[];

export function documentPath(node: ContentNode): string {
  return join(node.absPath, ENTRY_FILE);
}

export function readFrontmatter(node: ContentNode): Record<string, unknown> {
  const raw = readFileSync(documentPath(node), "utf-8");
  const { frontmatterText } = extractFrontmatter(raw);
  if (!frontmatterText) return {};
  const parsed = parseDocument(frontmatterText).toJS();
  return parsed && typeof parsed === "object" ? parsed : {};
}

/** The value of one field, formatted for display. */
export function fieldDisplay(
  frontmatter: Record<string, unknown>,
  field: string,
): string {
  const value = frontmatter[field];
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/**
 * Sets fields on a document's frontmatter, creating the block when the document
 * has none. Returns the file's new contents without writing them, so a caller
 * can show a diff or a dry run first.
 */
export function withFrontmatter(
  node: ContentNode,
  changes: Record<string, FrontmatterValue | undefined>,
): string {
  const raw = readFileSync(documentPath(node), "utf-8");
  const { frontmatterText, body } = extractFrontmatter(raw);
  const doc = parseDocument(frontmatterText ?? "");

  for (const [field, value] of Object.entries(changes)) {
    if (value === undefined) {
      doc.delete(field);
      continue;
    }
    if (Array.isArray(value)) {
      // A list reads better block-style, which is how every entry writes tags.
      const node = doc.createNode(value);
      if (node && typeof node === "object" && "flow" in node) {
        (node as { flow?: boolean }).flow = false;
      }
      doc.set(field, node);
      continue;
    }
    doc.set(field, value);
  }

  const serialized = doc.toString({ lineWidth: 0 }).trimEnd();
  return `---\n${serialized}\n---\n\n${body.replace(/^\n+/, "")}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
