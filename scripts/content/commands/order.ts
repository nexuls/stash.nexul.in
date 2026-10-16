/**
 * Ordering: the numbers in front of directory names.
 *
 * A prefix is sorting information only — `lib/content/ordering` strips it
 * before the segment becomes a slug, a route or a label — so renumbering a
 * group cannot change a URL. That is the property that makes reordering safe
 * enough to do from a menu, and every flow here says so before it acts.
 *
 * A `home` directory is left out of the numbering: it is the category's
 * heading, not one of its notes.
 */

import { join } from "node:path";
import { stripOrderPrefix } from "../../../lib/content/ordering";
import { applyRenames, plan, type RunOptions } from "../fs-ops";
import {
  type Archive,
  CONTENT_DIR,
  type ContentNode,
  childrenOf,
  displayName,
  formatDirectoryName,
  loadArchive,
} from "../model";
import {
  askConfirm,
  askSelect,
  type Back,
  interactive,
  isBack,
  log,
  notePanel,
  pc,
  pickNode,
  renderGroup,
  renderRenames,
} from "../ui";

export interface Rename {
  from: string;
  to: string;
}

/** The group a reorder acts on: siblings, minus the category's home page. */
export function orderableChildren(
  archive: Archive,
  parent: ContentNode | null,
): ContentNode[] {
  return childrenOf(archive, parent).filter((child) => child.kind !== "index");
}

/** Numbers a list of siblings 1..n in the order given. */
export function renamesFor(nodes: ContentNode[]): Rename[] {
  return nodes.map((node, index) => ({
    from: node.name,
    to: formatDirectoryName(index + 1, stripOrderPrefix(node.name)),
  }));
}

/** Strips every number in a group, leaving it alphabetical. */
export function renamesClearing(nodes: ContentNode[]): Rename[] {
  return nodes.map((node) => ({
    from: node.name,
    to: stripOrderPrefix(node.name),
  }));
}

/**
 * Applies renames inside one parent, after showing them. Returns false when
 * there was nothing to do or the reader declined.
 */
export async function applyOrdering(
  parent: ContentNode | null,
  renames: Rename[],
  options: RunOptions,
  context: string,
): Promise<boolean> {
  const moving = renames.filter((rename) => rename.from !== rename.to);
  if (moving.length === 0) {
    log.success("Already in that order.");
    return false;
  }

  notePanel(
    `${renderRenames(moving)}\n\n${pc.dim("Routes are unaffected: the number is stripped before the slug.")}`,
    context,
  );

  if (!options.dryRun && interactive()) {
    const confirmed = await askConfirm({
      message: "Apply?",
      initialValue: true,
    });
    if (isBack(confirmed) || !confirmed) {
      log.warn("Left unchanged.");
      return false;
    }
  }

  const parentAbs = parent ? join(CONTENT_DIR, parent.dirPath) : CONTENT_DIR;
  plan(
    options,
    `renumber ${moving.length} director${moving.length === 1 ? "y" : "ies"} under content/${parent?.dirPath ?? "."}`,
    () => applyRenames(parentAbs, moving),
  );

  if (!options.dryRun) {
    log.success(
      `Renumbered ${moving.length} of ${renames.length} under content/${parent?.dirPath ?? "."}`,
    );
  }
  return !options.dryRun;
}

export function showGroup(archive: Archive, parent: ContentNode | null): void {
  notePanel(
    renderGroup(orderableChildren(archive, parent)),
    `content/${parent?.dirPath ?? "."}`,
  );
}

// --- Non-interactive operations ----------------------------------------------

export async function renumber(
  archive: Archive,
  parent: ContentNode | null,
  options: RunOptions,
): Promise<void> {
  const children = orderableChildren(archive, parent);
  await applyOrdering(parent, renamesFor(children), options, "Renumber 1..n");
}

export async function clearNumbering(
  archive: Archive,
  parent: ContentNode | null,
  options: RunOptions,
): Promise<void> {
  const children = orderableChildren(archive, parent);
  await applyOrdering(
    parent,
    renamesClearing(children),
    options,
    "Strip the numbering",
  );
}

/** Moves one directory one place up or down among its siblings. */
export async function nudge(
  archive: Archive,
  node: ContentNode,
  direction: "up" | "down",
  options: RunOptions,
): Promise<void> {
  const parent = node.parentPath
    ? (archive.byDirPath.get(node.parentPath) ?? null)
    : null;
  const children = orderableChildren(archive, parent);
  const index = children.findIndex((child) => child.dirPath === node.dirPath);

  if (index < 0) {
    log.error(`content/${node.dirPath} is not part of an ordered group.`);
    return;
  }

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0) {
    log.warn(`${displayName(node)} is already first.`);
    return;
  }
  if (target >= children.length) {
    log.warn(`${displayName(node)} is already last.`);
    return;
  }

  const reordered = [...children];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(target, 0, moved);

  await applyOrdering(
    parent,
    renamesFor(reordered),
    options,
    `Move ${displayName(node)} ${direction}`,
  );
}

