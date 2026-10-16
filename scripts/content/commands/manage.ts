/**
 * Moving, renaming, copying and removing content, and editing frontmatter.
 *
 * These are the operations that change routes, so each one shows the routes it
 * will change and the documents that link to them before anything moves. The
 * inbound links come from `entry.links` — the same extraction the validator
 * uses — so they carry line numbers and are not a text search for a slug.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type ContentEntry,
  type ContentLink,
  suggestKebabCase,
} from "../../../lib/content";
import { stripOrderPrefix } from "../../../lib/content/ordering";
import {
  documentPath,
  fieldDisplay,
  readFrontmatter,
  today,
  withFrontmatter,
} from "../frontmatter";
import {
  copyDirectory,
  moveDirectory,
  plan,
  planAsync,
  type RunOptions,
  removeDirectory,
  repoPath,
  writeFile,
} from "../fs-ops";
import {
  type Archive,
  CONTENT_DIR,
  type ContentNode,
  displayName,
  documentsUnder,
  ENTRY_FILE,
  findSlugConflict,
  formatDirectoryName,
  loadArchive,
  loadNodeEntry,
  nextOrder,
  quickTitle,
} from "../model";
import {
  askConfirm,
  askSelect,
  askText,
  type Back,
  filters,
  interactive,
  isBack,
  log,
  notePanel,
  pc,
  pickNode,
} from "../ui";

export interface ManageOptions extends RunOptions {
  /** Standing permission for a destructive step with nobody at a terminal. */
  yes: boolean;
}

// --- Routes and links ---------------------------------------------------------

/** Every route under a node: what a move or a removal affects. */
export function routesUnder(node: ContentNode): string[] {
  return documentsUnder(node)
    .map((document) => document.route)
    .filter((route): route is string => Boolean(route));
}

export interface InboundLink {
  from: ContentNode;
  entry: ContentEntry;
  link: ContentLink;
}

/**
 * Documents linking into a route or anything under it, with the line each link
 * sits on.
 */
export function inboundLinks(
  archive: Archive,
  route: string,
  exclude?: ContentNode,
): InboundLink[] {
  const found: InboundLink[] = [];

  for (const node of archive.all) {
    if (node.kind === "category") continue;
    if (
      exclude &&
      (node.dirPath === exclude.dirPath ||
        node.dirPath.startsWith(`${exclude.dirPath}/`))
    ) {
      continue;
    }
    const entry = loadNodeEntry(node);
    if (!entry) continue;

    for (const link of entry.links) {
      if (link.type !== "internal" || !link.targetPath) continue;
      if (
        link.targetPath === route ||
        link.targetPath.startsWith(`${route}/`)
      ) {
        found.push({ from: node, entry, link });
      }
    }
  }

  return found;
}

function routeBoundaryPattern(route: string): RegExp {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A route ends where a path separator, an anchor, a quote, a bracket or
  // whitespace begins; without that guard, /stash/react would also match
  // /stash/react-native.
  return new RegExp(`${escaped}(?=[/#)\\s"'\`\\]]|$)`, "g");
}

/**
 * Rewrites `/stash/<old>` to `/stash/<new>` wherever the archive mentions it,
 * and returns the files it changed. It reports rather than logs, so a caller
 * decides what the reader sees.
 *
 * The replacement is textual on purpose: link extraction sees Markdown links,
 * but a route also appears in JSX props such as `<LinkCard href="…">`, and
 * those have to move too.
 */
