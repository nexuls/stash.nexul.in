/**
 * Fills `<ComponentPreview />` with the source it is showing.
 *
 * The component demonstrates code that lives beside the document on disk, so
 * the author names files rather than pasting them: `<ComponentPreview
 * files="masonry-row-grid.tsx" />`. This plugin reads those files out of the
 * entry directory and appends them to the tag as ordinary fenced code nodes,
 * which means the Code tab is highlighted by the same Shiki pass as every
 * other block on the page and a renamed file shows up as a build-time error
 * rather than as prose that quietly drifted from the implementation.
 *
 * It also writes the entry's directory onto the tag, since only the pipeline
 * knows which entry is being compiled, and the component resolves the entry's
 * `preview.tsx` from it.
 */

import { readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import type { HastNode } from "./hast";
import {
  type MdxAttribute,
  readStringAttribute,
  setAttribute,
} from "./mdx-attributes";

interface MdastNode extends HastNode {
  name?: string;
  lang?: string;
  meta?: string;
  value?: string;
  attributes?: MdxAttribute[];
}

/** Tag this plugin fills. */
const TAG = "ComponentPreview";

/** Module every entry's demos are exported from. */
export const PREVIEW_MODULE = "preview.tsx";

/** Extension to Shiki language id, for the files an entry is likely to hold. */
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".tsx": "tsx",
  ".ts": "ts",
  ".jsx": "jsx",
  ".js": "js",
  ".mjs": "js",
  ".css": "css",
  ".json": "json",
  ".html": "html",
  ".md": "md",
  ".mdx": "mdx",
  ".sh": "bash",
};

export function languageForFile(file: string): string {
  return LANGUAGE_BY_EXTENSION[extname(file).toLowerCase()] ?? "plaintext";
}

/**
 * Splits the authored `files` list. Accepts commas or newlines so a long list
 * can be written across several lines.
 */
export function parseFileList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * True when a listed file stays inside the entry directory.
 *
 * An entry may only show its own files; `../../secrets` is a mistake worth
 * reporting rather than resolving.
 */
export function isInsideEntry(file: string): boolean {
  if (!file || file.startsWith("/")) return false;
  const normalized = normalize(file);
  return !normalized.startsWith("..") && !normalized.startsWith("/");
}

export interface RemarkPreviewSourceOptions {
  /** Absolute path of the entry directory being compiled. */
  entryDirectory?: string;
  /** The same directory relative to `content/`, order prefixes included. */
  entryDirectoryPath?: string;
}

/**
 * Remark plugin. Runs before the line-number default and rehype-pretty-code.
 */
export function remarkPreviewSource(options: RemarkPreviewSourceOptions = {}) {
  const { entryDirectory, entryDirectoryPath } = options;

  return (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      if (node.type === "mdxJsxFlowElement" && node.name === TAG) {
        fill(node);
        return;
      }
      for (const child of (node.children ?? []) as MdastNode[]) {
        visit(child);
      }
    };

    const fill = (node: MdastNode) => {
      node.attributes ??= [];
      const attributes = node.attributes;

      if (!entryDirectory || !entryDirectoryPath) {
        setAttribute(
          attributes,
          "error",
          `<${TAG}> needs the entry it belongs to, which the MDX pipeline was not given.`,
        );
        return;
      }

      setAttribute(attributes, "directory", entryDirectoryPath);

      const listed = readStringAttribute(attributes, "files");
      const files = listed ? parseFileList(listed) : [PREVIEW_MODULE];
      // Written back in resolved form, so the frame can label one tab per
      // file without re-deriving the author's list.
      setAttribute(attributes, "files", files.join(","));
      node.children ??= [];
      const children = node.children as MdastNode[];

      for (const file of files) {
        if (!isInsideEntry(file)) {
          setAttribute(
            attributes,
            "error",
            `<${TAG} files="${file}"> points outside the entry directory.`,
          );
          return;
        }

        const absolute = join(entryDirectory, file);
        let source: string;
        try {
          if (!statSync(absolute).isFile()) throw new Error("not a file");
          source = readFileSync(absolute, "utf8");
        } catch {
          setAttribute(
            attributes,
            "error",
            `<${TAG} files="${file}"> names a file that is not in ${entryDirectoryPath}.`,
          );
          return;
        }

        children.push({
          type: "code",
          lang: languageForFile(file),
          meta: `title="${file}"`,
          value: source.replace(/\s+$/, ""),
        } as MdastNode);
      }
    };

    visit(tree);
  };
}
