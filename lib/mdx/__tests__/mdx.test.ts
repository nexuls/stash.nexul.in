import { describe, expect, it } from "bun:test";
import type * as React from "react";
import ReactDOMServer from "react-dom/server";
import { formatLanguageLabel } from "@/components/mdx/code-block";
import {
  baseMdxComponents,
  createMdxComponents,
} from "@/components/mdx/registry";
import { getAllEntries } from "@/lib/content";
import {
  isEntryRelative,
  resolveEntryUrl,
} from "@/lib/mdx/plugins/remark-entry-assets";
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
This is a **bold** paragraph.

- Item 1
- Item 2

## A section

Another paragraph.
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();
    expect(content).not.toBeNull();

    const html = renderStatic(content);
    expect(html).toContain("bold</strong>");
    expect(html).toContain("<ul");
    expect(html).toContain("Item 1");
    expect(html).toContain("Item 2");
    expect(html).toContain("<h2");
  });

  it("drops a leading title heading, which the route renders as the masthead", async () => {
    const { content } = await renderMdx({
      source: "# useDebounce Hook\n\nDebouncing delays invoking a function.",
    });

    const html = renderStatic(content);
    expect(html).not.toContain("useDebounce Hook");
    expect(html).toContain("Debouncing delays invoking a function.");
  });

  it("keeps a top-level heading that is not the first block", async () => {
    const { content } = await renderMdx({
      source: "Some opening prose.\n\n# Later section\n",
    });

    const html = renderStatic(content);
    expect(html).toContain("Later section");
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
    expect(html).toContain('data-language="typescript"');
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
    expect(html).toContain("stash-code");
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
    // The title is split so the directory can be de-emphasised.
    expect(html).toContain("lib/");
    expect(html).toContain("debounce.ts");
    // Metadata is lifted onto the figure at compile time.
    expect(html).toContain('data-language="ts"');
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
    expect(html).toContain("lucide-terminal");
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
    // Diff lines are marked structurally rather than matched on token colour.
    expect(html).toContain('data-diff="add"');
    expect(html).toContain('data-diff="del"');
    expect(html).toContain("+1");
    expect(html).toContain("1");
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
    expect(html).toContain('data-callout="note"');
    expect(html).toContain("Author Note");
    expect(html).toContain('data-callout="tip"');
    expect(html).toContain("Tip");
    expect(html).toContain('data-callout="warning"');
    // Each variant carries its hue as a single custom property.
    expect(html).toContain("--callout:var(--warn)");
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
    expect(html).toContain("data-line-numbers");
    expect(html).toContain("data-highlighted-line");
    // The JSX form is lowered to a fence, so it is highlighted like any other
    // code block rather than rendered as flat text.
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--stash-line-digits:1");
  });

  it("leaves a CodeBlock with a computed `code` prop to the component", async () => {
    const source = `
export const snippet = "const a = 1;";

<CodeBlock code={snippet} language="typescript" />
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();

    const html = renderStatic(content);
    expect(html).toContain("const a = 1;");
    expect(html).not.toContain("--shiki-light");
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
    expect(html).toContain("This entry could not be compiled");
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

describe("Entry-relative asset resolution", () => {
  it("resolves relative references against the entry directory", () => {
    const base = "/content-assets/react/hooks/use-debounce";

    expect(resolveEntryUrl(base, "./diagram.svg")).toBe(`${base}/diagram.svg`);
    expect(resolveEntryUrl(base, "diagram.svg")).toBe(`${base}/diagram.svg`);
    expect(resolveEntryUrl(base, "./nested/shot.png")).toBe(
      `${base}/nested/shot.png`,
    );
    expect(resolveEntryUrl(base, "../use-previous/notes.ts")).toBe(
      "/content-assets/react/hooks/use-previous/notes.ts",
    );
    expect(resolveEntryUrl(base, "./source.ts#L10")).toBe(
      `${base}/source.ts#L10`,
    );
  });

  it("leaves absolute, rooted and anchor references alone", () => {
    expect(isEntryRelative("/stash/react/hooks/use-debounce")).toBe(false);
    expect(isEntryRelative("#installation")).toBe(false);
    expect(isEntryRelative("https://example.com/a.png")).toBe(false);
    expect(isEntryRelative("mailto:someone@example.com")).toBe(false);
    expect(isEntryRelative("./diagram.svg")).toBe(true);
  });

  it("rewrites image and link URLs during compilation", async () => {
    const source = `
![Pipeline](./demo-diagram.svg "How it fits together")

See [the source](./use-debounce.ts) and [another entry](/stash/react/hooks/use-previous).
`;
    const { content, error } = await renderMdx({
      source,
      assetBaseUrl: "/content-assets/react/hooks/use-debounce",
    });
    expect(error).toBeUndefined();

    const html = renderStatic(content);
    expect(html).toContain(
      "/content-assets/react/hooks/use-debounce/demo-diagram.svg",
    );
    expect(html).toContain(
      "/content-assets/react/hooks/use-debounce/use-debounce.ts",
    );
    // Rooted internal links are untouched.
    expect(html).toContain('href="/stash/react/hooks/use-previous"');
  });

  it("promotes a standalone image to a captioned figure", async () => {
    const source = `![Pipeline](./demo.svg "How it fits together")`;
    const { content } = await renderMdx({
      source,
      assetBaseUrl: "/content-assets/demo",
    });

    const html = renderStatic(content);
    expect(html).toContain("<figure");
    expect(html).toContain("<figcaption");
    expect(html).toContain("How it fits together");
  });

  it("keeps an image inside a sentence inline", async () => {
    const source = `Logo ![mark](./mark.svg) in a sentence.`;
    const { content } = await renderMdx({
      source,
      assetBaseUrl: "/content-assets/demo",
    });

    const html = renderStatic(content);
    expect(html).not.toContain("<figure");
    expect(html).toContain("align-text-bottom");
  });
});

