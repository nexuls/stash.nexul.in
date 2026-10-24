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
 * One file offered by `<FileDownloads>`, resolved by the pipeline.
 */
export const fileDownloadItemSchema = z.object({
  /** Path relative to the entry directory. */
  path: z.string().min(1),
  /** Size in bytes, read at compile time. */
  size: z.number().int().nonnegative(),
});

export type FileDownloadItem = z.infer<typeof fileDownloadItemSchema>;

export const fileDownloadItemsSchema = z.array(fileDownloadItemSchema);

/**
 * Props for the FileDownloads list.
 *
 * `items`, `base` and `error` are not authored: `remarkFileDownloads` writes
 * them onto the tag at compile time, because only the pipeline knows the
 * entry's directory, what its files weigh, and whether a listed name exists.
 */
export const fileDownloadsPropsSchema = z.object({
  /** Files to offer, comma or newline separated. Omit it for every asset. */
  files: z.string().optional(),
  /** Heading for the list. */
  title: z.string().optional().default("Download"),
  /** One line under the heading, when the files need explaining. */
  description: z.string().optional(),
  /** Resolved files as JSON, written by the pipeline. */
  items: z.string().optional(),
  /** URL prefix that maps to the entry directory, written by the pipeline. */
  base: z.string().optional(),
  /** Compile-time diagnostic, e.g. a listed file that does not exist. */
  error: z.string().optional(),
  className: z.string().optional(),
});

export type FileDownloadsProps = z.infer<typeof fileDownloadsPropsSchema>;

/**
 * Verdict statuses a `<TypeMatrix>` cell can carry.
 *
 * Only two, deliberately: the compiler either accepts the value or it does
 * not, and a matrix that offered shades of nearly would stop being a record
 * of what the type actually does.
 */
export const typeVerdictStatusSchema = z.enum(["ok", "error"]);

export type TypeVerdictStatus = z.infer<typeof typeVerdictStatusSchema>;

/**
 * One cell. A bare status is the common case; the object form adds the
 * complaint the compiler makes, which is the part worth quoting when a type
 * rejects something a reader expected it to accept.
 */
export const typeVerdictSchema = z.union([
  typeVerdictStatusSchema,
  z.object({
    status: typeVerdictStatusSchema,
    message: z.string().optional(),
  }),
]);

export type TypeVerdict = z.infer<typeof typeVerdictSchema>;

/** Normalizes either verdict form to the object the renderer works with. */
export function normalizeTypeVerdict(verdict: TypeVerdict): {
  status: TypeVerdictStatus;
  message?: string;
} {
  return typeof verdict === "string" ? { status: verdict } : verdict;
}

/**
 * One row: a value, and what each type under test makes of it.
 */
export const typeCaseSchema = z.object({
  /** The value, written as it would appear in source. */
  code: z.string().min(1, "a case needs code"),
  /** Short name for the case, e.g. "mixes two variants". */
  label: z.string().optional(),
  /** One verdict per column, in the order the columns are declared. */
  verdicts: z.array(typeVerdictSchema).min(1, "a case needs a verdict"),
});

export type TypeCase = z.infer<typeof typeCaseSchema>;

/**
 * Props for the TypeMatrix assignability table.
 *
 * `types` names the columns, so one matrix can set a naive type beside the one
 * that fixes it and show the same values landing differently.
 */
export const typeMatrixPropsSchema = z
  .object({
    /** One label per column. A single column needs no name. */
    types: z.array(z.string().min(1)).min(1, "TypeMatrix needs a type"),
    /** One row per value. */
    cases: z.array(typeCaseSchema).min(1, "TypeMatrix needs a case"),
    /** Caption naming what is under test, e.g. "assignable to Car". */
    of: z.string().optional(),
    className: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    for (const [index, testCase] of value.cases.entries()) {
      if (testCase.verdicts.length === value.types.length) continue;

      ctx.addIssue({
        code: "custom",
        message: `case ${index + 1} has ${testCase.verdicts.length} verdicts for ${value.types.length} types`,
      });
    }
  });

export type TypeMatrixProps = z.infer<typeof typeMatrixPropsSchema> & {
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
