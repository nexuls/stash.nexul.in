/**
 * Server-side MDX evaluation and rendering module.
 *
 * Uses `next-mdx-remote-client/rsc` to evaluate MDX documents in React Server
 * Components. Compilation failures are returned as rendered diagnostics rather
 * than thrown, so one malformed entry cannot take down a build.
 */

import { evaluate, type MDXComponents } from "next-mdx-remote-client/rsc";
import type * as React from "react";
import { MdxError } from "@/components/mdx/mdx-error";
import { createMdxComponents } from "@/components/mdx/registry";
import { getMdxOptions } from "@/lib/mdx/options";

export interface RenderMdxOptions {
  source: string;
  sourcePath?: string;
  /**
   * URL prefix that maps to the entry's directory, so `./diagram.svg` resolves
   * against the entry rather than against the route.
   */
  assetBaseUrl?: string;
  /**
   * Absolute path of the entry directory. `<ComponentPreview>` is filled from
   * it at compile time and resolves the entry's `preview.tsx` against it.
   */
  entryDirectory?: string;
  /** The same directory relative to `content/`, order prefixes included. */
  entryDirectoryPath?: string;
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
  assetBaseUrl,
  entryDirectory,
  entryDirectoryPath,
  components,
}: RenderMdxOptions): Promise<RenderMdxResult> {
  const mdxComponents = createMdxComponents(components, source);
  const mdxOptions = getMdxOptions({
    assetBaseUrl,
    entryDirectory,
    entryDirectoryPath,
  });

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
  assetBaseUrl,
  entryDirectory,
  entryDirectoryPath,
  components,
}: RenderMdxOptions) {
  const { content } = await renderMdx({
    source,
    sourcePath,
    assetBaseUrl,
    entryDirectory,
    entryDirectoryPath,
    components,
  });
  return content;
}