export async function rewriteLinks(
  archive: Archive,
  oldRoute: string,
  newRoute: string,
  options: RunOptions,
): Promise<string[]> {
  if (oldRoute === newRoute) return [];
  const pattern = routeBoundaryPattern(oldRoute);
  const changed: string[] = [];

  for (const node of archive.all) {
    if (node.kind === "category") continue;
    const file = join(node.absPath, ENTRY_FILE);
    let raw: string;
    try {
      raw = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    pattern.lastIndex = 0;
    if (!pattern.test(raw)) continue;
    pattern.lastIndex = 0;

    const updated = raw.replace(pattern, newRoute);
    await planAsync(
      options,
      `relink content/${node.dirPath}/${ENTRY_FILE}`,
      () => writeFile(file, updated),
    );
    changed.push(file);
  }

  return changed;
}

/** Shows what a path change does to routes, and offers to fix the links. */
async function reportAndRelink(
  before: { node: ContentNode; routes: string[]; route: string | null },
  newSlug: string,
  options: ManageOptions,
): Promise<void> {
  const oldSlug = before.node.slug;
  if (oldSlug === newSlug) {
    log.success("Routes are unchanged — only the numbering differs.");
    return;
  }

  const refreshed = loadArchive();
  const oldRoute = `/stash/${oldSlug}`;
  const newRoute = `/stash/${newSlug}`;

  const changedRoutes = before.routes.map(
    (route) =>
      `${pc.dim(route)}\n  ${pc.green(`→ ${route.replace(oldRoute, newRoute)}`)}`,
  );
  if (changedRoutes.length > 0) {
    notePanel(
      changedRoutes.join("\n"),
      `${changedRoutes.length} route${changedRoutes.length === 1 ? "" : "s"} changed`,
    );
  }

  const linkers = inboundLinks(refreshed, oldRoute);
  if (linkers.length === 0) return;

  notePanel(
    linkers
      .map(
        (inbound) =>
          `${pc.dim(`${inbound.from.slug}:${inbound.link.lineNumber}`)}  ${inbound.link.targetPath}`,
      )
      .join("\n"),
    `${linkers.length} link${linkers.length === 1 ? "" : "s"} now point nowhere`,
  );

  if (!interactive() && !options.yes) {
    log.warn(`Links still point at ${oldRoute}. Pass --yes to rewrite them.`);
    return;
  }

  if (interactive()) {
    const confirmed = await askConfirm({
      message: "Rewrite them to the new route?",
      initialValue: true,
    });
    if (isBack(confirmed) || !confirmed) {
      log.warn(
        "Left as they were; content validation will fail until they are fixed.",
      );
      return;
    }
  }

  const changed = await rewriteLinks(refreshed, oldRoute, newRoute, options);
  for (const file of changed) log.success(`Relinked ${repoPath(file)}`);
}

// --- Shared prompts -----------------------------------------------------------

async function askDestination(
  archive: Archive,
  node: ContentNode,
  message: string,
): Promise<ContentNode | null | Back> {
  return pickNode({
    message,
    archive,
    filter: filters.categories,
    includeRoot: true,
    rootLabel: "content/ (a domain of its own)",
    exclude: (candidate) =>
      candidate.dirPath === node.dirPath ||
      candidate.dirPath.startsWith(`${node.dirPath}/`)
        ? "inside what you are moving"
        : null,
  });
}

async function askPlacement(
  archive: Archive,
  destination: ContentNode | null,
  node: ContentNode,
): Promise<number | null | Back> {
  const suggestion = nextOrder(archive, destination);

  // With nobody at a terminal there is nothing to ask: the directory goes last,
  // which is the answer a reader picks almost every time anyway.
  if (!interactive()) return suggestion;

  const options: {
    value: "next" | "keep" | "pick" | "none";
    label: string;
    hint?: string;
  }[] = [
    {
      value: "next",
      label: `Last — number ${String(suggestion).padStart(2, "0")}`,
    },
  ];
  if (node.order !== null) {
    options.push({
      value: "keep",
      label: `Keep ${String(node.order).padStart(2, "0")}`,
      hint: "may collide with a sibling",
    });
  }
  options.push(
    { value: "pick", label: "Choose the number" },
    { value: "none", label: "Unnumbered" },
  );

  const choice = await askSelect<"next" | "keep" | "pick" | "none">({
    message: "How should it be numbered there?",
    options,
    initialValue: "next",
  });
  if (isBack(choice)) return choice;

  if (choice === "next") return suggestion;
  if (choice === "keep") return node.order;
  if (choice === "none") return null;

  const picked = await askText({
    message: "Number",
    initialValue: String(suggestion),
    validate: (value) =>
      /^\d+$/.test(value.trim()) ? undefined : "Enter a whole number.",
  });
  if (isBack(picked)) return picked;
  return Number.parseInt(picked.trim(), 10);
}

function conflictMessage(
  archive: Archive,
  destination: ContentNode | null,
  name: string,
  ignore?: ContentNode,
): string | null {
  const conflict = findSlugConflict(archive, destination, name, ignore);
  return conflict
    ? `content/${conflict.dirPath} already takes the slug "${name}" there.`
    : null;
}

// --- Move ---------------------------------------------------------------------

export async function moveFlow(
  archive: Archive,
  options: ManageOptions,
  preselected?: ContentNode,
  destinationArg?: ContentNode | null,
): Promise<void> {
  const node =
    preselected ??
    (await pickNode({
      message: "What do you want to move?",
      archive,
      filter: filters.any,
    }));
  if (isBack(node) || !node) return;

  const destination =
    destinationArg !== undefined
      ? destinationArg
      : await askDestination(archive, node, "Where should it go?");
  if (isBack(destination)) return;

  const name = stripOrderPrefix(node.name);
  const conflict = conflictMessage(archive, destination, name, node);
  if (conflict) {
    log.error(conflict);
    return;
  }

  const order = await askPlacement(archive, destination, node);
  if (isBack(order)) return;

  const newName = formatDirectoryName(order, name);
  const newDirPath = destination
    ? `${destination.dirPath}/${newName}`
    : newName;
  const newSlug = destination ? `${destination.slug}/${name}` : name;

  const before = {
    node,
    routes: routesUnder(node),
    route: node.route,
  };

  notePanel(
    [
      `${pc.dim("from")}  content/${node.dirPath}`,
      `${pc.green("to")}    content/${newDirPath}`,
    ].join("\n"),
    "Move",
  );

  if (!options.dryRun && interactive()) {
    const confirmed = await askConfirm({
      message: "Move it?",
      initialValue: true,
    });
    if (isBack(confirmed) || !confirmed) {
      log.warn("Left alone.");
      return;
    }
  }

  plan(options, `move content/${node.dirPath} → content/${newDirPath}`, () => {
    moveDirectory(node.absPath, join(CONTENT_DIR, newDirPath));
  });

  if (options.dryRun) return;
  log.success(`Moved to content/${newDirPath}`);
  await reportAndRelink(before, newSlug, options);
}

// --- Rename -------------------------------------------------------------------

export async function renameFlow(
  archive: Archive,
  options: ManageOptions,
  preselected?: ContentNode,
  nameArg?: string,
): Promise<void> {
  const node =
    preselected ??
    (await pickNode({
      message: "What do you want to rename?",
      archive,
      filter: filters.any,
    }));
  if (isBack(node) || !node) return;

  const parent = node.parentPath
    ? (archive.byDirPath.get(node.parentPath) ?? null)
    : null;
  const current = stripOrderPrefix(node.name);

  const raw =
    nameArg ??
    (await askText({
      message: "New name",
      initialValue: current,
      validate: (value) => {
        const next = value.trim();
        if (!next) return "A name is required.";
        const suggestion = suggestKebabCase(next);
        if (suggestion !== next) return `Use kebab-case: "${suggestion}".`;
        return conflictMessage(archive, parent, next, node) ?? undefined;
      },
    }));
  if (isBack(raw)) return;

  const name = raw.trim();
  if (name === current) {
    log.success("Nothing to change.");
    return;
  }

  const conflict = conflictMessage(archive, parent, name, node);
  if (conflict) {
    log.error(conflict);
    return;
  }

  const newName = formatDirectoryName(node.order, name);
  const newDirPath = parent ? `${parent.dirPath}/${newName}` : newName;
  const newSlug = parent ? `${parent.slug}/${name}` : name;

  const before = { node, routes: routesUnder(node), route: node.route };

  notePanel(
    `${pc.dim(node.name)}\n  ${pc.green(`→ ${newName}`)}`,
    `Rename in content/${parent?.dirPath ?? "."}`,
  );

  if (!options.dryRun && interactive()) {
    const confirmed = await askConfirm({
      message: "Rename it?",
      initialValue: true,
    });
    if (isBack(confirmed) || !confirmed) {
      log.warn("Left alone.");
      return;
    }
  }

  plan(
    options,
    `rename content/${node.dirPath} → content/${newDirPath}`,
    () => {
      moveDirectory(node.absPath, join(CONTENT_DIR, newDirPath));
    },
  );

  if (options.dryRun) return;
  log.success(`Renamed to content/${newDirPath}`);
  await reportAndRelink(before, newSlug, options);
}

// --- Copy ---------------------------------------------------------------------

export async function copyFlow(
  archive: Archive,
  options: ManageOptions,
  preselected?: ContentNode,
  destinationArg?: ContentNode | null,
  nameArg?: string,
): Promise<void> {
  const node =
    preselected ??
    (await pickNode({
      message: "What do you want to copy?",
      archive,
      filter: filters.any,
    }));
  if (isBack(node) || !node) return;

  const destination =
    destinationArg !== undefined
      ? destinationArg
      : await askDestination(archive, node, "Where should the copy go?");
  if (isBack(destination)) return;

  const source = stripOrderPrefix(node.name);
  const validateCopyName = (value: string): string | undefined => {
    const next = value.trim();
    if (!next) return "A name is required.";
    const suggestion = suggestKebabCase(next);
    if (suggestion !== next) return `Use kebab-case: "${suggestion}".`;
    return conflictMessage(archive, destination, next) ?? undefined;
  };

  // A name given on the command line is validated the same way a typed one is;
  // with no name and no terminal, the copy takes the obvious one.
  const name = nameArg
    ? nameArg
    : interactive()
      ? await askText({
          message: "Name for the copy",
          initialValue: `${source}-copy`,
          validate: validateCopyName,
        })
      : `${source}-copy`;
  if (isBack(name)) return;

  const nameProblem = validateCopyName(name);
  if (nameProblem) {
    log.error(nameProblem);
    process.exitCode = 1;
    return;
  }

  const order = await askPlacement(archive, destination, node);
  if (isBack(order)) return;

  const newName = formatDirectoryName(order, name.trim());
  const newDirPath = destination
    ? `${destination.dirPath}/${newName}`
    : newName;
  const newSlug = destination
    ? `${destination.slug}/${name.trim()}`
    : name.trim();

  notePanel(
    [
      `${pc.dim("from")}  content/${node.dirPath}`,
      `${pc.green("to")}    content/${newDirPath}`,
      `${pc.dim("route")} /stash/${newSlug}`,
    ].join("\n"),
    "Copy",
  );

  if (!options.dryRun && interactive()) {
    const confirmed = await askConfirm({
      message: "Copy it?",
      initialValue: true,
    });
    if (isBack(confirmed) || !confirmed) return;
  }

  plan(options, `copy content/${node.dirPath} → content/${newDirPath}`, () => {
    copyDirectory(node.absPath, join(CONTENT_DIR, newDirPath));
  });
  if (options.dryRun) return;

  log.success(`Copied to content/${newDirPath}`);

  // A duplicated title and summary read as a mistake on the category page.
  const refreshed = loadArchive();
  const copy = refreshed.byDirPath.get(newDirPath);
  if (!copy || copy.kind === "category" || !interactive()) return;

  const retitle = await askConfirm({
    message: "Retitle the copy?",
    initialValue: true,
  });
  if (isBack(retitle) || !retitle) return;

  await frontmatterFlow(refreshed, options, copy, {
    fields: ["title", "description"],
  });
}

// --- Remove -------------------------------------------------------------------

export async function removeFlow(
  archive: Archive,
  options: ManageOptions,
  preselected?: ContentNode,
): Promise<void> {
  const node =
    preselected ??
    (await pickNode({
      message: "What do you want to remove?",
      archive,
      filter: filters.any,
    }));
  if (isBack(node) || !node) return;

  const routes = routesUnder(node);
  const linkers = node.route ? inboundLinks(archive, node.route, node) : [];

  notePanel(
    [
      `${pc.dim("path")}   content/${node.dirPath}`,
      `${pc.dim("routes")} ${routes.length === 0 ? "none" : routes.join("\n        ")}`,
      ...(linkers.length > 0
        ? [
            "",
            pc.yellow(
              `Still linked from ${linkers.length} place${linkers.length === 1 ? "" : "s"}:`,
            ),
            ...linkers.map(
              (inbound) =>
                `  ${pc.dim(`${inbound.from.slug}:${inbound.link.lineNumber}`)}`,
            ),
          ]
        : []),
    ].join("\n"),
    `Remove ${displayName(node)}`,
  );

  const name = stripOrderPrefix(node.name);

  if (interactive() && !options.dryRun) {
    const typed = await askText({
      message: `Type ${pc.bold(name)} to confirm`,
      validate: (value) =>
        value.trim() === name
          ? undefined
          : "That does not match; press Escape to cancel.",
    });
    if (isBack(typed)) {
      log.warn("Left alone.");
      return;
    }
  } else if (!options.dryRun && !options.yes) {
    log.error("Removing content needs a terminal to confirm at, or --yes.");
    process.exitCode = 1;
    return;
  }

  plan(options, `remove content/${node.dirPath}`, () => {
    removeDirectory(node.absPath);
  });

  if (options.dryRun) return;
  log.success(`Removed content/${node.dirPath}`);
  log.message(
    pc.dim(
      "Staged in git: `git restore --staged` then `git checkout` brings it back.",
    ),
  );
}

// --- Frontmatter --------------------------------------------------------------

const EDITABLE_FIELDS = [
  "title",
  "description",
  "tags",
  "date",
  "updated",
  "draft",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function frontmatterFlow(
  archive: Archive,
  options: ManageOptions,
  preselected?: ContentNode,
  config: { fields?: EditableField[] } = {},
): Promise<void> {
  const node =
    preselected ??
    (await pickNode({
      message: "Which document?",
      archive,
      filter: filters.documents,
    }));
  if (isBack(node) || !node) return;
  if (node.kind === "category") {
    log.error(`content/${node.dirPath} holds no ${ENTRY_FILE}.`);
    return;
  }

  const queue = config.fields ? [...config.fields] : null;

  while (true) {
    const frontmatter = readFrontmatter(node);

    if (!queue) {
      notePanel(
        EDITABLE_FIELDS.map(
          (field) =>
            `${pc.dim(field.padEnd(12))} ${fieldDisplay(frontmatter, field) || pc.dim("—")}`,
        ).join("\n"),
        `${quickTitle(node)} · ${repoPath(documentPath(node))}`,
      );
    }

    const field = queue
      ? queue.shift()
      : await askSelect<EditableField | "stamp" | "done">({
          message: "Which field?",
          options: [
            { value: "title", label: "Title" },
            { value: "description", label: "Description" },
            { value: "tags", label: "Tags", hint: "comma separated" },
            { value: "date", label: "Date" },
            {
              value: "stamp",
              label: "Stamp updated with today",
              hint: today(),
            },
            { value: "draft", label: "Toggle draft" },
            { value: "done", label: "← Back" },
          ],
        });

    if (field === undefined || isBack(field) || field === "done") return;

    let changes: Record<string, string | boolean | string[] | undefined> = {};

    if (field === "stamp") {
      changes = { updated: today() };
    } else if (field === "draft") {
      changes = { draft: frontmatter.draft === true ? undefined : true };
    } else if (field === "tags") {
      const current = fieldDisplay(frontmatter, "tags");
      const value = await askText({ message: "Tags", initialValue: current });
      if (isBack(value)) return;
      changes = {
        tags: value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
    } else {
      const current = fieldDisplay(frontmatter, field);
      const value = await askText({
        message: field.charAt(0).toUpperCase() + field.slice(1),
        initialValue: current,
      });
      if (isBack(value)) return;
      if (value.trim() === current) continue;
      changes = { [field]: value.trim() || undefined };
    }

    const updated = withFrontmatter(node, changes);
    await planAsync(
      options,
      `update frontmatter in content/${node.dirPath}/${ENTRY_FILE}`,
      () => writeFile(documentPath(node), updated),
    );

    const label = field === "stamp" ? "updated" : field;
    log.success(`Set ${label}.`);

    if (queue && queue.length === 0) return;
  }
}
