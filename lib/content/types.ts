/**
 * Core types for the Stash content system.
 */

export type AssetType = "code" | "image" | "document" | "other";

export interface ContentAsset {
  /** The filename of the asset (e.g., "use-debounce.ts") */
  filename: string;
  /** Relative path from the entry directory (e.g., "use-debounce.ts" or "images/demo.png") */
  relativePath: string;
  /** Absolute path on disk */
  absolutePath: string;
  /** Categorized asset type */
  type: AssetType;
  /** File size in bytes */
  size: number;
  /** File extension including leading dot (e.g., ".ts") */
  extension: string;
}

export interface ContentHeading {
  /** Heading depth (1 for #, 2 for ##, etc.) */
  depth: number;
  /** Raw text content of the heading */
  text: string;
  /** URL-safe anchor slug (e.g., "installation-instructions") */
  slug: string;
}

export type LinkType = "internal" | "external" | "asset" | "anchor";

export interface ContentLink {
  /** Raw link destination as written in Markdown/MDX */
  raw: string;
  /** Anchor/link display text */
  text: string;
  /** Categorized link type */
  type: LinkType;
  /** Line number where the link appears (1-indexed) */
  lineNumber: number;
  /** Normalized target path without query or hash (if applicable) */
  targetPath?: string;
  /** Target hash/anchor without leading '#' (if applicable) */
  targetAnchor?: string;
}

export interface ContentFrontmatter {
  /** Explicit title override */
  title?: string;
  /** Explicit summary / description override */
  description?: string;
  /** Publication or creation date (ISO string or date string) */
  date?: string;
  /** Last updated date (ISO string or date string) */
  updated?: string;
  /** Associated search and classification tags */
  tags?: string[];
  /** Mark entry as draft (excluded from production builds by default) */
  draft?: boolean;
  /** Mark entry as deprecated, optionally providing reason */
  deprecated?: boolean | string;
  /** Optional manual category override */
  category?: string;
  /** Optional numeric sort order */
  order?: number;
  /** Additional custom metadata fields */
  [key: string]: unknown;
}

export interface ContentEntry {
  /** Unique URL-friendly slug derived from entry directory path (e.g., "react/hooks/use-debounce") */
  slug: string;
  /** Slug path segments (e.g., ["react", "hooks", "use-debounce"]) */
  slugSegments: string[];
  /** Full web route permalink (e.g., "/stash/react/hooks/use-debounce") */
  permalink: string;
  /** Directory path relative to content root (e.g., "react/hooks/use-debounce") */
  directoryPath: string;
  /** Path to README.mdx relative to project root */
  filePath: string;
  /** Absolute filesystem path of entry directory */
  absoluteDirectoryPath: string;
  /** Absolute filesystem path of README.mdx */
  absoluteFilePath: string;
  /** Effective title (from frontmatter, first heading, or derived from slug) */
  title: string;
  /** Effective description (from frontmatter or first body paragraph) */
  description: string;
  /** Parsed raw frontmatter object */
  frontmatter: ContentFrontmatter;
  /** Raw MDX document body (excluding frontmatter) */
  body: string;
  /** Full raw content of the README.mdx file */
  rawContent: string;
  /** Hierarchical category path (e.g., ["react", "hooks"]) */
  categories: string[];
  /** Primary category name (e.g., "react", or "general" if root entry) */
  category: string;
  /** Assigned tags */
  tags: string[];
  /** Extracted document headings */
  headings: ContentHeading[];
  /** Extracted outbound links and asset references */
  links: ContentLink[];
  /** Discovered adjacent assets in the entry directory */
  assets: ContentAsset[];
  /** Publication date string if available */
  date?: string;
  /** Last updated date string if available */
  updated?: string;
  /** Whether entry is marked as draft */
  draft: boolean;
  /** Estimated reading metrics */
  readingTime: {
    minutes: number;
    words: number;
  };
}

export interface ContentCategory {
  /** Category display name */
  name: string;
  /** URL slug for category */
  slug: string;
  /** Hierarchy path segments */
  path: string[];
  /** Number of entries in this category */
  count: number;
  /** Entries directly or hierarchically under this category */
  entries: ContentEntry[];
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  /** Path to the problematic file or directory */
  file: string;
  /** Line number if applicable */
  line?: number;
  /** Column number if applicable */
  column?: number;
  /** Actionable error message */
  message: string;
  /** Name of the violated rule */
  rule: string;
  /** Helpful hint or suggestion for resolution */
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  entryCount: number;
  assetCount: number;
}
