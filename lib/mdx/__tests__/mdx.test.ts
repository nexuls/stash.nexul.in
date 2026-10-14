import { describe, expect, it } from "bun:test";
import type * as React from "react";
import ReactDOMServer from "react-dom/server";
import { formatLanguageLabel } from "@/components/mdx/code-block";
import {
  baseMdxComponents,
  createMdxComponents,
} from "@/components/mdx/registry";
import { getAllEntries } from "@/lib/content";
import { renderMdx } from "@/lib/mdx/renderer";
import {
  calloutPropsSchema,
  codeBlockPropsSchema,
  detailsPropsSchema,
  normalizeCalloutType,
  tabPropsSchema,
  tabsPropsSchema,
} from "@/lib/mdx/types";

function renderStatic(element: React.ReactElement | null): string {
  if (!element) {
    throw new Error("Expected element to be defined");
  }
  return ReactDOMServer.renderToStaticMarkup(element);
}

describe("MDX Zod Schemas & Prop Validation", () => {
  it("validates calloutPropsSchema and normalizes callout types", () => {
    const validDefault = calloutPropsSchema.parse({});
    expect(validDefault.type).toBe("note");

    const validWarning = calloutPropsSchema.parse({
      type: "warning",
      title: "Warning Notice",
    });
    expect(validWarning.type).toBe("warning");
    expect(validWarning.title).toBe("Warning Notice");

    // Aliases
    expect(normalizeCalloutType("info")).toBe("note");
    expect(normalizeCalloutType("caution")).toBe("danger");
    expect(normalizeCalloutType("tip")).toBe("tip");
    expect(normalizeCalloutType("unknown")).toBe("note");

    // Invalid enum rejection
    const invalid = calloutPropsSchema.safeParse({ type: "non-existent" });
    expect(invalid.success).toBe(false);
  });

  it("validates tabsPropsSchema and tabPropsSchema", () => {
    const validTabs = tabsPropsSchema.parse({
      items: ["Bun", "npm"],
      defaultValue: "Bun",
    });
    expect(validTabs.items).toEqual(["Bun", "npm"]);
    expect(validTabs.defaultValue).toBe("Bun");

    const validTab = tabPropsSchema.parse({
      value: "bun",
      label: "Bun",
    });
    expect(validTab.value).toBe("bun");
    expect(validTab.label).toBe("Bun");
  });

  it("validates detailsPropsSchema requiring a non-empty summary", () => {
    const valid = detailsPropsSchema.parse({
      summary: "Click to see more",
      defaultOpen: true,
    });
    expect(valid.summary).toBe("Click to see more");
    expect(valid.defaultOpen).toBe(true);

    const invalid = detailsPropsSchema.safeParse({ summary: "" });
    expect(invalid.success).toBe(false);
  });

  it("validates codeBlockPropsSchema with defaults", () => {
    const parsed = codeBlockPropsSchema.parse({
      code: "const x = 1;",
    });
    expect(parsed.language).toBe("text");
    expect(parsed.showLineNumbers).toBe(false);

    const full = codeBlockPropsSchema.parse({
      code: "const y = 2;",
      language: "typescript",
      filename: "test.ts",
      showLineNumbers: true,
      highlightLines: [1],
    });
    expect(full.language).toBe("typescript");
    expect(full.filename).toBe("test.ts");
    expect(full.showLineNumbers).toBe(true);
    expect(full.highlightLines).toEqual([1]);
  });
});

describe("Language Label Formatter", () => {
  it("formats language tags into clean labels", () => {
    expect(formatLanguageLabel("ts")).toBe("TypeScript");
    expect(formatLanguageLabel("tsx")).toBe("TSX");
    expect(formatLanguageLabel("js")).toBe("JavaScript");
    expect(formatLanguageLabel("bash")).toBe("Terminal");
    expect(formatLanguageLabel("sh")).toBe("Terminal");
    expect(formatLanguageLabel("diff")).toBe("Diff");
    expect(formatLanguageLabel("json")).toBe("JSON");
    expect(formatLanguageLabel("yaml")).toBe("YAML");
    expect(formatLanguageLabel("py")).toBe("Python");
    expect(formatLanguageLabel("custom")).toBe("CUSTOM");
    expect(formatLanguageLabel()).toBe("Text");
  });
});

