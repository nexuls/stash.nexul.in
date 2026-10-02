import { existsSync, readdirSync, statSync } from "node:fs";
import { join, normalize, relative } from "node:path";
import { getContentDirectory, loadEntry } from "./discovery";
import { parseDocument } from "./parser";
import type { ContentEntry, ValidationIssue, ValidationResult } from "./types";

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Checks whether a directory segment conforms to kebab-case convention.
 */
export function isKebabCase(segment: string): boolean {
  return KEBAB_CASE_REGEX.test(segment);
}

/**
 * Suggests a kebab-case alternative for a non-compliant string.
 */
export function suggestKebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
}

/**
 * Recursively scans content directory checking paths and looking for missing README.mdx.
 */
function scanContentTree(
  baseDir: string,
  contentDir: string,
  issues: ValidationIssue[],
) {
  let items: string[];
  try {
    items = readdirSync(baseDir);
  } catch {
    return;
  }

  const subdirs: string[] = [];
  const files: string[] = [];

  for (const item of items) {
    if (item.startsWith(".")) {
      continue;
    }
    const fullPath = join(baseDir, item);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        subdirs.push(item);
      } else {
        files.push(item);
      }
    } catch {
      // Ignore unreadable
    }
  }

  // Validate segment naming
  const relDir = relative(contentDir, baseDir).replace(/\\/g, "/");
  if (relDir && relDir !== ".") {
    const segments = relDir.split("/");
    for (const segment of segments) {
      if (!isKebabCase(segment)) {
        const suggestion = suggestKebabCase(segment);
        issues.push({
          severity: "error",
          file: relDir,
          rule: "path-kebab-case",
          message: `Directory segment "${segment}" must be lowercase kebab-case.`,
          suggestion: suggestion
            ? `Rename "${segment}" to "${suggestion}"`
            : "Use lowercase letters, numbers, and hyphens only",
        });
      }
    }
  }

  const hasReadme = files.some((file) => file.toLowerCase() === "readme.mdx");

  // If a directory has files (like code, images) but no README.mdx and no child entries, report missing document
  if (!hasReadme && files.length > 0 && subdirs.length === 0) {
    issues.push({
      severity: "error",
      file: relDir || "content",
      rule: "missing-document",
      message: `Directory contains ${files.length} file(s) but is missing the primary entry document "README.mdx".`,
      suggestion: `Add "README.mdx" to "${relDir || "content"}" or move files to an existing entry directory.`,
    });
  }

  for (const subdir of subdirs) {
    scanContentTree(join(baseDir, subdir), contentDir, issues);
  }
}

/**
 * Validates frontmatter syntax and fields.
 */
function validateFrontmatter(
  entry: ContentEntry,
  rawFileContent: string,
  issues: ValidationIssue[],
) {
  const parsed = parseDocument(rawFileContent, entry.slug);

  if (parsed.frontmatterError) {
    issues.push({
      severity: "error",
      file: entry.filePath,
      line: parsed.frontmatterError.line || 1,
      rule: "malformed-metadata",
      message: parsed.frontmatterError.message,
      suggestion:
        "Check YAML syntax, indentation, and ensure delimiters (---) surround frontmatter",
    });
    return;
  }

  const { frontmatter } = parsed;

  if (frontmatter.tags !== undefined) {
    if (
      !Array.isArray(frontmatter.tags) ||
      frontmatter.tags.some((tag) => typeof tag !== "string")
    ) {
      issues.push({
        severity: "error",
        file: entry.filePath,
        rule: "invalid-tags-field",
        message: 'Frontmatter field "tags" must be an array of strings.',
        suggestion: 'Example format: tags: ["react", "hooks"]',
      });
    }
  }

  if (
    frontmatter.draft !== undefined &&
    typeof frontmatter.draft !== "boolean"
  ) {
    issues.push({
      severity: "error",
      file: entry.filePath,
      rule: "invalid-draft-field",
      message: 'Frontmatter field "draft" must be a boolean (true or false).',
    });
  }

  if (frontmatter.date !== undefined) {
    const dateVal = String(frontmatter.date);
    if (Number.isNaN(Date.parse(dateVal))) {
      issues.push({
        severity: "error",
        file: entry.filePath,
        rule: "invalid-date-field",
        message: `Frontmatter field "date" ("${dateVal}") is not a valid date format.`,
        suggestion: "Use ISO 8601 format: YYYY-MM-DD (e.g., 2026-10-02)",
      });
    }
  }

  if (frontmatter.updated !== undefined) {
    const updatedVal = String(frontmatter.updated);
    if (Number.isNaN(Date.parse(updatedVal))) {
      issues.push({
        severity: "error",
        file: entry.filePath,
        rule: "invalid-updated-field",
        message: `Frontmatter field "updated" ("${updatedVal}") is not a valid date format.`,
        suggestion: "Use ISO 8601 format: YYYY-MM-DD (e.g., 2026-10-02)",
      });
    }
  }
}

/**
 * Validates adjacent asset references within an entry.
 */
