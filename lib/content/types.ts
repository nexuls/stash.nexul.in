/**
 * TypeScript type definitions and Zod schemas for the Stash content system.
 *
 * Defines Zod validation schemas for entries, frontmatter, headings, links, assets,
 * categories, and validation diagnostics, and derives canonical TypeScript types from them.
 *
 * Notable: Strictly uses Zod everywhere for schema definitions and runtime validation.
 */

import { z } from "zod";

export const assetTypeSchema = z.enum(["code", "image", "document", "other"]);

export const contentAssetSchema = z.object({
  /** The filename of the asset (e.g., "use-debounce.ts") */
  filename: z.string().min(1),
  /** Relative path from the entry directory (e.g., "use-debounce.ts" or "images/demo.png") */
  relativePath: z.string().min(1),
  /** Absolute path on disk */
  absolutePath: z.string().min(1),
  /** Categorized asset type */
  type: assetTypeSchema,
  /** File size in bytes */
  size: z.number().int().nonnegative(),
  /** File extension including leading dot (e.g., ".ts") */
  extension: z.string(),
});

export const contentHeadingSchema = z.object({
  /** Heading depth (1 for #, 2 for ##, etc.) */
  depth: z.number().int().min(1).max(6),
  /** Raw text content of the heading */
  text: z.string().min(1),
  /** URL-safe anchor slug (e.g., "installation-instructions") */
  slug: z.string().min(1),
});

export const linkTypeSchema = z.enum([
  "internal",
  "external",
  "asset",
  "anchor",
]);

export const contentLinkSchema = z.object({
  /** Raw link destination as written in Markdown/MDX */
  raw: z.string().min(1),
  /** Anchor/link display text */
  text: z.string(),
  /** Categorized link type */
  type: linkTypeSchema,
  /** Line number where the link appears (1-indexed) */
  lineNumber: z.number().int().positive(),
  /** Normalized target path without query or hash (if applicable) */
  targetPath: z.string().optional(),
  /** Target hash/anchor without leading '#' (if applicable) */
  targetAnchor: z.string().optional(),
});

export const contentFrontmatterSchema = z
  .object({
    /** Explicit title override */
    title: z.string().optional(),
    /** Explicit summary / description override */
    description: z.string().optional(),
    /** Publication or creation date (ISO string or valid date string) */
    date: z
      .union([z.string(), z.date()])
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: "Must be a valid date format (e.g. YYYY-MM-DD)",
      })
      .optional(),
    /** Last updated date (ISO string or valid date string) */
    updated: z
      .union([z.string(), z.date()])
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: "Must be a valid date format (e.g. YYYY-MM-DD)",
      })
      .optional(),
    /** Associated search and classification tags */
    tags: z.array(z.string()).optional(),
    /** Mark entry as draft (excluded from production builds by default) */
    draft: z.boolean().optional(),
    /** Mark entry as deprecated, optionally providing reason */
    deprecated: z.union([z.boolean(), z.string()]).optional(),
    /** Optional manual category override */
    category: z.string().optional(),
    /** Optional numeric sort order */
    order: z.number().optional(),
  })
  .passthrough();

export const contentReadingTimeSchema = z.object({
  minutes: z.number().int().positive(),
  words: z.number().int().nonnegative(),
});