describe("Server-Side MDX Rendering & Shiki Code Presentation", () => {
  it("evaluates basic markdown elements", async () => {
    const source = `
# Title

This is a **bold** paragraph.

- Item 1
- Item 2
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("<h1");
    expect(html).toContain("Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<ul");
    expect(html).toContain("Item 1");
    expect(html).toContain("Item 2");
  });

  it("processes fenced code blocks with syntax highlighting and Shiki themes", async () => {
    const source = `
\`\`\`typescript
const greeting: string = "hello world";
\`\`\`
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("data-rehype-pretty-code-figure");
    expect(html).toContain('data-language="typescript"');
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
    expect(html).toContain("stash-code-block");
  });

  it("extracts filename and displays title header in code blocks", async () => {
    const source = `
\`\`\`ts title="lib/debounce.ts"
export function debounce() {}
\`\`\`
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("lib/debounce.ts");
    expect(html).toContain("TypeScript");
  });

  it("supports line numbers and line highlighting", async () => {
    const source = `
\`\`\`ts showLineNumbers {2}
const a = 1;
const b = 2;
const c = 3;
\`\`\`
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("data-line-numbers");
    expect(html).toContain("data-highlighted-line");
  });

  it("formats terminal blocks with bash and shell labels", async () => {
    const source = `
\`\`\`bash
bun add next-mdx-remote-client
\`\`\`
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("Terminal");
    expect(html).toContain("next-mdx-remote-client");
  });

  it("formats diff blocks with addition and deletion lines", async () => {
    const source = `
\`\`\`diff
+ const added = true;
- const removed = false;
\`\`\`
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain('data-language="diff"');
  });
});

describe("Registered MDX Custom Components", () => {
  it("renders Callout component with different types", async () => {
    const source = `
<Callout type="note" title="Author Note">
  This is note text.
</Callout>

<Callout type="tip">
  This is tip text.
</Callout>

<Callout type="warning">
  Watch out!
</Callout>
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain('data-callout-type="note"');
    expect(html).toContain("Author Note");
    expect(html).toContain('data-callout-type="tip"');
    expect(html).toContain("Tip");
    expect(html).toContain('data-callout-type="warning"');
    expect(html).toContain('role="alert"');
  });

  it("renders Tabs and Tab components", async () => {
    const source = `
<Tabs items={["Bun", "npm"]}>
  <Tab value="Bun">bun install</Tab>
  <Tab value="npm">npm install</Tab>
</Tabs>
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("bun install");
  });

  it("renders Details disclosure component", async () => {
    const source = `
<Details summary="View advanced options" defaultOpen={true}>
  <p>Here are the advanced options.</p>
</Details>
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("View advanced options");
    expect(html).toContain("Here are the advanced options.");
  });

  it("renders standalone CodeBlock component", async () => {
    const source = `
<CodeBlock
  code="const x: number = 42;"
  language="typescript"
  filename="demo.ts"
  showLineNumbers={true}
  highlightLines={[1]}
/>
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("demo.ts");
    expect(html).toContain("const x: number = 42;");
    expect(html).toContain("data-line-numbers");
    expect(html).toContain("data-highlighted-line");
  });
});

describe("Author Diagnostic Error Handling & Fallbacks", () => {
  it("gracefully catches unregistered MDX components with informative fallback banner", async () => {
    const source = `
# Sample Guide

<NonExistentWidget customProp="test" />
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain('data-unregistered-component="NonExistentWidget"');
    expect(html).toContain("Unregistered MDX Component");
    expect(html).toContain("&lt;NonExistentWidget /&gt;");
    expect(html).toContain("Callout");
    expect(html).toContain("Tabs");
  });

  it("catches malformed MDX syntax errors and renders MdxError banner", async () => {
    // Intentionally broken JSX syntax (unclosed tag)
    const source = `
# Broken MDX

<Callout type="note"
`;
    const { content, error } = await renderMdx({
      source,
      sourcePath: "content/broken/README.mdx",
    });
    expect(error).toBeDefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("Failed to render MDX document");
    expect(html).toContain("content/broken/README.mdx");
  });

  it("verifies base component registry contains all core primitives", () => {
    expect(baseMdxComponents.Callout).toBeDefined();
    expect(baseMdxComponents.Tabs).toBeDefined();
    expect(baseMdxComponents.Tab).toBeDefined();
    expect(baseMdxComponents.Details).toBeDefined();
    expect(baseMdxComponents.CodeBlock).toBeDefined();
    expect(baseMdxComponents.CopyButton).toBeDefined();

    const registry = createMdxComponents();
    expect(registry.Callout).toBeDefined();
    expect(registry.h1).toBeDefined();
    expect(registry.pre).toBeDefined();
    expect(registry.figure).toBeDefined();
  });
});

describe("Real Content Filesystem Rendering", () => {
  it("evaluates all discovered filesystem content entries without error", async () => {
    const entries = await getAllEntries();
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      const { content, error } = await renderMdx({
        source: entry.body,
        sourcePath: entry.filePath,
      });
      expect(error).toBeUndefined();
      expect(content).not.toBeNull();

      const html = renderStatic(content);
      expect(html.length).toBeGreaterThan(50);
    }
  });
});