/** Sends one directory to a position, shifting the rest. */
export async function setPosition(
  archive: Archive,
  node: ContentNode,
  position: number,
  options: RunOptions,
): Promise<void> {
  const parent = node.parentPath
    ? (archive.byDirPath.get(node.parentPath) ?? null)
    : null;
  const children = orderableChildren(archive, parent);
  const index = children.findIndex((child) => child.dirPath === node.dirPath);

  if (index < 0) {
    log.error(`content/${node.dirPath} is not part of an ordered group.`);
    return;
  }

  const clamped = Math.min(Math.max(position, 1), children.length);
  const reordered = [...children];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(clamped - 1, 0, moved);

  await applyOrdering(
    parent,
    renamesFor(reordered),
    options,
    `Send ${displayName(node)} to position ${clamped}`,
  );
}

// --- Interactive flow ---------------------------------------------------------

/**
 * Reorders a group by moving items around in memory, redrawing after each
 * move, and writing only once at the end. Nothing touches disk until the
 * reader applies, so a reorder can be explored and abandoned.
 */
export async function orderFlow(
  archive: Archive,
  options: RunOptions,
  preselected?: ContentNode | null,
): Promise<void> {
  let currentArchive = archive;
  let parent =
    preselected !== undefined
      ? preselected
      : await pickNode({
          message: "Which group do you want to order?",
          archive,
          filter: (node) => node.children.length > 1,
          includeRoot: true,
          rootLabel: "content/ (the domains)",
        });
  if (isBack(parent)) return;

  let working = orderableChildren(currentArchive, parent);
  let original = working.map((node) => node.dirPath);

  if (working.length < 2) {
    log.warn("A group needs at least two directories to be ordered.");
    return;
  }

  while (true) {
    const dirty =
      working.map((node) => node.dirPath).join("|") !== original.join("|");

    notePanel(
      `${renderGroup(working)}${dirty ? `\n\n${pc.yellow("Unapplied")} ${pc.dim("— nothing has been written yet.")}` : ""}`,
      `content/${parent?.dirPath ?? "."}`,
    );

    const action = await askSelect<
      "move" | "apply" | "reset" | "renumber" | "clear" | "group" | "done"
    >({
      message: dirty ? "Keep arranging, or apply?" : "What should change?",
      options: [
        {
          value: "move",
          label: "Move an item",
          hint: "pick it, then pick where it goes",
        },
        ...(dirty
          ? ([
              {
                value: "apply",
                label: pc.green("Apply this order"),
                hint: "renames the directories",
              },
              {
                value: "reset",
                label: "Start over",
                hint: "discard the arrangement",
              },
            ] as const)
          : ([
              {
                value: "renumber",
                label: "Renumber 1..n",
                hint: "close the gaps, keep the order",
              },
              {
                value: "clear",
                label: "Strip the numbering",
                hint: "fall back to alphabetical",
              },
            ] as const)),
        { value: "group", label: "Pick another group" },
        { value: "done", label: "← Back" },
      ],
    });

    if (isBack(action) || action === "done") {
      if (dirty) log.warn("The arrangement was not applied.");
      return;
    }

    if (action === "group") {
      const next = await pickNode({
        message: "Which group?",
        archive: currentArchive,
        filter: (node) => node.children.length > 1,
        includeRoot: true,
        rootLabel: "content/ (the domains)",
      });
      if (isBack(next)) continue;
      parent = next;
      working = orderableChildren(currentArchive, parent);
      original = working.map((node) => node.dirPath);
      continue;
    }

    if (action === "reset") {
      working = orderableChildren(currentArchive, parent);
      original = working.map((node) => node.dirPath);
      continue;
    }

    if (action === "move") {
      const item = await askSelect<ContentNode | null>({
        message: "Move which one?",
        options: working.map((node, index) => ({
          value: node,
          label: `${String(index + 1).padStart(2, " ")}  ${displayName(node)}`,
          hint: node.kind === "category" ? "directory" : undefined,
        })),
      });
      if (isBack(item) || !item) continue;

      const from = working.findIndex((node) => node.dirPath === item.dirPath);
      const target = await askSelect<number>({
        message: `Put ${displayName(item)} where?`,
        options: working.map((node, index) => ({
          value: index,
          label:
            index === from
              ? `${String(index + 1).padStart(2, " ")}  ${pc.dim("(where it is now)")}`
              : `${String(index + 1).padStart(2, " ")}  before ${displayName(node)}`,
        })),
        initialValue: from,
      });
      if (isBack(target)) continue;

      const reordered = [...working];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(target, 0, moved);
      working = reordered;
      continue;
    }

    if (action === "apply") {
      const applied = await applyOrdering(
        parent,
        renamesFor(working),
        options,
        "Apply this order",
      );
      if (applied) {
        currentArchive = loadArchive();
        parent = parent
          ? (currentArchive.byDirPath.get(parent.dirPath) ?? null)
          : null;
        working = orderableChildren(currentArchive, parent);
        original = working.map((node) => node.dirPath);
      }
      continue;
    }

    if (action === "renumber" || action === "clear") {
      const renames =
        action === "renumber" ? renamesFor(working) : renamesClearing(working);
      const applied = await applyOrdering(
        parent,
        renames,
        options,
        action === "renumber" ? "Renumber 1..n" : "Strip the numbering",
      );
      if (applied) {
        currentArchive = loadArchive();
        parent = parent
          ? (currentArchive.byDirPath.get(parent.dirPath) ?? null)
          : null;
        working = orderableChildren(currentArchive, parent);
        original = working.map((node) => node.dirPath);
      }
    }
  }
}

export type { Back };
