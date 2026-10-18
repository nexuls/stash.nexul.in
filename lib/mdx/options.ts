/**
 * MDX compilation and plugin options.
 *
 * The pipeline is: GitHub Flavored Markdown, preview-source inlining,
 * download-list resolution, `<CodeBlock>` lowering, the line-number default, entry-relative asset
 * resolution, standalone-image promotion, removal of a duplicated title
 * heading, heading slugs, Shiki highlighting, then a pass that lifts code
 * metadata onto the figure element so the React renderer never inspects its
 * own children.
 */

import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { rehypeCodeMeta } from "./plugins/rehype-code-meta";
import { remarkCodeBlockJsx } from "./plugins/remark-code-block-jsx";
import { remarkCodeLineNumbers } from "./plugins/remark-code-line-numbers";
import { remarkEntryAssets } from "./plugins/remark-entry-assets";
import { remarkFileDownloads } from "./plugins/remark-file-downloads";
import { remarkImageFigures } from "./plugins/remark-image-figures";
import { remarkPreviewSource } from "./plugins/remark-preview-source";
import { remarkStripTitleHeading } from "./plugins/remark-strip-title-heading";

/**
 * Shiki configuration for rehype-pretty-code.
 *
 * Dual themes emit both light and dark token colors as CSS variables on every
 * token, so theme switching needs no re-highlighting and no flash. Backgrounds
 * come from the Stash palette instead of the Shiki theme, and `grid` makes each
 * line a full-width row so line highlighting can bleed to both edges.
 */
export const defaultRehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  grid: true,
  defaultLang: {
    block: "plaintext",
    inline: "plaintext",
  },
};

export interface MdxOptionsConfig {
  /**
   * URL prefix mapping to the entry directory, used to resolve `./asset` style
   * references. Omit it to leave relative references untouched.
   */
  assetBaseUrl?: string;
  /**
   * Absolute path of the entry directory, so `<ComponentPreview>` can be
   * filled with the files it names. Omit it and the tag reports that it was
   * compiled without an entry.
   */
  entryDirectory?: string;
  /** The same directory relative to `content/`, order prefixes included. */
  entryDirectoryPath?: string;
  rehypePrettyCodeOptions?: Partial<RehypePrettyCodeOptions>;
}

/**
 * MDX evaluation options passed into next-mdx-remote-client.
 */
export function getMdxOptions(config: MdxOptionsConfig = {}) {
  const prettyCodeOptions: RehypePrettyCodeOptions = {
    ...defaultRehypePrettyCodeOptions,
    ...config.rehypePrettyCodeOptions,
  };

  return {
    remarkPlugins: [
      remarkGfm,
      [
        remarkPreviewSource,
        {
          entryDirectory: config.entryDirectory,
          entryDirectoryPath: config.entryDirectoryPath,
        },
      ] as [
        typeof remarkPreviewSource,
        { entryDirectory?: string; entryDirectoryPath?: string },
      ],
      [
        remarkFileDownloads,
        {
          entryDirectory: config.entryDirectory,
          assetBaseUrl: config.assetBaseUrl,
        },
      ] as [
        typeof remarkFileDownloads,
        { entryDirectory?: string; assetBaseUrl?: string },
      ],
      remarkCodeBlockJsx,
      remarkCodeLineNumbers,
      [remarkEntryAssets, { assetBaseUrl: config.assetBaseUrl }] as [
        typeof remarkEntryAssets,
        { assetBaseUrl?: string },
      ],
      remarkImageFigures,
      remarkStripTitleHeading,
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, prettyCodeOptions] as [
        typeof rehypePrettyCode,
        RehypePrettyCodeOptions,
      ],
      rehypeCodeMeta,
    ],
  };
}