describe("Compiled code metadata", () => {
  it("reports line count and collapses a long block", async () => {
    const lines = Array.from({ length: 40 }, (_, i) => `const v${i} = ${i};`);
    const source = ["```ts", ...lines, "```"].join("\n");

    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();

    const html = renderStatic(content);
    expect(html).toContain("40 lines");
    expect(html).toContain('data-collapsed="true"');
    expect(html).toContain("Show all 40 lines");
  });

  it("leaves a short block expanded and offers no collapse control", async () => {
    const source = "```ts\nconst a = 1;\n```";
    const { content } = await renderMdx({ source });

    const html = renderStatic(content);
    expect(html).toContain('data-collapsed="false"');
    expect(html).not.toContain("Show all");
  });

  it("sizes the line-number gutter from the widest number", async () => {
    const lines = Array.from({ length: 12 }, (_, i) => `const v${i} = ${i};`);
    const source = ["```ts showLineNumbers", ...lines, "```"].join("\n");

    const { content } = await renderMdx({ source });
    const html = renderStatic(content);
    expect(html).toContain("--stash-line-digits:2");
  });
});

describe("Document components", () => {
  it("renders Steps as a numbered sequence", async () => {
    const source = `
<Steps>
  <Step title="Install">Add the dependency.</Step>
  <Step title="Configure">Register the plugin.</Step>
</Steps>
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();

    const html = renderStatic(content);
    expect(html).toContain("<ol");
    expect(html).toContain("Install");
    expect(html).toContain("Configure");
    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
  });

  it("renders a FileTree of folders and files", async () => {
    const source = `
<FileTree>
  <Folder name="content">
    <File name="README.mdx" highlight comment="entry document" />
  </Folder>
</FileTree>
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();

    const html = renderStatic(content);
    expect(html).toContain("content");
    expect(html).toContain("README.mdx");
    expect(html).toContain("entry document");
  });

  it("renders a PropsTable and reports a malformed one", async () => {
    const good = `
<PropsTable
  of="Callout"
  rows={[{ name: "type", type: "string", default: "note", description: "Which notice to show." }]}
/>
`;
    const { content } = await renderMdx({ source: good });
    const html = renderStatic(content);
    expect(html).toContain("type");
    expect(html).toContain("default note");
    expect(html).toContain("Which notice to show.");

    const bad = `<PropsTable rows={[]} />`;
    const broken = renderStatic((await renderMdx({ source: bad })).content);
    expect(broken).toContain("Malformed PropsTable");
  });

  it("renders LinkCard with internal and external destinations", async () => {
    const source = `
<CardGrid>
  <LinkCard href="/stash/react/hooks/use-debounce" title="useDebounce" eyebrow="react/hooks" />
  <LinkCard href="https://mdxjs.com" title="MDX" description="The format itself." />
</CardGrid>
`;
    const { content, error } = await renderMdx({ source });
    expect(error).toBeUndefined();

    const html = renderStatic(content);
    expect(html).toContain('href="/stash/react/hooks/use-debounce"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("react/hooks");
  });

  it("styles GFM task lists and keeps the checked state readable", async () => {
    const source = `
- [x] Done
- [ ] Pending
`;
    const { content } = await renderMdx({ source });
    const html = renderStatic(content);
    expect(html).toContain("stash-task-checkbox");
    expect(html).toContain("checked");
    expect(html).toContain("contains-task-list");
  });

  it("gives every heading an anchor", async () => {
    const source = `
## Section one

### Nested heading
`;
    const { content } = await renderMdx({ source });
    const html = renderStatic(content);
    expect(html).toContain('href="#section-one"');
    expect(html).toContain('href="#nested-heading"');
    expect(html).toContain("Link to this section");
  });
});
