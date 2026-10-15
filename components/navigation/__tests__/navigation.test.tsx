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
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  getAllEntries,
  getEntryBySlug,
  getPrevNextEntries,
  getRelatedEntries,
} from "@/lib/content";
import {
  buildNavTree,
  countNavEntries,
  filterNavTree,
  findFirstNavEntry,
  getActiveDomain,
  getActiveTrail,
  getNavDomains,
} from "@/lib/content/nav-tree";
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
  it("renders the brand, filter, domain tree, and footer controls", async () => {
    const entries = await getAllEntries();

    const html = renderStatic(
      <SidebarProvider defaultOpen={true}>
        <DocsSidebar entries={entries} />
      </SidebarProvider>,
    );

    expect(html).toContain("Stash");
    expect(html).toContain("Filter notes");
    expect(html).toContain("GitHub");
    // The theme control in the sidebar footer, one button covering both themes.
    expect(html).toContain('data-theme-option="light"');
    expect(html).toContain('data-theme-option="dark"');
  });

  it("scopes the tree to the active domain and counts its notes", async () => {
    const entries = await getAllEntries();
    const domains = getNavDomains(buildNavTree(entries));
    const firstDomain = domains[0];
    if (!firstDomain) throw new Error("Expected at least one domain");

    const html = renderStatic(
      <SidebarProvider defaultOpen={true}>
        <DocsSidebar entries={entries} />
      </SidebarProvider>,
    );

    // The switcher shows the active domain and its note count.
    expect(html).toContain(firstDomain.slug);
    expect(html).toContain(`${firstDomain.entryCount} notes`);

    // Notes from other domains stay out of the scoped tree.
    const otherDomain = domains.find((d) => d.slug !== firstDomain.slug);
    if (otherDomain) {
      const foreign = findFirstNavEntry(otherDomain.nodes);
      if (foreign) expect(html).not.toContain(foreign.entry.permalink);
    }
  });
});

describe("Domain derivation (getNavDomains / getActiveDomain)", () => {
  it("builds one domain per top-level content directory", async () => {
    const entries = await getAllEntries();
    const domains = getNavDomains(buildNavTree(entries));

    const expected = new Set(
      entries.map((entry) => entry.categories[0]).filter(Boolean),
    );
    expect(domains.map((domain) => domain.slug).sort()).toEqual(
      [...expected].sort(),
    );

    for (const domain of domains) {
      expect(domain.entryCount).toBe(countNavEntries(domain.nodes));
      expect(domain.firstPermalink.startsWith("/stash/")).toBe(true);
    }
  });

  it("resolves the active domain from the route", async () => {
    const entries = await getAllEntries();
    const domains = getNavDomains(buildNavTree(entries));

    expect(
      getActiveDomain(domains, "/stash/react/hooks/use-debounce")?.slug,
    ).toBe("react");
    expect(getActiveDomain(domains, "/stash/typescript")?.slug).toBe(
      "typescript",
    );
    // The archive index has no domain of its own, so the first one opens.
    expect(getActiveDomain(domains, "/stash")?.slug).toBe(domains[0]?.slug);
  });
});

describe("Navigation tree derivation (buildNavTree)", () => {
  it("nests entries under their directory path and counts them", async () => {
    const entries = await getAllEntries();
    const tree = buildNavTree(entries);

    expect(countNavEntries(tree)).toBe(entries.length);

    const react = tree.find(
      (node) => node.kind === "group" && node.id === "react",
    );
    expect(react?.kind).toBe("group");
    if (react?.kind !== "group") throw new Error("Expected a react group");

    // content/react/hooks/use-debounce and content/react/components/command-menu
    expect(react.children.every((child) => child.kind === "group")).toBe(true);
    expect(react.entryCount).toBe(
      entries.filter((entry) => entry.categories[0] === "react").length,
    );
  });

  it("filters by path, title, and tag, pruning empty groups", async () => {
    const entries = await getAllEntries();
    const tree = buildNavTree(entries);

    const byPath = filterNavTree(tree, "hooks");
    expect(countNavEntries(byPath)).toBeGreaterThan(0);
    expect(
      byPath.every((node) => node.kind === "group" && node.id === "react"),
    ).toBe(true);

    const byTitle = filterNavTree(tree, "debounce");
    expect(countNavEntries(byTitle)).toBe(1);
    expect(findFirstNavEntry(byTitle)?.entry.slug).toBe(
      "react/hooks/use-debounce",
    );

    expect(countNavEntries(filterNavTree(tree, "zzz-no-such-note"))).toBe(0);
  });

  it("resolves the group trail leading to the active entry", async () => {
    const entries = await getAllEntries();

    expect(getActiveTrail(entries, "/stash/react/hooks/use-debounce")).toEqual([
      "react",
      "react/hooks",
    ]);
    expect(getActiveTrail(entries, "/stash/nope")).toEqual([]);
  });
});

describe("Sidebar Trigger (SidebarTrigger)", () => {
  it("renders toggle button within sidebar provider", () => {
    const html = renderStatic(
      <SidebarProvider defaultOpen={false}>
        <SidebarTrigger />
      </SidebarProvider>,
    );

    expect(html).toContain("Toggle Sidebar");
  });

  it("renders toggle button when sidebar is open", () => {
    const html = renderStatic(
      <SidebarProvider defaultOpen={true}>
        <SidebarTrigger />
      </SidebarProvider>,
    );

    expect(html).toContain("Toggle Sidebar");
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

    expect(html).toContain("copy markdown");
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
  it("renders the compact group as a single button", () => {
    const html = renderStatic(<ThemeToggle variant="compact" />);

    // The group reads as a set of choices but acts as one control, so there is
    // exactly one hit target and one tab stop in it.
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('data-theme-option="light"');
    expect(html).toContain('data-theme-option="dark"');
    expect(html).toContain("Switch theme");
  });

  it("leaves the system theme out of the compact group by default", () => {
    const html = renderStatic(<ThemeToggle variant="compact" />);
    expect(html).not.toContain('data-theme-option="system"');
  });

  it("adds the system theme to the compact group on request", () => {
    const html = renderStatic(<ThemeToggle variant="compact" showSystem />);

    expect(html).toContain('data-theme-option="system"');
    expect(html.match(/<button/g)).toHaveLength(1);
  });
});
