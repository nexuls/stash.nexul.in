/**
 * The interactive app.
 *
 * One loop per level, each reading the archive fresh when it draws, so what is
 * on screen is what is on disk. A cancel inside a flow steps back to its menu
 * rather than ending the session; a cancel at a menu leaves.
 */

import { intro, outro } from "@clack/prompts";
import {
  printRoutes,
  printSearch,
  printStats,
  printTree,
  searchArchive,
  showNode,
} from "./commands/browse";
import { categoryFlow, documentFlow, homeFlow } from "./commands/create";
import type { ManageOptions } from "./commands/manage";
import {
  copyFlow,
  frontmatterFlow,
  moveFlow,
  removeFlow,
  renameFlow,
} from "./commands/manage";
import { orderFlow } from "./commands/order";
import { runFullValidation, runValidation } from "./commands/validate";
import { gitStaged } from "./fs-ops";
import { type Archive, documentsUnder, loadArchive } from "./model";
import { askSelect, askText, filters, isBack, log, pc, pickNode } from "./ui";

type Section = "browse" | "create" | "order" | "manage" | "validate" | "quit";

function headline(archive: Archive): string {
  const documents = archive.all.filter((node) => node.kind !== "category");
  const categories = archive.all.filter((node) => node.kind === "category");
  const staged = gitStaged().length;

  return [
    `${documents.length} documents`,
    `${categories.length} categories`,
    `${archive.roots.length} domains`,
    ...(staged > 0
      ? [pc.yellow(`${staged} uncommitted change${staged === 1 ? "" : "s"}`)]
      : []),
  ].join(pc.dim(" · "));
}

async function browseSection(): Promise<void> {
  while (true) {
    const archive = loadArchive();
    const action = await askSelect<
      "tree" | "show" | "stats" | "routes" | "search" | "back"
    >({
      message: "Browse",
      options: [
        { value: "tree", label: "Tree", hint: "the archive in content order" },
        {
          value: "show",
          label: "Show a document",
          hint: "frontmatter, assets, headings",
        },
        {
          value: "stats",
          label: "Stats",
          hint: "totals as the build sees them",
        },
        {
          value: "routes",
          label: "Routes",
          hint: "every URL the build will emit",
        },
        {
          value: "search",
          label: "Search",
          hint: "find a note by its contents",
        },
        { value: "back", label: "← Back" },
      ],
    });
    if (isBack(action) || action === "back") return;

    if (action === "tree") {
      const root = await pickNode({
        message: "Which part?",
        archive,
        filter: filters.categories,
        includeRoot: true,
        rootLabel: "content/ (everything)",
      });
      if (isBack(root)) continue;
      printTree(archive, root);
    }

    if (action === "show") {
      const node = await pickNode({ message: "Which one?", archive });
      if (isBack(node) || !node) continue;
      showNode(node);
    }

    if (action === "stats") printStats(archive);
    if (action === "routes") printRoutes(archive);

    if (action === "search") {
      const query = await askText({
        message: "Search for",
        placeholder: "useEffect",
      });
      if (isBack(query) || !query.trim()) continue;
      printSearch(searchArchive(archive, query.trim()), query.trim());
    }
  }
}

async function createSection(options: ManageOptions): Promise<void> {
  while (true) {
    const archive = loadArchive();
    const action = await askSelect<
      "document" | "category" | "domain" | "home" | "back"
    >({
      message: "Create",
      options: [
        {
          value: "document",
          label: "Document",
          hint: "a note: a directory with README.mdx",
        },
        { value: "category", label: "Category", hint: "a directory of notes" },
        { value: "domain", label: "Domain", hint: "a top-level category" },
        {
          value: "home",
          label: "Category home page",
          hint: "an authored page for a directory",
        },
        { value: "back", label: "← Back" },
      ],
    });
    if (isBack(action) || action === "back") return;

    if (action === "document") await documentFlow(archive, options);
    if (action === "category") await categoryFlow(archive, options);
    if (action === "domain") await categoryFlow(archive, options, null);
    if (action === "home") await homeFlow(archive, options);
  }
}

async function manageSection(options: ManageOptions): Promise<void> {
  while (true) {
    const archive = loadArchive();
    const action = await askSelect<
      "move" | "rename" | "copy" | "remove" | "frontmatter" | "back"
    >({
      message: "Manage",
      options: [
        {
          value: "move",
          label: "Move",
          hint: "changes every route underneath",
        },
        { value: "rename", label: "Rename", hint: "changes the slug" },
        {
          value: "copy",
          label: "Copy",
          hint: "duplicates the directory and its assets",
        },
        {
          value: "remove",
          label: "Remove",
          hint: "deletes a document or category",
        },
        {
          value: "frontmatter",
          label: "Edit frontmatter",
          hint: "title, description, tags, dates",
        },
        { value: "back", label: "← Back" },
      ],
    });
    if (isBack(action) || action === "back") return;

    if (action === "move") await moveFlow(archive, options);
    if (action === "rename") await renameFlow(archive, options);
    if (action === "copy") await copyFlow(archive, options);
    if (action === "remove") await removeFlow(archive, options);
    if (action === "frontmatter") await frontmatterFlow(archive, options);
  }
}

async function validateSection(): Promise<void> {
  while (true) {
    const action = await askSelect<"quick" | "numbering" | "full" | "back">({
      message: "Validate",
      options: [
        {
          value: "quick",
          label: "Structure and content",
          hint: "naming, routes, frontmatter, links",
        },
        {
          value: "numbering",
          label: "Numbering",
          hint: "gaps and mixed groups",
        },
        {
          value: "full",
          label: "Everything",
          hint: "adds Biome, TypeScript and tests",
        },
        { value: "back", label: "← Back" },
      ],
    });
    if (isBack(action) || action === "back") return;

    if (action === "quick") await runValidation();
    if (action === "numbering")
      await runValidation({ structureOnly: true, numbering: true });
    if (action === "full") await runFullValidation();
  }
}

export async function runTui(options: ManageOptions): Promise<void> {
  intro(
    `${pc.bgCyan(pc.black(" stash "))} ${pc.dim("content/ is the source of truth — paths are routes")}`,
  );

  if (options.dryRun) {
    log.warn("Dry run: every change will be printed and none will be written.");
  }

  while (true) {
    const archive = loadArchive();
    log.message(headline(archive));

    const section = await askSelect<Section>({
      message: "What are we doing?",
      options: [
        {
          value: "browse",
          label: "Browse",
          hint: "tree, documents, stats, search",
        },
        {
          value: "create",
          label: "Create",
          hint: "document, category, domain, home page",
        },
        { value: "order", label: "Order", hint: "arrange a group, renumber" },
        {
          value: "manage",
          label: "Manage",
          hint: "move, rename, copy, remove, frontmatter",
        },
        {
          value: "validate",
          label: "Validate",
          hint: "structure, content, lint, types, tests",
        },
        { value: "quit", label: "Quit" },
      ],
    });

    if (isBack(section) || section === "quit") {
      outro("Done.");
      return;
    }

    if (section === "browse") await browseSection();
    if (section === "create") await createSection(options);
    if (section === "order") await orderFlow(loadArchive(), options);
    if (section === "manage") await manageSection(options);
    if (section === "validate") await validateSection();
  }
}

export { documentsUnder };
