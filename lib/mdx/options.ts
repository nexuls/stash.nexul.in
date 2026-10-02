/**
 * MDX compilation and plugin options.
 *
 * Configures remark and rehype plugins for Next.js App Router MDX evaluation,
 * including GitHub Flavored Markdown (remark-gfm) and syntax highlighting
 * with Shiki (rehype-pretty-code).
 */

import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

/**
 * Standard configuration for rehype-pretty-code using Shiki.
 *
 * Provides dual theme support (github-light & github-dark) and enables:
 * - Line numbers via `showLineNumbers` meta flag
 * - Line highlighting via `{1,3-4}` meta syntax
 * - Filenames and titles via `title="filename.ext"` meta syntax
 * - Clean design-system integration by disabling hardcoded backgrounds (`keepBackground: false`)
 */
export const defaultRehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  grid: true,
  defaultLang: "plaintext",
};

/**
 * MDX evaluation options passed into next-mdx-remote-client.
 */
export function getMdxOptions(
  customRehypePrettyCodeOptions?: Partial<RehypePrettyCodeOptions>,
) {
  const prettyCodeOptions: RehypePrettyCodeOptions = {
    ...defaultRehypePrettyCodeOptions,
    ...customRehypePrettyCodeOptions,
  };

  return {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [rehypePrettyCode, prettyCodeOptions] as [
        typeof rehypePrettyCode,
        RehypePrettyCodeOptions,
      ],
    ],
  };
}
