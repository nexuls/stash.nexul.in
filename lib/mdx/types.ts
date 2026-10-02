/**
 * MDX component props and configuration schemas.
 *
 * Strict Zod schemas and inferred TypeScript types for all registered MDX components
 * and MDX evaluation options. Adheres to Stash project architectural standard of
 * schema-first runtime validation.
 */

import { z } from "zod";

/**
 * Supported callout severity levels / categories.
 */
export const calloutTypeSchema = z.enum([
  "note",
  "tip",
  "warning",
  "danger",
  "important",
  // Aliases:
  "info",
  "caution",
]);

export type CalloutType = z.infer<typeof calloutTypeSchema>;

/**
 * Normalized callout types (aliases mapped to primary type).
 */
export const normalizedCalloutTypeSchema = z.enum([
  "note",
  "tip",
  "warning",
  "danger",
  "important",
]);

export type NormalizedCalloutType = z.infer<typeof normalizedCalloutTypeSchema>;

export function normalizeCalloutType(type?: string): NormalizedCalloutType {
  if (!type) return "note";
  const lower = type.toLowerCase().trim();
  if (lower === "info") return "note";
  if (lower === "caution") return "danger";
  const parsed = normalizedCalloutTypeSchema.safeParse(lower);
  return parsed.success ? parsed.data : "note";
}

/**
 * Props for the Callout component.
 */
export const calloutPropsSchema = z.object({
  type: calloutTypeSchema.optional().default("note"),
  title: z.string().optional(),
  className: z.string().optional(),
});

export type CalloutProps = z.infer<typeof calloutPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Props for individual Tab content.
 */
export const tabPropsSchema = z.object({
  value: z.string().optional(),
  label: z.string().optional(),
  className: z.string().optional(),
});

export type TabProps = z.infer<typeof tabPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Props for Tabs container.
 */
export const tabsPropsSchema = z.object({
  items: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
  className: z.string().optional(),
});

export type TabsProps = z.infer<typeof tabsPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Props for Details disclosure component.
 */
export const detailsPropsSchema = z.object({
  summary: z.string().min(1, "Summary is required for Details"),
  defaultOpen: z.boolean().optional().default(false),
  className: z.string().optional(),
});

export type DetailsProps = z.infer<typeof detailsPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Props for programmatic CodeBlock component.
 */
export const codeBlockPropsSchema = z.object({
  code: z.string().optional(),
  language: z.string().optional().default("text"),
  filename: z.string().optional(),
  showLineNumbers: z.boolean().optional().default(false),
  highlightLines: z.array(z.number()).optional(),
  className: z.string().optional(),
});

export type CodeBlockProps = z.infer<typeof codeBlockPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Options for MDX evaluation.
 */
export const mdxEvaluateOptionsSchema = z.object({
  source: z.string(),
  disableImports: z.boolean().optional().default(false),
  disableExports: z.boolean().optional().default(false),
});

export type MdxEvaluateOptions = z.infer<typeof mdxEvaluateOptionsSchema>;