export const contentEntrySchema = z.object({
  /** Unique URL-friendly slug derived from entry directory path (e.g., "react/hooks/use-debounce") */
  slug: z.string().min(1),
  /** Slug path segments (e.g., ["react", "hooks", "use-debounce"]) */
  slugSegments: z.array(z.string()),
  /** Directory segments as they exist on disk, order prefixes included */
  rawSlugSegments: z.array(z.string()),
  /**
   * Sort position among siblings, from the entry directory's order prefix and
   * falling back to frontmatter `order`. Null when neither names one.
   */
  order: z.number().nullable(),
  /** Full web route permalink (e.g., "/stash/react/hooks/use-debounce") */
  permalink: z.string().min(1),
  /** Directory path relative to content root (e.g., "react/hooks/use-debounce") */
  directoryPath: z.string(),
  /** Path to README.mdx relative to project root */
  filePath: z.string().min(1),
  /** Absolute filesystem path of entry directory */
  absoluteDirectoryPath: z.string().min(1),
  /** Absolute filesystem path of README.mdx */
  absoluteFilePath: z.string().min(1),
  /** Effective title (from frontmatter, first heading, or derived from slug) */
  title: z.string().min(1),
  /** Effective description (from frontmatter or first body paragraph) */
  description: z.string(),
  /** Parsed raw frontmatter dictionary */
  frontmatter: z.record(z.string(), z.unknown()),
  /** Raw MDX document body (excluding frontmatter) */
  body: z.string(),
  /** Full raw content of the README.mdx file */
  rawContent: z.string(),
  /**
   * Whether this entry is a category's index page, authored as a `home`
   * directory inside the category and served at the category's own path.
   */
  isCategoryIndex: z.boolean(),
  /** Hierarchical category path (e.g., ["react", "hooks"]) */
  categories: z.array(z.string()),
  /** Sort position of each category directory, aligned with `categories` */
  categoryOrders: z.array(z.number().nullable()),
  /** Primary category name (e.g., "react", or "general" if root entry) */
  category: z.string().min(1),
  /** Assigned tags */
  tags: z.array(z.string()),
  /** Extracted document headings */
  headings: z.array(contentHeadingSchema),
  /** Extracted outbound links and asset references */
  links: z.array(contentLinkSchema),
  /** Discovered adjacent assets in the entry directory */
  assets: z.array(contentAssetSchema),
  /** Publication date string if available */
  date: z.string().optional(),
  /** Last updated date string if available */
  updated: z.string().optional(),
  /** Whether entry is marked as draft */
  draft: z.boolean(),
  /** Estimated reading metrics */
  readingTime: contentReadingTimeSchema,
});

export const contentCategorySchema = z.object({
  /** Category display name */
  name: z.string().min(1),
  /** URL slug for category */
  slug: z.string().min(1),
  /** Hierarchy path segments */
  path: z.array(z.string()),
  /** Sort position from the directory's order prefix, null when it has none */
  order: z.number().nullable(),
  /** Number of entries in this category */
  count: z.number().int().nonnegative(),
  /** Entries directly or hierarchically under this category */
  entries: z.array(contentEntrySchema),
});

export const validationSeveritySchema = z.enum(["error", "warning"]);

export const validationIssueSchema = z.object({
  severity: validationSeveritySchema,
  /** Path to the problematic file or directory */
  file: z.string().min(1),
  /** Line number if applicable */
  line: z.number().int().positive().optional(),
  /** Column number if applicable */
  column: z.number().int().positive().optional(),
  /** Actionable error message */
  message: z.string().min(1),
  /** Name of the violated rule */
  rule: z.string().min(1),
  /** Helpful hint or suggestion for resolution */
  suggestion: z.string().optional(),
});

export const validationResultSchema = z.object({
  valid: z.boolean(),
  issues: z.array(validationIssueSchema),
  entryCount: z.number().int().nonnegative(),
  assetCount: z.number().int().nonnegative(),
});

export type AssetType = z.infer<typeof assetTypeSchema>;
export type ContentAsset = z.infer<typeof contentAssetSchema>;
export type ContentHeading = z.infer<typeof contentHeadingSchema>;
export type LinkType = z.infer<typeof linkTypeSchema>;
export type ContentLink = z.infer<typeof contentLinkSchema>;
export type ContentFrontmatter = z.infer<typeof contentFrontmatterSchema>;
export type ContentReadingTime = z.infer<typeof contentReadingTimeSchema>;
export type ContentEntry = z.infer<typeof contentEntrySchema>;
export type ContentCategory = z.infer<typeof contentCategorySchema>;
export type ValidationSeverity = z.infer<typeof validationSeveritySchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
