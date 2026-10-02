/**
 * Server-side MDX evaluation and rendering module.
 *
 * Uses `next-mdx-remote-client/rsc` with remark-gfm and rehype-pretty-code (Shiki)
 * to evaluate MDX documents in Next.js React Server Components.
 */

import { evaluate, type MDXComponents } from "next-mdx-remote-client/rsc";
import type * as React from "react";
import { MdxError } from "@/components/mdx/mdx-error";
import { createMdxComponents } from "@/components/mdx/registry";
import { getMdxOptions } from "@/lib/mdx/options";

export interface RenderMdxOptions {
  source: string;
  sourcePath?: string;
  components?: MDXComponents;
}

export interface RenderMdxResult {
  content: React.ReactElement | null;
  error?: Error;
}

/**
 * Evaluates MDX source on the server and returns React content or an error.
 */
export async function renderMdx({
  source,
  sourcePath,
  components,
}: RenderMdxOptions): Promise<RenderMdxResult> {
  const mdxComponents = createMdxComponents(components, source);
  const mdxOptions = getMdxOptions();

  try {
    const result = await evaluate({
      source,
      components: mdxComponents,
      options: {
        mdxOptions,
      },
    });

    if (result.error) {
      return {
        content: <MdxError error={result.error} sourcePath={sourcePath} />,
        error: result.error,
      };
    }

    return {
      content: result.content,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return {
      content: <MdxError error={error} sourcePath={sourcePath} />,
      error,
    };
  }
}

/**
 * React Server Component to evaluate and render an MDX document.
 */
export async function MDXRenderer({
  source,
  sourcePath,
  components,
}: RenderMdxOptions) {
  const { content } = await renderMdx({ source, sourcePath, components });
  return content;
}
