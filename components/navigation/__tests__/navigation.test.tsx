/**
 * Tests for documentation navigation components and layout primitives.
 */

import { describe, expect, it } from "bun:test";
import type * as React from "react";
import ReactDOMServer from "react-dom/server";
import { CopyMarkdownButton } from "@/components/navigation/copy-markdown-button";
import { DocsMobileHeader } from "@/components/navigation/docs-mobile-header";
import { DocsPager } from "@/components/navigation/docs-pager";
import { DocsSidebar } from "@/components/navigation/docs-sidebar";
import { DocsToc } from "@/components/navigation/docs-toc";
import { SearchTrigger } from "@/components/search/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  getAllCategories,
  getAllEntries,
  getEntryBySlug,
  getPrevNextEntries,
  getRelatedEntries,
} from "@/lib/content";
import type { ContentHeading } from "@/lib/content/types";

function renderStatic(element: React.ReactElement | null): string {
  if (!element) {
    throw new Error("Expected element to be defined");
  }
  return ReactDOMServer.renderToStaticMarkup(element);
}

describe("Table of Contents (DocsToc)", () => {
  it("renders h2 and h3 headings correctly", () => {
    const headings: ContentHeading[] = [
      { depth: 1, text: "Top Title", slug: "top-title" },
      { depth: 2, text: "Overview Section", slug: "overview-section" },
      {
        depth: 3,
        text: "Implementation Details",
        slug: "implementation-details",
      },
      { depth: 4, text: "Deep Subsection", slug: "deep-subsection" },
    ];

    const html = renderStatic(<DocsToc headings={headings} />);
    expect(html).toContain("On this page");
    expect(html).toContain("Overview Section");
    expect(html).toContain("Implementation Details");
    // h1 and h4 should be excluded from TOC
    expect(html).not.toContain("Top Title");
    expect(html).not.toContain("Deep Subsection");
    expect(html).toContain('href="#overview-section"');
    expect(html).toContain('href="#implementation-details"');
    expect(html).toContain("Scroll to top");
  });

  it("renders empty string when no h2 or h3 headings exist", () => {
    const headings: ContentHeading[] = [
      { depth: 1, text: "Single Heading", slug: "single-heading" },
    ];

    const html = renderStatic(<DocsToc headings={headings} />);
    expect(html).toBe("");
  });
});

describe("Documentation Pager (DocsPager)", () => {
  it("renders previous and next links when available", async () => {
    const entry = await getEntryBySlug("react/hooks/use-debounce");
    if (!entry) throw new Error("Entry not found");

    const { prev, next } = await getPrevNextEntries(entry.slug);
    const related = await getRelatedEntries(entry, 2);

    const html = renderStatic(
      <DocsPager
        currentEntry={entry}
        prev={prev}
        next={next}
        related={related}
      />,
    );

    if (prev) {
      expect(html).toContain("Previous");
      expect(html).toContain(prev.title);
      expect(html).toContain(prev.permalink);
    }

    if (next) {
      expect(html).toContain("Next");
      expect(html).toContain(next.title);
      expect(html).toContain(next.permalink);
    }

    expect(html).toContain("Edit or view this page on GitHub");
    expect(html).toContain("min read");
  });

  it("renders related entries section if provided", async () => {
    const entry = await getEntryBySlug("react/hooks/use-debounce");
    if (!entry) throw new Error("Entry not found");

    const entries = await getAllEntries();
    const otherEntries = entries.filter((e) => e.slug !== entry.slug);

    const html = renderStatic(
      <DocsPager
        currentEntry={entry}
        prev={null}
        next={null}
        related={otherEntries.slice(0, 2)}
      />,
    );

    expect(html).toContain("See Also &amp; Related Notes");
    for (const rel of otherEntries.slice(0, 2)) {
      expect(html).toContain(rel.title);
    }
  });
});

describe("Documentation Sidebar (DocsSidebar)", () => {
  it("renders entries, categories, and theme toggle in sidebar", async () => {
    const [entries, categories] = await Promise.all([
      getAllEntries(),
      getAllCategories(),
    ]);

    const html = renderStatic(
      <SidebarProvider defaultOpen={true}>
        <DocsSidebar entries={entries} categories={categories} />
      </SidebarProvider>,
    );

    expect(html).toContain("Stash");
    expect(html).toContain("Archive Index");
    expect(html).toContain("GitHub");
    // Theme toggle buttons in sidebar footer
    expect(html).toContain("Light theme");
    expect(html).toContain("Dark theme");
  });
});

describe("Documentation Mobile Header (DocsMobileHeader)", () => {
  it("renders mobile header with brand and search", () => {
    const html = renderStatic(
      <SidebarProvider>
        <DocsMobileHeader />
      </SidebarProvider>,
    );

    expect(html).toContain("Stash");
    expect(html).toContain("Search");
  });
});

describe("Copy Markdown Button", () => {
  it("renders copy button with text", () => {
    const html = renderStatic(
      <CopyMarkdownButton content="# Test Markdown Content" />,
    );

    expect(html).toContain("Copy Markdown");
  });
});

describe("Search Trigger Component", () => {
  it("renders header variant with keyboard shortcut badge", () => {
    const html = renderStatic(<SearchTrigger variant="header" />);
    expect(html).toContain("Search docs...");
    expect(html).toContain("⌘K");
  });

  it("renders sidebar variant with search icon", () => {
    const html = renderStatic(<SearchTrigger variant="sidebar" />);
    expect(html).toContain("Search docs...");
  });

  it("renders button variant with custom children", () => {
    const html = renderStatic(
      <SearchTrigger variant="button">Find Documentation</SearchTrigger>,
    );
    expect(html).toContain("Find Documentation");
  });
});

describe("Theme Toggle Component", () => {
  it("renders compact variant with sun and moon buttons", () => {
    const html = renderStatic(<ThemeToggle variant="compact" />);
    expect(html).toContain("Light theme");
    expect(html).toContain("Dark theme");
  });
});
