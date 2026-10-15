/**
 * Serves entry-adjacent assets from `content/`.
 *
 * Entries keep diagrams and source files beside their `README.mdx`, so those
 * files live outside `public/`. This route exposes them at a stable URL and is
 * fully prerendered: `generateStaticParams` enumerates every discovered asset
 * at build time and `dynamicParams = false` makes anything else a 404 rather
 * than a request-time filesystem read.
 */

import { readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { getAllEntries, getContentDirectory } from "@/lib/content/discovery";

export const dynamic = "force-static";
export const dynamicParams = false;

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".bash": "text/plain; charset=utf-8",
  ".bmp": "image/bmp",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".gif": "image/gif",
  ".go": "text/plain; charset=utf-8",
  ".html": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsx": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".mjs": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".py": "text/plain; charset=utf-8",
  ".rs": "text/plain; charset=utf-8",
  ".sh": "text/plain; charset=utf-8",
  ".sql": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".toml": "text/plain; charset=utf-8",
  ".ts": "text/plain; charset=utf-8",
  ".tsx": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".yaml": "text/plain; charset=utf-8",
  ".yml": "text/plain; charset=utf-8",
};

function contentTypeFor(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const extension = dot === -1 ? "" : filename.slice(dot).toLowerCase();
  return MIME_TYPES[extension] ?? "application/octet-stream";
}

/**
 * Enumerates `<entry slug>/<asset relative path>` for every discovered asset.
 */
export async function generateStaticParams() {
  const entries = await getAllEntries({ includeDrafts: true });

  return entries.flatMap((entry) =>
    entry.assets.map((asset) => ({
      path: [...entry.slugSegments, ...asset.relativePath.split("/")],
    })),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const contentDirectory = getContentDirectory();
  const requested = normalize(join(contentDirectory, ...path));

  // `dynamicParams = false` already restricts this route to enumerated assets;
  // the prefix check keeps a malformed build manifest from reaching outside
  // the content directory.
  if (!requested.startsWith(contentDirectory)) {
    return new Response("Not found", { status: 404 });
  }

  let file: Buffer;
  try {
    if (!statSync(requested).isFile()) {
      return new Response("Not found", { status: 404 });
    }
    file = readFileSync(requested);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": contentTypeFor(requested),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
