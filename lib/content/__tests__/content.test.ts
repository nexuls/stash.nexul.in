/**
 * Automated test suite for the Stash content engine.
 *
 * Verifies Markdown parsing, heading extraction, anchor generation, frontmatter handling,
 * asset discovery, and build-time validation failure modes.
 *
 * Notable: Executed via Bun's native test runner (`bun test`).
 */

import { describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { siteConfig, siteConfigSchema } from "../../site-config";
import {
  getAllCategories,
  getAllEntries,
  getAllSlugs,
  getAllTags,
  getContentDirectory,
  getEntryBySlug,
} from "../discovery";
import {
  classifyLink,
  deriveDescriptionFromBody,
  extractFrontmatter,
  extractHeadings,
  extractLinks,
  formatSlugToTitle,
  parseDocument,
  slugifyHeading,
  stripMarkdown,
} from "../parser";
import { contentAssetSchema, contentFrontmatterSchema } from "../types";
import {
  isKebabCase,
  kebabCaseSegmentSchema,
  suggestKebabCase,
  validateContent,
} from "../validator";

describe("Markdown & Parser Utilities", () => {
  it("slugifyHeading generates clean, url-safe heading slugs", () => {
    expect(slugifyHeading("Hello World!")).toBe("hello-world");
    expect(slugifyHeading("useDebounce(value, delay)")).toBe(
      "usedebouncevalue-delay",
    );
    expect(slugifyHeading("  Trimmed & Cleaned -- Heading  ")).toBe(
      "trimmed-cleaned-heading",
    );
  });

  it("formatSlugToTitle generates readable title from slug", () => {
    expect(formatSlugToTitle("use-debounce")).toBe("Use Debounce");
    expect(formatSlugToTitle("react/hooks/use-local-storage")).toBe(
      "Use Local Storage",
    );
  });

  it("stripMarkdown removes inline markdown markup", () => {
    const raw =
      "This is **bold**, *italic*, and `code` with [a link](https://example.com).";
    expect(stripMarkdown(raw)).toBe(
      "This is bold, italic, and code with a link.",
    );
  });

  it("extractHeadings extracts headings and skips code blocks", () => {
    const markdown = `
# Title

Some text.

\`\`\`markdown
# Not A Real Heading
\`\`\`

## Section One
Content...

### Subsection
More content...

## Section One
Duplicate heading test.
`;
    const headings = extractHeadings(markdown);
    expect(headings.length).toBe(4);
    expect(headings[0]).toEqual({ depth: 1, text: "Title", slug: "title" });
    expect(headings[1]).toEqual({
      depth: 2,
      text: "Section One",
      slug: "section-one",
    });
    expect(headings[2]).toEqual({
      depth: 3,
      text: "Subsection",
      slug: "subsection",
    });
    expect(headings[3]).toEqual({
      depth: 2,
      text: "Section One",
      slug: "section-one-1",
    });
  });

  it("extractFrontmatter separates frontmatter from body", () => {
    const content = `---
title: Sample Post
tags: ["a", "b"]
---

# Real Content
Here is the body.`;

    const { frontmatterText, body } = extractFrontmatter(content);
    expect(frontmatterText).toContain("title: Sample Post");
    expect(body.trim()).toBe("# Real Content\nHere is the body.");
  });

  it("classifyLink correctly identifies link types", () => {
    expect(classifyLink("https://google.com").type).toBe("external");
    expect(classifyLink("#heading-anchor").type).toBe("anchor");
    expect(classifyLink("/stash/react/hooks/use-debounce").type).toBe(
      "internal",
    );
    expect(classifyLink("./diagram.svg").type).toBe("asset");
    expect(classifyLink("../other-entry").type).toBe("internal");
  });

  it("extractLinks captures links, assets, and line numbers", () => {
    const content = `
Line 1
[Internal Link](/stash/react/hooks/use-debounce)
Line 3
![Asset](./preview.png)
Line 5
<a href="https://example.com">External</a>
`;
    const links = extractLinks(content);
    expect(links.length).toBe(3);
    expect(links[0].type).toBe("internal");
    expect(links[0].lineNumber).toBe(3);
    expect(links[1].type).toBe("asset");
    expect(links[1].lineNumber).toBe(5);
    expect(links[2].type).toBe("external");
    expect(links[2].lineNumber).toBe(7);
  });

  it("deriveDescriptionFromBody extracts first paragraph and strips markdown", () => {
    const body = `
# Main Heading

> A blockquote that should be ignored.

This is the **first real** paragraph with a [link](https://test.com). It should become the description.

This is the second paragraph.
`;
    const desc = deriveDescriptionFromBody(body);
    expect(desc).toBe(
      "This is the first real paragraph with a link. It should become the description.",
    );
  });

  it("parseDocument handles missing frontmatter with sensible defaults", () => {
    const raw = `# Auto Discovered Title

This is the auto discovered description for the document.
`;
    const parsed = parseDocument(raw, "react/hooks/my-hook");
    expect(parsed.title).toBe("Auto Discovered Title");
    expect(parsed.description).toBe(
      "This is the auto discovered description for the document.",
    );
  });
});

describe("Content Discovery", () => {
  it("discovers real entries in the content directory", async () => {
    const entries = await getAllEntries();
    expect(entries.length).toBeGreaterThanOrEqual(3);

    const slugs = entries.map((e) => e.slug);
    expect(slugs).toContain("react/hooks/use-debounce");
    expect(slugs).toContain("react/components/command-menu");
    expect(slugs).toContain("typescript/patterns/result-type");
  });

  it("getEntryBySlug retrieves entry by slug string or array", async () => {
    const entry1 = await getEntryBySlug("react/hooks/use-debounce");
    expect(entry1).not.toBeNull();
    expect(entry1?.title).toBe("useDebounce Hook");
    expect(entry1?.category).toBe("react");
    expect(entry1?.categories).toEqual(["react", "hooks"]);

    const entry2 = await getEntryBySlug(["react", "hooks", "use-debounce"]);
    expect(entry2?.slug).toBe("react/hooks/use-debounce");

    const missing = await getEntryBySlug("does/not/exist");
    expect(missing).toBeNull();
  });

  it("discovers adjacent assets", async () => {
    const entry = await getEntryBySlug("react/hooks/use-debounce");
    if (!entry) {
      throw new Error("Expected entry to exist");
    }
    const assetNames = entry.assets.map((a) => a.filename);
    expect(assetNames).toContain("use-debounce.ts");
    expect(assetNames).toContain("debounce-diagram.svg");

    const codeAsset = entry.assets.find(
      (a) => a.filename === "use-debounce.ts",
    );
    expect(codeAsset?.type).toBe("code");

    const imageAsset = entry.assets.find(
      (a) => a.filename === "debounce-diagram.svg",
    );
    expect(imageAsset?.type).toBe("image");
  });

  it("getAllCategories groups entries correctly", async () => {
    const categories = await getAllCategories();
    expect(categories.length).toBeGreaterThanOrEqual(2);
    const catSlugs = categories.map((c) => c.slug);
    expect(catSlugs).toContain("react");
    expect(catSlugs).toContain("typescript");
  });

  it("getAllTags aggregates all tags", async () => {
    const tags = await getAllTags();
    expect(tags).toContain("react");
    expect(tags).toContain("hooks");
    expect(tags).toContain("typescript");
  });

  it("getAllSlugs returns segment arrays", async () => {
    const slugs = await getAllSlugs();
    expect(slugs.some((s) => s.join("/") === "react/hooks/use-debounce")).toBe(
      true,
    );
  });
});

describe("Zod Schemas and Validation", () => {
  it("contentFrontmatterSchema validates correct frontmatter and rejects invalid data", () => {
    const valid = contentFrontmatterSchema.safeParse({
      title: "Valid Title",
      tags: ["react", "hooks"],
      draft: false,
      date: "2026-10-02",
      order: 1,
    });
    expect(valid.success).toBe(true);

    const invalidTags = contentFrontmatterSchema.safeParse({
      tags: "not-an-array",
    });
    expect(invalidTags.success).toBe(false);

    const invalidDraft = contentFrontmatterSchema.safeParse({
      draft: "not-a-bool",
    });
    expect(invalidDraft.success).toBe(false);

    const invalidDate = contentFrontmatterSchema.safeParse({
      date: "not-a-date",
    });
    expect(invalidDate.success).toBe(false);
  });

  it("kebabCaseSegmentSchema enforces lowercase kebab-case", () => {
    expect(kebabCaseSegmentSchema.safeParse("kebab-case-1").success).toBe(true);
    expect(kebabCaseSegmentSchema.safeParse("InvalidSegment").success).toBe(
      false,
    );
    expect(kebabCaseSegmentSchema.safeParse("has spaces").success).toBe(false);
  });

  it("contentAssetSchema validates asset metadata", () => {
    const validAsset = contentAssetSchema.safeParse({
      filename: "test.ts",
      relativePath: "test.ts",
      absolutePath: "/path/to/test.ts",
      type: "code",
      size: 100,
      extension: ".ts",
    });
    expect(validAsset.success).toBe(true);

    const invalidAsset = contentAssetSchema.safeParse({
      filename: "test.ts",
      type: "unknown-type",
    });
    expect(invalidAsset.success).toBe(false);
  });

  it("siteConfig adheres to siteConfigSchema", () => {
    expect(siteConfigSchema.safeParse(siteConfig).success).toBe(true);
  });
});

describe("Content Validation", () => {
  it("validates existing content successfully with no errors", async () => {
    const result = await validateContent();
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error").length).toBe(0);
  });

  it("isKebabCase and suggestKebabCase work as expected", () => {
    expect(isKebabCase("valid-kebab-123")).toBe(true);
    expect(isKebabCase("InvalidName")).toBe(false);
    expect(isKebabCase("with spaces")).toBe(false);
    expect(isKebabCase("with_underscores")).toBe(false);

    expect(suggestKebabCase("InvalidName")).toBe("invalid-name");
    expect(suggestKebabCase("with spaces")).toBe("with-spaces");
    expect(suggestKebabCase("with_underscores")).toBe("with-underscores");
  });

  it("catches broken internal links and missing assets in a temporary test directory", async () => {
    const tempDir = join(getContentDirectory(), "../.temp-test-content");
    rmSync(tempDir, { recursive: true, force: true });
    mkdirSync(join(tempDir, "invalid-entry"), { recursive: true });

    // Create entry with broken link, broken anchor, missing asset, and invalid frontmatter
    writeFileSync(
      join(tempDir, "invalid-entry", "README.mdx"),
      `---
title: Test Entry
tags: "not-an-array"
draft: "not-a-bool"
---

# Test Heading

Link to nowhere: [Broken](/stash/non-existent-route)
Link to missing anchor: [#non-existent-heading](#non-existent-heading)
Link to missing asset: ![Missing](./missing-asset.png)
`,
    );

    const result = await validateContent(tempDir);
    expect(result.valid).toBe(false);

    const rules = result.issues.map((i) => i.rule);
    expect(rules).toContain("invalid-tags-field");
    expect(rules).toContain("invalid-draft-field");
    expect(rules).toContain("broken-internal-link");
    expect(rules).toContain("broken-anchor-link");
    expect(rules).toContain("missing-asset");

    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("catches malformed YAML frontmatter", async () => {
    const tempDir = join(getContentDirectory(), "../.temp-test-content-yaml");
    rmSync(tempDir, { recursive: true, force: true });
    mkdirSync(join(tempDir, "broken-yaml"), { recursive: true });

    writeFileSync(
      join(tempDir, "broken-yaml", "README.mdx"),
      `---
title: "Unclosed string
key: : invalid
---

# Content
`,
    );

    const result = await validateContent(tempDir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.rule === "malformed-metadata")).toBe(
      true,
    );

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("catches leaf directories missing README.mdx", async () => {
    const tempDir = join(
      getContentDirectory(),
      "../.temp-test-content-missing-readme",
    );
    rmSync(tempDir, { recursive: true, force: true });
    mkdirSync(join(tempDir, "orphan-dir"), { recursive: true });

    writeFileSync(
      join(tempDir, "orphan-dir", "code.ts"),
      "export const x = 1;",
    );

    const result = await validateContent(tempDir);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.rule === "missing-document")).toBe(true);

    rmSync(tempDir, { recursive: true, force: true });
  });
});
