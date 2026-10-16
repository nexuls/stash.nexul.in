/**
 * Tests for the content management tool.
 *
 * Each case builds a small archive in a temporary directory and points
 * `STASH_CONTENT_DIR` at it, so the tool is exercised over a fixture with the
 * violations a real archive should never have.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FIXTURE = mkdtempSync(join(tmpdir(), "stash-content-"));
process.env.STASH_CONTENT_DIR = FIXTURE;

function document(path: string, frontmatter: string, body = "Body text.") {
  const dir = join(FIXTURE, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "README.mdx"),
    `---\n${frontmatter}\n---\n\n# Heading\n\n${body}\n`,
  );
  return dir;
}

type Tool = {
  model: typeof import("../model");
  order: typeof import("../commands/order");
  validate: typeof import("../commands/validate");
  frontmatter: typeof import("../frontmatter");
  manage: typeof import("../commands/manage");
  fsOps: typeof import("../fs-ops");
};

let tool: Tool;

beforeAll(async () => {
  document("01 - react/01 - hooks/01 - use-debounce", "title: useDebounce");
  document("01 - react/01 - hooks/02 - use-previous", "title: usePrevious");
  document("01 - react/02 - patterns/01 - render-props", "title: Render props");
  document(
    "01 - react/home",
    "title: React\ntags:\n  - react\n  - library",
    "See [debounce](/stash/react/hooks/use-debounce) and [native](/stash/react-native/setup).",
  );
  document("02 - typescript/01 - patterns/01 - result-type", "title: Result");
  mkdirSync(join(FIXTURE, "02 - typescript/02 - empty"), { recursive: true });

  tool = {
    model: await import("../model"),
    order: await import("../commands/order"),
    validate: await import("../commands/validate"),
    frontmatter: await import("../frontmatter"),
    manage: await import("../commands/manage"),
    fsOps: await import("../fs-ops"),
  };
});

afterAll(() => {
  rmSync(FIXTURE, { recursive: true, force: true });
});

describe("the content model", () => {
  test("derives routes, stripping order prefixes", () => {
    const archive = tool.model.loadArchive();

    expect(archive.bySlug.get("react/hooks/use-debounce")?.route).toBe(
      "/stash/react/hooks/use-debounce",
    );
    expect(archive.byDirPath.get("01 - react/01 - hooks")?.route).toBeNull();
  });

  test("serves a home directory at its category's route", () => {
    const archive = tool.model.loadArchive();
    const home = archive.byDirPath.get("01 - react/home");

    expect(home?.kind).toBe("index");
    expect(home?.route).toBe("/stash/react");
  });

  test("resolves a path on disk, as a slug, and as a route", () => {
    const archive = tool.model.loadArchive();
    const expected = "01 - react/01 - hooks/01 - use-debounce";

    for (const query of [
      expected,
      `content/${expected}`,
      "react/hooks/use-debounce",
      "/stash/react/hooks/use-debounce",
      "stash/react/hooks/use-debounce",
    ]) {
      expect(tool.model.resolveNode(archive, query)?.dirPath).toBe(expected);
    }

    expect(tool.model.resolveNode(archive, "react/hooks/nothing")).toBeNull();
  });

  test("reads the order and the next free number", () => {
    const archive = tool.model.loadArchive();
    const hooks = archive.bySlug.get("react/hooks");

    expect(hooks?.children.map((child) => child.order)).toEqual([1, 2]);
    expect(tool.model.nextOrder(archive, hooks ?? null)).toBe(3);
    // A home directory is not numbered, so it does not count toward the next.
    expect(
      tool.model.nextOrder(archive, archive.bySlug.get("react") ?? null),
    ).toBe(3);
  });

  test("refuses a name a sibling already holds", () => {
    const archive = tool.model.loadArchive();
    const hooks = archive.bySlug.get("react/hooks") ?? null;

    expect(
      tool.model.findSlugConflict(archive, hooks, "use-previous")?.name,
    ).toBe("02 - use-previous");
    expect(tool.model.findSlugConflict(archive, hooks, "use-event")).toBeNull();
  });

  test("formats a directory name from an order and a slug", () => {
    expect(tool.model.formatDirectoryName(3, "hooks")).toBe("03 - hooks");
    expect(tool.model.formatDirectoryName(12, "hooks")).toBe("12 - hooks");
    expect(tool.model.formatDirectoryName(null, "hooks")).toBe("hooks");
  });
});

describe("ordering", () => {
  test("numbers a group 1..n in the order given", () => {
    const archive = tool.model.loadArchive();
    const hooks = archive.bySlug.get("react/hooks");
    const reversed = [...(hooks?.children ?? [])].reverse();

    expect(tool.order.renamesFor(reversed)).toEqual([
      { from: "02 - use-previous", to: "01 - use-previous" },
      { from: "01 - use-debounce", to: "02 - use-debounce" },
    ]);
  });

  test("strips every number when clearing a group", () => {
    const archive = tool.model.loadArchive();
    const hooks = archive.bySlug.get("react/hooks");

    expect(tool.order.renamesClearing(hooks?.children ?? [])).toEqual([
      { from: "01 - use-debounce", to: "use-debounce" },
      { from: "02 - use-previous", to: "use-previous" },
    ]);
  });

  test("leaves a category's home page out of the numbering", () => {
    const archive = tool.model.loadArchive();
    const react = archive.bySlug.get("react") ?? null;

    expect(
      tool.order.orderableChildren(archive, react).map((node) => node.name),
    ).toEqual(["01 - hooks", "02 - patterns"]);
  });

  test("rotates a group without colliding halfway", () => {
    const parent = join(FIXTURE, "01 - react/01 - hooks");
    tool.fsOps.applyRenames(parent, [
      { from: "01 - use-debounce", to: "02 - use-debounce" },
      { from: "02 - use-previous", to: "01 - use-previous" },
    ]);

    const archive = tool.model.loadArchive();
    expect(
      archive.bySlug.get("react/hooks")?.children.map((child) => child.name),
    ).toEqual(["01 - use-previous", "02 - use-debounce"]);

    // Put the fixture back, so the order cases above stay independent.
    tool.fsOps.applyRenames(parent, [
      { from: "01 - use-previous", to: "02 - use-previous" },
      { from: "02 - use-debounce", to: "01 - use-debounce" },
    ]);
  });
});

describe("the structural pass", () => {
  test("accepts the fixture apart from its one empty directory", () => {
    const report = tool.validate.checkStructure(tool.model.loadArchive());

    expect(report.errors).toBe(0);
    expect(report.issues.map((issue) => issue.rule)).toEqual([
      "empty-category",
    ]);
  });

  test("reports a name that is not kebab-case", () => {
    mkdirSync(join(FIXTURE, "01 - react/03 - Bad Name"), { recursive: true });
    const report = tool.validate.checkStructure(tool.model.loadArchive());
    const issue = report.issues.find(
      (candidate) => candidate.rule === "path-kebab-case",
    );

    expect(issue?.severity).toBe("error");
    expect(issue?.suggestion).toContain("03 - bad-name");

    rmSync(join(FIXTURE, "01 - react/03 - Bad Name"), { recursive: true });
  });

  test("reports two documents claiming one route", () => {
    document("01 - react/01 - hooks/09 - use-debounce", "title: Duplicate");
    const report = tool.validate.checkStructure(tool.model.loadArchive());

    expect(
      report.issues.filter((issue) => issue.rule === "duplicate-route"),
    ).toHaveLength(1);

    rmSync(join(FIXTURE, "01 - react/01 - hooks/09 - use-debounce"), {
      recursive: true,
    });
  });

  test("reports two siblings claiming one number", () => {
    document("01 - react/02 - patterns/01 - compound", "title: Compound");
    const report = tool.validate.checkStructure(tool.model.loadArchive());
    const issue = report.issues.find(
      (candidate) => candidate.rule === "duplicate-order",
    );

    expect(issue?.severity).toBe("warning");
    expect(issue?.suggestion).toContain("order renumber react/patterns");

    rmSync(join(FIXTURE, "01 - react/02 - patterns/01 - compound"), {
      recursive: true,
    });
  });

  test("reports a home directory at the root, which the loader reads as a note", () => {
    document("home", "title: Root");
    const archive = tool.model.loadArchive();
    const report = tool.validate.checkStructure(archive);

    // `discovery.ts` only treats `home` as an index below the top level, so
    // this one is a note at /stash/home rather than an index of anything.
    expect(archive.byDirPath.get("home")?.kind).toBe("note");
    expect(archive.byDirPath.get("home")?.route).toBe("/stash/home");
    expect(report.issues.map((issue) => issue.rule)).toContain("root-index");

    rmSync(join(FIXTURE, "home"), { recursive: true });
  });

  test("reports a numbered home directory as pointless, not broken", () => {
    document("02 - typescript/01 - patterns/01 - home", "title: Numbered");
    const archive = tool.model.loadArchive();
    const report = tool.validate.checkStructure(archive);
    const issue = report.issues.find(
      (candidate) => candidate.rule === "numbered-index",
    );

    // The number is stripped before the segment is compared to `home`, so this
    // is still the category's index page.
    expect(
      archive.byDirPath.get("02 - typescript/01 - patterns/01 - home")?.route,
    ).toBe("/stash/typescript/patterns");
    expect(issue?.severity).toBe("warning");

    rmSync(join(FIXTURE, "02 - typescript/01 - patterns/01 - home"), {
      recursive: true,
    });
  });

  test("reports numbering that skips", () => {
    document("01 - react/09 - skipped", "title: Skipped");
    const notes = tool.validate.checkNumbering(tool.model.loadArchive());

    expect(notes.join("\n")).toContain("01 - react");

    rmSync(join(FIXTURE, "01 - react/09 - skipped"), { recursive: true });
  });
});

describe("frontmatter", () => {
  test("sets a field without disturbing the list beside it", () => {
    const archive = tool.model.loadArchive();
    const home = archive.byDirPath.get("01 - react/home");
    if (!home) throw new Error("fixture is missing the react home page");

    const updated = tool.frontmatter.withFrontmatter(home, {
      title: "React, revised",
      updated: "2026-01-01",
    });

    expect(updated).toContain("title: React, revised");
    expect(updated).toContain("updated: 2026-01-01");
    expect(updated).toContain("  - react\n  - library");
    expect(updated.startsWith("---\n")).toBe(true);
  });

  test("replaces a list in block style", () => {
    const archive = tool.model.loadArchive();
    const home = archive.byDirPath.get("01 - react/home");
    if (!home) throw new Error("fixture is missing the react home page");

    const updated = tool.frontmatter.withFrontmatter(home, {
      tags: ["one", "two"],
    });

    expect(updated).toContain("tags:\n  - one\n  - two");
    expect(updated).not.toContain("[one, two]");
  });

  test("gives a document with no frontmatter one", () => {
    const dir = join(FIXTURE, "02 - typescript/03 - bare");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "README.mdx"), "# Bare\n\nNo frontmatter here.\n");

    const archive = tool.model.loadArchive();
    const bare = archive.byDirPath.get("02 - typescript/03 - bare");
    if (!bare) throw new Error("fixture is missing the bare document");

    const updated = tool.frontmatter.withFrontmatter(bare, { title: "Bare" });

    expect(updated).toBe(
      "---\ntitle: Bare\n---\n\n# Bare\n\nNo frontmatter here.\n",
    );

    rmSync(dir, { recursive: true });
  });
});

describe("link rewriting", () => {
  test("finds the documents linking into a route", () => {
    const archive = tool.model.loadArchive();
    const inbound = tool.manage.inboundLinks(
      archive,
      "/stash/react/hooks/use-debounce",
    );

    expect(inbound).toHaveLength(1);
    expect(inbound[0]?.from.dirPath).toBe("01 - react/home");
    expect(inbound[0]?.link.lineNumber).toBeGreaterThan(0);
  });

  test("rewrites a route without touching one that merely starts the same", async () => {
    const archive = tool.model.loadArchive();
    const changed = await tool.manage.rewriteLinks(
      archive,
      "/stash/react",
      "/stash/reactjs",
      { dryRun: false },
    );

    const raw = readFileSync(
      join(FIXTURE, "01 - react/home/README.mdx"),
      "utf-8",
    );

    expect(changed).toHaveLength(1);
    expect(raw).toContain("/stash/reactjs/hooks/use-debounce");
    expect(raw).toContain("/stash/react-native/setup");

    // Put the link back for any case that runs after this one.
    await tool.manage.rewriteLinks(
      tool.model.loadArchive(),
      "/stash/reactjs",
      "/stash/react",
      { dryRun: false },
    );
  });

  test("changes nothing on a dry run", async () => {
    const before = readFileSync(
      join(FIXTURE, "01 - react/home/README.mdx"),
      "utf-8",
    );

    await tool.manage.rewriteLinks(
      tool.model.loadArchive(),
      "/stash/react",
      "/stash/elsewhere",
      { dryRun: true },
    );

    expect(
      readFileSync(join(FIXTURE, "01 - react/home/README.mdx"), "utf-8"),
    ).toBe(before);
  });
});

describe("routes under a node", () => {
  test("lists every document a move would re-route", () => {
    const archive = tool.model.loadArchive();
    const react = archive.bySlug.get("react");
    if (!react) throw new Error("fixture is missing the react domain");

    expect(tool.manage.routesUnder(react).sort()).toEqual([
      "/stash/react",
      "/stash/react/hooks/use-debounce",
      "/stash/react/hooks/use-previous",
      "/stash/react/patterns/render-props",
    ]);
  });
});
