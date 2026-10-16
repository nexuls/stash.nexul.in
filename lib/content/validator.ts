/**
 * Build-time content validation suite.
 *
 * Enforces kebab-case directory naming, detects duplicate slugs and clashing order prefixes,
 * verifies YAML frontmatter schemas, confirms physical existence of referenced assets, and
 * validates internal Stash links and heading anchors.
 *
 * Notable: Strictly driven by Zod schemas (`kebabCaseSegmentSchema`, `contentFrontmatterSchema`, `validationResultSchema`).
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, normalize, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { getContentDirectory, loadEntry } from "./discovery";
import { parseOrderedSegment, stripOrderPrefixes } from "./ordering";
import { extractFrontmatter } from "./parser";
import {
  type ContentEntry,
  contentFrontmatterSchema,
  type ValidationIssue,
  type ValidationResult,
  validationResultSchema,
} from "./types";

/**
 * Zod schema defining kebab-case path segment format.
 */
export const kebabCaseSegmentSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "Must be lowercase alphanumeric with hyphens (kebab-case)",
  });

/**
 * Checks whether a directory segment conforms to kebab-case convention using Zod.
 */
export function isKebabCase(segment: string): boolean {
  return kebabCaseSegmentSchema.safeParse(segment).success;
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

  // Validate segment naming via Zod schema. A leading order prefix is sorting
  // information rather than part of the name, so the name is checked without it.
  const relDir = relative(contentDir, baseDir).replace(/\\/g, "/");
  if (relDir && relDir !== ".") {
    const segments = relDir.split("/");
    for (const segment of segments) {
      const { name, order } = parseOrderedSegment(segment);
      const parseResult = kebabCaseSegmentSchema.safeParse(name);
      if (!parseResult.success) {
        const suggestion = suggestKebabCase(name);
        const numbered = order === null ? "" : `${order} - `;
        issues.push({
          severity: "error",
          file: relDir,
          rule: "path-kebab-case",
          message: `Directory segment "${name}" must be lowercase kebab-case.`,
          suggestion: suggestion
            ? `Rename "${segment}" to "${numbered}${suggestion}"`
            : "Use lowercase letters, numbers, and hyphens only",
        });
      }
    }
  }

  // Two siblings asking for the same place leaves their order to the filesystem.
  const numbered = new Map<number, string>();
  for (const subdir of subdirs) {
    const { order } = parseOrderedSegment(subdir);
    if (order === null) continue;
    const existing = numbered.get(order);
    if (existing) {
      issues.push({
        severity: "warning",
        file: join(relDir || "content", subdir),
        rule: "duplicate-order",
        message: `Order ${order} is already taken by "${existing}" in the same directory.`,
        suggestion:
          "Give each numbered directory in a directory its own number.",
      });
      continue;
    }
    numbered.set(order, subdir);
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
 * Validates frontmatter syntax and fields using Zod schema.
 */
function validateFrontmatter(
  entry: ContentEntry,
  rawFileContent: string,
  issues: ValidationIssue[],
) {
  const { frontmatterText } = extractFrontmatter(rawFileContent);
  if (!frontmatterText) {
    return;
  }

  // Parse YAML text safely
  let parsedRaw: unknown;
  try {
    parsedRaw = parseYaml(frontmatterText);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    issues.push({
      severity: "error",
      file: entry.filePath,
      line: 1,
      rule: "malformed-metadata",
      message: `YAML syntax error in frontmatter: ${message}`,
      suggestion:
        "Check YAML syntax, indentation, and ensure delimiters (---) surround frontmatter",
    });
    return;
  }

  if (
    typeof parsedRaw !== "object" ||
    parsedRaw === null ||
    Array.isArray(parsedRaw)
  ) {
    issues.push({
      severity: "error",
      file: entry.filePath,
      line: 1,
      rule: "malformed-metadata",
      message: "Frontmatter must be a YAML object/dictionary",
      suggestion: "Format frontmatter as key-value pairs (e.g. title: Value)",
    });
    return;
  }

  // Strictly validate frontmatter fields via Zod
  const zodResult = contentFrontmatterSchema.safeParse(parsedRaw);
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      const field = issue.path[0] ? String(issue.path[0]) : "metadata";
      let suggestion: string | undefined;

      if (field === "tags") {
        suggestion = 'Example format: tags: ["react", "hooks"]';
      } else if (field === "draft") {
        suggestion = "Use boolean true or false";
      } else if (field === "date" || field === "updated") {
        suggestion = "Use ISO 8601 format: YYYY-MM-DD (e.g., 2026-10-02)";
      }

      issues.push({
        severity: "error",
        file: entry.filePath,
        line: 1,
        rule: `invalid-${field}-field`,
        message: `Frontmatter field "${issue.path.join(".")}": ${issue.message}.`,
        suggestion,
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
      // Relative links may name directories with or without their order
      // prefixes; slugs carry none, so the resolved path is stripped to match.
      const resolvedDir = normalize(
        join(entry.directoryPath, cleanPath),
      ).replace(/\\/g, "/");
      targetSlug = stripOrderPrefixes(resolvedDir);
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
    return validationResultSchema.parse({
      valid: false,
      issues,
      entryCount: 0,
      assetCount: 0,
    });
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

  // Strictly validate returned result object via Zod schema
  return validationResultSchema.parse({
    valid: !hasErrors,
    issues,
    entryCount: entries.length,
    assetCount: totalAssetCount,
  });
}
