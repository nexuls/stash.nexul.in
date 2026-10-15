/**
 * Markdown and MDX parsing engine for Stash entries.
 *
 * Parses YAML frontmatter, extracts headings with anchor slugs, scans links/assets with line numbers,
 * and derives sensible fallback titles and descriptions from document content.
 *
 * Notable: Strictly validates frontmatter against Zod schema (`contentFrontmatterSchema`).
 */

import { parse as parseYaml } from "yaml";
import {
  type ContentFrontmatter,
  type ContentHeading,
  type ContentLink,
  contentFrontmatterSchema,
  contentHeadingSchema,
  contentLinkSchema,
  type LinkType,
} from "./types";

export interface ParsedDocument {
  frontmatter: ContentFrontmatter;
  body: string;
  headings: ContentHeading[];
  links: ContentLink[];
  title: string;
  description: string;
  readingTime: {
    minutes: number;
    words: number;
  };
  frontmatterError?: {
    message: string;
    line?: number;
  };
}

/**
 * Normalizes text to a URL-friendly anchor slug (GitHub-style).
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-alphanumeric except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // replace spaces and underscores with a single hyphen
    .replace(/^-+|-+$/g, ""); // strip leading and trailing hyphens
}

/**
 * Strips markdown inline markup (bold, italic, code, links) to plain text.
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images -> alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> anchor text
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/__([^_]+)__/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/_([^_]+)_/g, "$1") // italic
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/<[^>]+>/g, "") // html tags
    .trim();
}

/**
 * Converts a kebab-case slug segment into title-cased display text.
 * e.g., "use-debounce" -> "Use Debounce"
 */
export function formatSlugToTitle(slug: string): string {
  const leaf = slug.split("/").pop() || slug;
  return leaf
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Splits raw MDX file content into frontmatter and document body.
 */
export function extractFrontmatter(rawContent: string): {
  frontmatterText: string | null;
  body: string;
  frontmatterLineOffset: number;
} {
  const trimmed = rawContent.replace(/^\uFEFF/, ""); // strip UTF-8 BOM if present
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return {
      frontmatterText: null,
      body: trimmed,
      frontmatterLineOffset: 0,
    };
  }

  const frontmatterText = match[1];
  const body = trimmed.slice(match[0].length);
  const frontmatterLineOffset = match[0].split(/\r?\n/).length - 1;

  return {
    frontmatterText,
    body,
    frontmatterLineOffset,
  };
}

/**
 * Extracts headings from markdown body, skipping fenced code blocks.
 */
export function extractHeadings(body: string): ContentHeading[] {
  const headings: ContentHeading[] = [];
  const lines = body.split(/\r?\n/);
  const slugCounts = new Map<string, number>();

  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Toggle fenced code block
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (!headingMatch) {
      continue;
    }

    const depth = headingMatch[1].length;
    // Strip trailing '#' characters if author used e.g. "## Heading ##"
    const rawText = headingMatch[2].replace(/\s+#+$/, "").trim();
    const cleanText = stripMarkdown(rawText);

    if (!cleanText) {
      continue;
    }

    let baseSlug = slugifyHeading(cleanText);
    if (!baseSlug) {
      baseSlug = `heading-${headings.length + 1}`;
    }

    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);

    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    // Validate with Zod heading schema
    const heading = contentHeadingSchema.parse({
      depth,
      text: cleanText,
      slug,
    });

    headings.push(heading);
  }

  return headings;
}

/**
 * Splits a Markdown link destination from its optional title.
 *
 * `![alt](./diagram.svg "Caption")` carries the caption inside the parentheses;
 * without this the title would be treated as part of the path and reported as
 * a missing asset.
 */
export function splitLinkDestination(destination: string): string {
  const trimmed = destination.trim();
  const titled = trimmed.match(/^(\S+)\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/);
  return titled ? titled[1] : trimmed;
}

/**
 * Classifies destination URL into internal, external, asset, or anchor.
 */
