/**
 * Automated test suite for the landing page's archive index.
 *
 * Verifies that entries are grouped into the directory structure the landing
 * page draws, that the model carries only presentable metadata, and that the
 * index filter narrows and re-counts correctly.
 *
 * Notable: Executed via Bun's native test runner (`bun test`).
 */

import { describe, expect, it } from "bun:test";
import { buildArchiveIndex, filterArchive } from "../archive-index";
import {
  getAllEntries,
  getAllSlugs,
  getCategoryIndexes,
  getEntryBySlug,
} from "../discovery";

const entries = await getAllEntries();
const categoryIndexes = await getCategoryIndexes();
const index = buildArchiveIndex(entries, categoryIndexes);

describe("buildArchiveIndex", () => {
  it("counts every discovered note once", () => {
    expect(index.noteCount).toBe(entries.length);

    const grouped = index.domains.reduce(
      (sum, domain) =>
        sum + domain.groups.reduce((n, group) => n + group.notes.length, 0),
      0,
    );
    expect(grouped).toBe(entries.length);
  });

  it("groups notes under the directory that holds them", () => {
    const react = index.domains.find((domain) => domain.slug === "react");
    expect(react).toBeDefined();

    const hooks = react?.groups.find((group) => group.path === "react/hooks");
    expect(hooks?.label).toBe("Hooks");
    expect(hooks?.notes.length).toBeGreaterThan(0);
    expect(
      hooks?.notes.every((note) =>
        note.permalink.startsWith("/stash/react/hooks/"),
      ),
    ).toBe(true);
  });

  it("leads with the domain holding the most notes", () => {
    const counts = index.domains.map((domain) => domain.noteCount);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it("orders directories and notes alphabetically", () => {
    for (const domain of index.domains) {
      const labelled = domain.groups
        .map((group) => group.label)
        .filter((label): label is string => label !== null);
      expect(labelled).toEqual(
        [...labelled].sort((a, b) => a.localeCompare(b)),
      );

      for (const group of domain.groups) {
        const titles = group.notes.map((note) => note.title);
        expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
      }
    }
  });

  it("applies known casing to domain labels", () => {
    const typescript = index.domains.find(
      (domain) => domain.slug === "typescript",
    );
    expect(typescript?.label).toBe("TypeScript");
  });

  it("keeps a note sitting directly in its domain in an unlabelled group", () => {
    const showcase = index.domains.find((domain) => domain.slug === "showcase");
    expect(showcase?.groups).toHaveLength(1);
    expect(showcase?.groups[0]?.label).toBeNull();
    expect(showcase?.groups[0]?.path).toBe("showcase");
  });

  it("carries presentable metadata only, never MDX source", () => {
    const note = index.domains[0]?.groups[0]?.notes[0];
    expect(note).toBeDefined();
    expect(Object.keys(note ?? {}).sort()).toEqual([
      "date",
      "description",
      "haystack",
      "permalink",
      "title",
    ]);
    expect(note?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("reports the most recent edit across every note", () => {
    const newest = entries
      .map((entry) => entry.updated ?? entry.date)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .reduce((latest, time) => Math.max(latest, time), 0);

    expect(index.lastUpdated).toBe(
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(newest),
    );
  });
});

describe("filterArchive", () => {
  it("returns the index untouched for an empty query", () => {
    expect(filterArchive(index.domains, "   ")).toBe(index.domains);
  });

  it("matches a note by its path", () => {
    const result = filterArchive(index.domains, "react/hooks/use-debounce");
    expect(result).toHaveLength(1);
    expect(result[0]?.groups[0]?.notes[0]?.title).toBe("useDebounce Hook");
  });

  it("requires every term to match, in any order", () => {
    const ordered = filterArchive(index.domains, "hooks debounce");
    const reversed = filterArchive(index.domains, "debounce hooks");
    expect(ordered).toEqual(reversed);
    expect(ordered).toHaveLength(1);
  });

  it("matches a tag that appears nowhere in the visible text", () => {
    // "notifications" is a tag on the toast note; its title says "Notification".
    const result = filterArchive(index.domains, "notifications");
    expect(result).toHaveLength(1);
    expect(result[0]?.groups[0]?.notes[0]?.title).toBe(
      "Toast Notification Stack",
    );
  });

  it("restates each domain's count for what survived", () => {
    const result = filterArchive(index.domains, "hook");
    for (const domain of result) {
      const actual = domain.groups.reduce((n, g) => n + g.notes.length, 0);
      expect(domain.noteCount).toBe(actual);
    }
  });

  it("drops domains and directories left empty", () => {
    const result = filterArchive(index.domains, "hooks");
    expect(result.every((domain) => domain.groups.length > 0)).toBe(true);
    expect(
      result.every((domain) =>
        domain.groups.every((group) => group.notes.length > 0),
      ),
    ).toBe(true);
  });

  it("returns nothing when no note matches", () => {
    expect(filterArchive(index.domains, "quantum teleportation")).toEqual([]);
  });
});

describe("category index entries", () => {
  it("keeps `home` entries out of the notes", async () => {
    expect(entries.every((entry) => !entry.isCategoryIndex)).toBe(true);

    const withIndexes = await getAllEntries({ includeCategoryIndexes: true });
    expect(withIndexes.length).toBeGreaterThan(entries.length);
    expect(withIndexes.some((entry) => entry.isCategoryIndex)).toBe(true);
  });

  it("serves a category index at its category's path", () => {
    const react = categoryIndexes.get("react");
    expect(react?.isCategoryIndex).toBe(true);
    expect(react?.permalink).toBe("/stash/react");
    // The slug still names the directory on disk, which assets are served under.
    expect(react?.slug).toBe("react/home");
    expect(react?.categories).toEqual(["react"]);
  });

  it("resolves the category path to its index entry", async () => {
    const entry = await getEntryBySlug(["react"]);
    expect(entry?.isCategoryIndex).toBe(true);
    expect(entry?.permalink).toBe("/stash/react");
  });

  it("generates the category path and not the directory behind it", async () => {
    const slugs = (await getAllSlugs()).map((segments) => segments.join("/"));
    expect(slugs).toContain("react");
    expect(slugs).not.toContain("react/home");
    expect(slugs).toContain("react/hooks/use-debounce");
  });

  it("titles and describes a domain from its index entry", () => {
    const react = index.domains.find((domain) => domain.slug === "react");
    expect(react?.href).toBe("/stash/react");
    expect(react?.label).toBe(categoryIndexes.get("react")?.title);
    expect(react?.description).toBe(
      categoryIndexes.get("react")?.description ?? null,
    );
    expect(react?.description).toBeTruthy();
  });

  it("falls back to the directory name when a category has no index", () => {
    const bare = buildArchiveIndex(entries);
    const react = bare.domains.find((domain) => domain.slug === "react");
    expect(react?.label).toBe("React");
    expect(react?.description).toBeNull();
    expect(react?.href).toBe("/stash/react");
  });
});
