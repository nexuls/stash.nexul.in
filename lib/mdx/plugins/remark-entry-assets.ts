/**
 * Resolves entry-relative asset references to servable URLs.
 *
 * An entry is a directory, so authors write `./diagram.svg` and
 * `[source](./use-debounce.ts)` the way they would in a README on disk. The
 * browser resolves those against the *route* (`/stash/react/hooks/use-debounce`),
 * one segment too high, so every adjacent image and file link 404s. This plugin
 * rewrites them against the entry directory instead, pointing at the asset
 * route that serves `content/`.
 */

import type { HastNode } from "./hast";

/** mdast nodes carry `url`; MDX JSX nodes carry an `attributes` array. */
interface MdastNode extends HastNode {
  url?: string;
  name?: string;
  attributes?: Array<{
    type: string;
    name?: string;
    value?: unknown;
  }>;
}

const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** Attributes that hold a resource URL, per element name. */
const URL_ATTRIBUTES = new Set(["src", "href", "poster"]);

/**
 * True when a reference should be resolved against the entry directory.
 */
export function isEntryRelative(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/") || url.startsWith("#")) return false;
  if (ABSOLUTE_URL.test(url)) return false;
  return true;
}

/**
 * Joins an entry-relative reference onto a base URL, collapsing `.` and `..`.
 */
export function resolveEntryUrl(baseUrl: string, url: string): string {
  const hashIndex = url.indexOf("#");
  const path = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);

  const segments = baseUrl.replace(/\/+$/, "").split("/");
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (segments.length > 1) segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return `${segments.join("/")}${hash}`;
}

export interface RemarkEntryAssetsOptions {
  /**
   * URL prefix that maps to the entry directory, without a trailing slash
   * (e.g. `/content-assets/react/hooks/use-debounce`).
   */
  assetBaseUrl?: string;
}

/**
 * Remark plugin. Runs before remark-rehype.
 */
export function remarkEntryAssets(options: RemarkEntryAssetsOptions = {}) {
  const { assetBaseUrl } = options;

  return (tree: MdastNode) => {
    if (!assetBaseUrl) return;

    const visit = (node: MdastNode) => {
      if (
        (node.type === "image" ||
          node.type === "link" ||
          node.type === "definition") &&
        typeof node.url === "string" &&
        isEntryRelative(node.url)
      ) {
        node.url = resolveEntryUrl(assetBaseUrl, node.url);
      }

      if (
        (node.type === "mdxJsxFlowElement" ||
          node.type === "mdxJsxTextElement") &&
        Array.isArray(node.attributes)
      ) {
        for (const attribute of node.attributes) {
          if (
            attribute.type !== "mdxJsxAttribute" ||
            !attribute.name ||
            !URL_ATTRIBUTES.has(attribute.name) ||
            typeof attribute.value !== "string" ||
            !isEntryRelative(attribute.value)
          ) {
            continue;
          }
          attribute.value = resolveEntryUrl(assetBaseUrl, attribute.value);
        }
      }

      for (const child of (node.children ?? []) as MdastNode[]) {
        visit(child);
      }
    };

    visit(tree);
  };
}
