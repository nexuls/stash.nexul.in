/**
 * Fills `<FileDownloads />` with the files an entry can hand the reader.
 *
 * A reader who has just watched the preview wants the implementation on disk,
 * not a tour of a repository, so the tag is authored with nothing but the
 * names already sitting beside `README.mdx`:
 *
 * ```mdx
 * <FileDownloads files="svg-particles.tsx, preview.tsx" />
 * ```
 *
 * Written bare, it offers every adjacent asset the entry has — the same list
 * the entry page shows — so an added file needs no edit here.
 *
 * Only the pipeline knows which entry is compiling and what the files weigh,
 * so this plugin resolves the list to `path` and `size` pairs and writes the
 * URL prefix that serves them. A name that no longer exists becomes a
 * compile-time diagnostic rendered where the list would have been, which is
 * the same bargain `remarkPreviewSource` strikes for a renamed source file.
 */

import { statSync } from "node:fs";
import { join } from "node:path";
import { discoverAdjacentAssets } from "@/lib/content/assets";
import type { HastNode } from "./hast";
import {
  type MdxAttribute,
  readStringAttribute,
  setAttribute,
} from "./mdx-attributes";
import { isInsideEntry, parseFileList } from "./remark-preview-source";

interface MdastNode extends HastNode {
  name?: string;
  attributes?: MdxAttribute[];
}

/** Tag this plugin fills. */
const TAG = "FileDownloads";

/** One resolved file, as the component receives it. */
export interface ResolvedDownload {
  /** Path relative to the entry directory. */
  path: string;
  /** Size in bytes, read at compile time. */
  size: number;
}

export interface RemarkFileDownloadsOptions {
  /** Absolute path of the entry directory being compiled. */
  entryDirectory?: string;
  /** URL prefix that maps to that directory, without a trailing slash. */
  assetBaseUrl?: string;
}

/**
 * Remark plugin. Runs before remark-rehype; order against the other tag
 * fillers does not matter, since no two of them touch the same tag.
 */
export function remarkFileDownloads(options: RemarkFileDownloadsOptions = {}) {
  const { entryDirectory, assetBaseUrl } = options;

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

      if (!entryDirectory || !assetBaseUrl) {
        setAttribute(
          attributes,
          "error",
          `<${TAG}> needs the entry it belongs to, which the MDX pipeline was not given.`,
        );
        return;
      }

      setAttribute(attributes, "base", assetBaseUrl);

      const listed = readStringAttribute(attributes, "files");
      const resolved: ResolvedDownload[] = [];

      if (listed) {
        for (const file of parseFileList(listed)) {
          if (!isInsideEntry(file)) {
            setAttribute(
              attributes,
              "error",
              `<${TAG} files="${file}"> points outside the entry directory.`,
            );
            return;
          }

          let size: number;
          try {
            const stat = statSync(join(entryDirectory, file));
            if (!stat.isFile()) throw new Error("not a file");
            size = stat.size;
          } catch {
            setAttribute(
              attributes,
              "error",
              `<${TAG} files="${file}"> names a file that is not in the entry directory.`,
            );
            return;
          }

          resolved.push({ path: file, size });
        }
      } else {
        // The same discovery the entry page lists, so the two agree.
        for (const asset of discoverAdjacentAssets(entryDirectory)) {
          resolved.push({ path: asset.relativePath, size: asset.size });
        }
      }

      if (resolved.length === 0) {
        setAttribute(
          attributes,
          "error",
          `<${TAG}> found no files beside this entry to offer.`,
        );
        return;
      }

      setAttribute(attributes, "items", JSON.stringify(resolved));
    };

    visit(tree);
  };
}
