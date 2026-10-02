import { readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import type { AssetType, ContentAsset } from "./types";

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".sh",
  ".bash",
  ".zsh",
  ".py",
  ".go",
  ".rs",
  ".sql",
  ".yaml",
  ".yml",
  ".toml",
  ".md",
]);

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".avif",
  ".ico",
  ".bmp",
  ".tiff",
]);

const DOCUMENT_EXTENSIONS = new Set([".pdf", ".txt", ".csv", ".tsv"]);

/**
 * Categorizes a file extension into an AssetType.
 */
export function categorizeAssetType(extension: string): AssetType {
  const normalized = extension.toLowerCase();
  if (IMAGE_EXTENSIONS.has(normalized)) {
    return "image";
  }
  if (CODE_EXTENSIONS.has(normalized)) {
    return "code";
  }
  if (DOCUMENT_EXTENSIONS.has(normalized)) {
    return "document";
  }
  return "other";
}

/**
 * Discovers all adjacent assets within an entry directory.
 * Traverses subdirectories unless the subdirectory is a separate entry (has its own README.mdx).
 */
export function discoverAdjacentAssets(
  entryDirectory: string,
  currentDirectory: string = entryDirectory,
): ContentAsset[] {
  const assets: ContentAsset[] = [];

  let items: string[];
  try {
    items = readdirSync(currentDirectory);
  } catch {
    return assets;
  }

  for (const item of items) {
    if (item.startsWith(".")) {
      continue;
    }

    const fullPath = join(currentDirectory, item);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      // Check if child directory is a separate content entry
      const hasReadme = readdirSync(fullPath).some(
        (child) => child.toLowerCase() === "readme.mdx",
      );
      if (!hasReadme) {
        assets.push(...discoverAdjacentAssets(entryDirectory, fullPath));
      }
      continue;
    }

    // Ignore the entry's primary document
    if (item.toLowerCase() === "readme.mdx") {
      continue;
    }

    const extension = extname(item);
    const relPath = relative(entryDirectory, fullPath).replace(/\\/g, "/");

    assets.push({
      filename: item,
      relativePath: relPath,
      absolutePath: fullPath,
      type: categorizeAssetType(extension),
      size: stat.size,
      extension,
    });
  }

  // Sort assets deterministically by relative path
  return assets.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