export function classifyLink(href: string): {
  type: LinkType;
  targetPath?: string;
  targetAnchor?: string;
} {
  const trimmed = href.trim();

  if (trimmed.startsWith("#")) {
    return {
      type: "anchor",
      targetAnchor: trimmed.slice(1),
    };
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("//")
  ) {
    return {
      type: "external",
      targetPath: trimmed,
    };
  }

  // Split target path and hash
  const hashIndex = trimmed.indexOf("#");
  const targetPath = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
  const targetAnchor =
    hashIndex === -1 ? undefined : trimmed.slice(hashIndex + 1);

  if (targetPath.startsWith("/stash/")) {
    return {
      type: "internal",
      targetPath,
      targetAnchor,
    };
  }

  // Relative links pointing to markdown documents or other entries
  if (
    targetPath.endsWith(".md") ||
    targetPath.endsWith(".mdx") ||
    targetPath.startsWith("../") ||
    targetPath.startsWith("./")
  ) {
    // Check if it's an asset (image, code, media)
    const isAsset =
      /\.(png|jpe?g|gif|svg|webp|avif|ico|ts|tsx|js|jsx|json|py|sh|css|pdf|txt)$/i.test(
        targetPath,
      );

    if (isAsset) {
      return {
        type: "asset",
        targetPath,
        targetAnchor,
      };
    }

    return {
      type: "internal",
      targetPath,
      targetAnchor,
    };
  }

  // Default fallback for relative paths
  return {
    type: "internal",
    targetPath,
    targetAnchor,
  };
}

/**
 * Extracts links, images, and asset references from document body.
 */