function validateAssets(entry: ContentEntry, issues: ValidationIssue[]) {
  for (const link of entry.links) {
    if (link.type !== "asset") {
      continue;
    }

    const rawTarget = link.targetPath || link.raw;
    // Remove leading ./ if present
    const cleanRelPath = rawTarget.replace(/^\.\//, "");
    const targetFile = join(entry.absoluteDirectoryPath, cleanRelPath);

    if (!existsSync(targetFile)) {
      issues.push({
        severity: "error",
        file: entry.filePath,
        line: link.lineNumber,
        rule: "missing-asset",
        message: `Referenced local asset "${link.raw}" does not exist in entry directory.`,
        suggestion: `Place "${cleanRelPath}" in "${entry.directoryPath}" or check the file name and path.`,
      });
    }
  }
}

/**
 * Validates internal links pointing to /stash/ routes or sibling entries,
 * including anchor verification.
 */
function validateInternalLinks(
  entry: ContentEntry,
  allEntriesBySlug: Map<string, ContentEntry>,
  issues: ValidationIssue[],
) {
  for (const link of entry.links) {
    // 1. Same-document anchor links: "#installation"
    if (link.type === "anchor" && link.targetAnchor) {
      const headingExists = entry.headings.some(
        (h) => h.slug === link.targetAnchor,
      );
      if (!headingExists) {
        const available = entry.headings.map((h) => `#${h.slug}`).join(", ");
        issues.push({
          severity: "error",
          file: entry.filePath,
          line: link.lineNumber,
          rule: "broken-anchor-link",
          message: `Target anchor "#${link.targetAnchor}" not found in this document.`,
          suggestion: available
            ? `Available headings: ${available}`
            : "No headings found in document",
        });
      }
      continue;
    }

    if (link.type !== "internal") {
      continue;
    }

    let targetSlug: string | undefined;

    // Handle "/stash/..." links
    if (link.targetPath?.startsWith("/stash/")) {
      targetSlug = link.targetPath
        .replace(/^\/stash\/?/, "")
        .replace(/\/$/, "");
    } else if (
      link.targetPath?.startsWith("../") ||
      link.targetPath?.startsWith("./")
    ) {
      // Resolve relative path to entry slug
      const cleanPath = link.targetPath.replace(/\.mdx?$/i, "");
      const resolvedDir = normalize(
        join(entry.directoryPath, cleanPath),
      ).replace(/\\/g, "/");
      targetSlug = resolvedDir;
    }

    if (!targetSlug) {
      continue;
    }

    const targetEntry = allEntriesBySlug.get(targetSlug);

    if (!targetEntry) {
      issues.push({
        severity: "error",
        file: entry.filePath,
        line: link.lineNumber,
        rule: "broken-internal-link",
        message: `Broken internal link: destination entry "/stash/${targetSlug}" does not exist.`,
        suggestion:
          "Verify target slug exists or update link to an existing entry.",
      });
      continue;
    }

    // If an anchor was specified on the internal link (e.g. /stash/react/hooks/use-debounce#options)
    if (link.targetAnchor) {
      const anchorExists = targetEntry.headings.some(
        (h) => h.slug === link.targetAnchor,
      );
      if (!anchorExists) {
        const available = targetEntry.headings
          .map((h) => `#${h.slug}`)
          .join(", ");
        issues.push({
          severity: "error",
          file: entry.filePath,
          line: link.lineNumber,
          rule: "broken-target-anchor",
          message: `Target anchor "#${link.targetAnchor}" not found in entry "/stash/${targetSlug}".`,
          suggestion: available
            ? `Available headings in target entry: ${available}`
            : "Target entry has no headings",
        });
      }
    }
  }
}

/**
 * Validates the entire content directory structure, metadata, assets, and internal links.
 */
export async function validateContent(
  contentDir: string = getContentDirectory(),
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  if (!existsSync(contentDir)) {
    issues.push({
      severity: "error",
      file: "content",
      rule: "missing-content-directory",
      message: `Content directory does not exist at "${contentDir}".`,
      suggestion: 'Create the "content/" directory at the repository root.',
    });
    return {
      valid: false,
      issues,
      entryCount: 0,
      assetCount: 0,
    };
  }

  // 1. Scan filesystem hierarchy for directory naming and orphan files
  scanContentTree(contentDir, contentDir, issues);

  // 2. Discover all entries
  const entryDirs: string[] = [];
  function collectEntryDirs(dir: string) {
    let items: string[];
    try {
      items = readdirSync(dir);
    } catch {
      return;
    }
    if (items.some((item) => item.toLowerCase() === "readme.mdx")) {
      entryDirs.push(dir);
    }
    for (const item of items) {
      if (item.startsWith(".")) continue;
      const full = join(dir, item);
      try {
        if (statSync(full).isDirectory()) {
          collectEntryDirs(full);
        }
      } catch {}
    }
  }
  collectEntryDirs(contentDir);

  const entries: ContentEntry[] = [];
  const allEntriesBySlug = new Map<string, ContentEntry>();
  let totalAssetCount = 0;

  for (const dir of entryDirs) {
    const entry = loadEntry(dir, contentDir);
    if (!entry) continue;

    // Check duplicate slug
    const existing = allEntriesBySlug.get(entry.slug);
    if (existing) {
      issues.push({
        severity: "error",
        file: entry.filePath,
        rule: "duplicate-slug",
        message: `Duplicate entry slug "${entry.slug}" conflicts with "${existing.filePath}".`,
        suggestion: "Ensure each entry directory has a unique path.",
      });
      continue;
    }

    allEntriesBySlug.set(entry.slug, entry);
    entries.push(entry);
    totalAssetCount += entry.assets.length;

    // Check empty README.mdx
    if (!entry.rawContent.trim()) {
      issues.push({
        severity: "error",
        file: entry.filePath,
        rule: "empty-document",
        message: `Document "README.mdx" in "${entry.directoryPath}" is empty.`,
        suggestion: "Add frontmatter or content to the document.",
      });
    }

    // 3. Validate frontmatter
    validateFrontmatter(entry, entry.rawContent, issues);

    // 4. Validate assets
    validateAssets(entry, issues);
  }

  // 5. Validate internal links & anchors across all loaded entries
  for (const entry of entries) {
    validateInternalLinks(entry, allEntriesBySlug, issues);
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    valid: !hasErrors,
    issues,
    entryCount: entries.length,
    assetCount: totalAssetCount,
  };
}
