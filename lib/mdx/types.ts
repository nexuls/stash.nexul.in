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
  /** Renders on a single line, for a one-sentence aside. */
  compact: z.boolean().optional().default(false),
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
  /**
   * Keeps every Tabs group sharing this key on the same selection, so choosing
   * a package manager once applies to the rest of the document.
   */
  group: z.string().optional(),
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
  /**
   * On by default: prose refers to "line 12" far more often than a block is
   * hurt by a gutter. Authors opt out with `showLineNumbers={false}`, which
   * `remarkCodeLineNumbers` carries through to the fence.
   */
  showLineNumbers: z.boolean().optional().default(true),
  highlightLines: z.array(z.number()).optional(),
  className: z.string().optional(),
});

/**
 * Props for the Steps container and each Step.
 */
export const stepsPropsSchema = z.object({
  /** Number the first step from something other than 1. */
  start: z.number().int().positive().optional().default(1),
  className: z.string().optional(),
});

export type StepsProps = z.infer<typeof stepsPropsSchema> & {
  children?: React.ReactNode;
};

export const stepPropsSchema = z.object({
  title: z.string().optional(),
  className: z.string().optional(),
});

export type StepProps = z.infer<typeof stepPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Props for FileTree nodes.
 */
export const fileTreeNodePropsSchema = z.object({
  name: z.string().min(1, "FileTree nodes need a name"),
  /** Marks the node as the subject of the surrounding prose. */
  highlight: z.boolean().optional().default(false),
  /** Short trailing note, e.g. "entry document". */
  comment: z.string().optional(),
  className: z.string().optional(),
});

export type FileTreeNodeProps = z.infer<typeof fileTreeNodePropsSchema> & {
  children?: React.ReactNode;
};

export const folderPropsSchema = fileTreeNodePropsSchema.extend({
  defaultOpen: z.boolean().optional().default(true),
});

export type FolderProps = z.infer<typeof folderPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * One parameter of a function-typed prop, listed inside its row.
 */
export const propParameterSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type PropParameter = z.infer<typeof propParameterSchema>;

/**
 * One row of a PropsTable. `name` and `type` are the line a reader scans;
 * everything else is detail the row holds until it is opened.
 */
export const propRowSchema = z.object({
  name: z.string().min(1),
  /** Short form shown on the row, e.g. `function` or `union`. */
  type: z.string().optional(),
  /** Full signature, when `type` is a short stand-in for it. */
  typeDetail: z.string().optional(),
  parameters: z.array(propParameterSchema).optional(),
  returns: z.string().optional(),
  default: z.string().optional(),
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
});

export type PropRow = z.infer<typeof propRowSchema>;

/**
 * Props of a single `<Prop>` child. Same fields as a row, with the
 * description written as the tag's children so it can hold Markdown — a code
 * span, a link, a list, a fenced block — the way a JSDoc comment does.
 */
export type PropProps = z.infer<typeof propRowSchema> & {
  children?: React.ReactNode;
};

export const propsTablePropsSchema = z.object({
  /** Rows as data. Omitted when the table is written as `<Prop>` children. */
  rows: z
    .array(propRowSchema)
    .min(1, "PropsTable needs at least one row")
    .optional(),
  /** Caption describing what the props belong to. */
  of: z.string().optional(),
  className: z.string().optional(),
});

export type PropsTableProps = z.infer<typeof propsTablePropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Props for the LinkCard component.
 */
export const linkCardPropsSchema = z.object({
  href: z.string().min(1, "LinkCard needs an href"),
  title: z.string().min(1, "LinkCard needs a title"),
  description: z.string().optional(),
  /** Short label shown above the title, e.g. the entry's domain. */
  eyebrow: z.string().optional(),
  className: z.string().optional(),
});

export type LinkCardProps = z.infer<typeof linkCardPropsSchema> & {
  children?: React.ReactNode;
};

export type CodeBlockProps = z.infer<typeof codeBlockPropsSchema> & {
  children?: React.ReactNode;
};

/**
 * Props for the ComponentPreview showcase.
 *
 * `directory` and `error` are not authored: `remarkPreviewSource` writes them
 * onto the tag at compile time, because only the pipeline knows which entry
 * directory the document came from and whether the listed files exist.
 */
export const componentPreviewPropsSchema = z.object({
  /** Export to render from the entry's `preview.tsx`. */
  demo: z.string().optional().default("Preview"),
  /** Entry directory relative to `content/`, order prefixes included. */
  directory: z.string().optional(),
  /** Label for the preview, shown above the frame. */
  title: z.string().optional(),
  /** Width thumb and viewport presets, for checking a layout as it narrows. */
  resizable: z.boolean().optional().default(true),
  /** Frame-rate readout in the header. Off by default: it costs a rAF loop. */
  fps: z.boolean().optional().default(false),
  /** Height of the preview viewport in pixels. */
  height: z.number().int().positive().optional().default(440),
  /** Tab shown first. */
  defaultTab: z.enum(["preview", "code"]).optional().default("preview"),
  /** Files shown in the Code tab, comma separated, written by the pipeline. */
  files: z.string().optional(),
  /** Compile-time diagnostic, e.g. a listed file that does not exist. */
  error: z.string().optional(),
  className: z.string().optional(),
});

export type ComponentPreviewProps = z.infer<
  typeof componentPreviewPropsSchema
> & {
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