export function extractLinks(
  body: string,
  lineOffset: number = 0,
): ContentLink[] {
  const links: ContentLink[] = [];
  const lines = body.split(/\r?\n/);

  let inCodeBlock = false;

  for (let index = 0; index < lines.length; index++) {
    const lineNumber = lineOffset + index + 1;
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    // Match Markdown images: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let imgMatch = imageRegex.exec(line);
    while (imgMatch !== null) {
      const rawUrl = splitLinkDestination(imgMatch[2]);
      const altText = imgMatch[1].trim();
      const { type, targetPath, targetAnchor } = classifyLink(rawUrl);

      // Validate link with Zod schema
      const link = contentLinkSchema.parse({
        raw: rawUrl,
        text: altText,
        type: type === "external" ? "external" : "asset",
        lineNumber,
        targetPath,
        targetAnchor,
      });
      links.push(link);
      imgMatch = imageRegex.exec(line);
    }

    // Match Markdown links: [text](url) - ignore if preceded by '!' (handled above)
    const mdLinkRegex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
    let mdMatch = mdLinkRegex.exec(line);
    while (mdMatch !== null) {
      const linkText = mdMatch[1].trim();
      const rawUrl = splitLinkDestination(mdMatch[2]);
      const { type, targetPath, targetAnchor } = classifyLink(rawUrl);

      const link = contentLinkSchema.parse({
        raw: rawUrl,
        text: linkText,
        type,
        lineNumber,
        targetPath,
        targetAnchor,
      });
      links.push(link);
      mdMatch = mdLinkRegex.exec(line);
    }

    // Match HTML / JSX <a href="..."> or <Link href="...">
    const htmlLinkRegex =
      /<(?:a|Link)[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/(?:a|Link)>/gi;
    let htmlMatch = htmlLinkRegex.exec(line);
    while (htmlMatch !== null) {
      const rawUrl = htmlMatch[1].trim();
      const text = stripMarkdown(htmlMatch[2]);
      const { type, targetPath, targetAnchor } = classifyLink(rawUrl);

      const link = contentLinkSchema.parse({
        raw: rawUrl,
        text,
        type,
        lineNumber,
        targetPath,
        targetAnchor,
      });
      links.push(link);
      htmlMatch = htmlLinkRegex.exec(line);
    }

    // Match HTML <img src="...">
    const htmlImgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let htmlImgMatch = htmlImgRegex.exec(line);
    while (htmlImgMatch !== null) {
      const rawUrl = htmlImgMatch[1].trim();
      const { type, targetPath, targetAnchor } = classifyLink(rawUrl);

      const link = contentLinkSchema.parse({
        raw: rawUrl,
        text: "Image",
        type: type === "external" ? "external" : "asset",
        lineNumber,
        targetPath,
        targetAnchor,
      });
      links.push(link);
      htmlImgMatch = htmlImgRegex.exec(line);
    }
  }

  return links;
}

/**
 * Derives a fallback description from the first readable paragraph of body text.
 */
export function deriveDescriptionFromBody(
  body: string,
  maxLength: number = 180,
): string {
  const lines = body.split(/\r?\n/);
  let inCodeBlock = false;
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    // Skip empty lines, headings, comments, imports, exports, and blockquotes
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith(">") ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export ") ||
      trimmed.startsWith("<!--") ||
      trimmed.startsWith("<") ||
      trimmed.startsWith("|")
    ) {
      if (paragraphLines.length > 0) {
        break; // Reached end of first paragraph
      }
      continue;
    }

    paragraphLines.push(trimmed);
  }

  if (paragraphLines.length === 0) {
    return "";
  }

  const rawParagraph = paragraphLines.join(" ");
  const clean = stripMarkdown(rawParagraph);

  if (clean.length <= maxLength) {
    return clean;
  }

  // Truncate at word boundary
  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}…`;
}

/**
 * Calculates estimated reading time and word count.
 */
export function calculateReadingTime(body: string): {
  minutes: number;
  words: number;
} {
  // Strip code blocks from reading time
  const stripped = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
  const plainText = stripMarkdown(stripped);
  const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return { minutes, words };
}

/**
 * Parses a raw README.mdx string, extracting frontmatter, headings, links,
 * and deriving title and description defaults.
 */
export function parseDocument(
  rawContent: string,
  slugFallback: string = "",
): ParsedDocument {
  const { frontmatterText, body, frontmatterLineOffset } =
    extractFrontmatter(rawContent);

  let frontmatter: ContentFrontmatter = {};
  let frontmatterError: { message: string; line?: number } | undefined;

  if (frontmatterText) {
    try {
      const parsed = parseYaml(frontmatterText);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        const zodResult = contentFrontmatterSchema.safeParse(parsed);
        if (zodResult.success) {
          frontmatter = zodResult.data;
        } else {
          frontmatter = parsed as ContentFrontmatter;
          const firstIssue = zodResult.error.issues[0];
          frontmatterError = {
            message: `Frontmatter field "${firstIssue.path.join(".")}": ${firstIssue.message}`,
            line: 1,
          };
        }
      } else {
        frontmatterError = {
          message: "Frontmatter must be a YAML object/dictionary",
          line: 1,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      frontmatterError = {
        message: `YAML syntax error in frontmatter: ${message}`,
        line: 1,
      };
    }
  }

  const headings = extractHeadings(body);
  const links = extractLinks(body, frontmatterLineOffset);

  // Derive title:
  // 1. Frontmatter title
  // 2. First level-1 heading (# Title)
  // 3. First heading of any level
  // 4. Formatted slug fallback
  let title = frontmatter.title?.trim() || "";
  if (!title) {
    const h1 = headings.find((h) => h.depth === 1);
    if (h1) {
      title = h1.text;
    } else if (headings.length > 0) {
      title = headings[0].text;
    } else if (slugFallback) {
      title = formatSlugToTitle(slugFallback);
    } else {
      title = "Untitled";
    }
  }

  // Derive description:
  // 1. Frontmatter description
  // 2. First readable paragraph of body
  let description = frontmatter.description?.trim() || "";
  if (!description) {
    description = deriveDescriptionFromBody(body);
  }

  const readingTime = calculateReadingTime(body);

  return {
    frontmatter,
    body,
    headings,
    links,
    title,
    description,
    readingTime,
    frontmatterError,
  };
}
