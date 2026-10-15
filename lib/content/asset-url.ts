/**
 * URL construction for entry-adjacent assets.
 *
 * Entry assets live in `content/`, not `public/`, and are served by
 * `app/content-assets/[...path]/route.ts`. Both the MDX pipeline and the
 * companion-files list build their URLs here so the prefix exists in one place.
 */

/** URL prefix handled by the content asset route. */
export const CONTENT_ASSET_BASE = "/content-assets";

/**
 * URL prefix that maps to an entry's directory, without a trailing slash.
 */
export function entryAssetBaseUrl(slug: string): string {
  return `${CONTENT_ASSET_BASE}/${slug.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * URL for a single asset, given its path relative to the entry directory.
 */
export function entryAssetUrl(slug: string, relativePath: string): string {
  return `${entryAssetBaseUrl(slug)}/${relativePath.replace(/^\/+/, "")}`;
}
