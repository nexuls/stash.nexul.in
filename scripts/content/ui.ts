/**
 * The interaction layer.
 *
 * Prompts come from `@clack/prompts`: a cancel is a value here rather than a
 * thrown error, so every prompt is funnelled through `ask` and `askOptional`,
 * which turn a cancel into either a clean exit or a "go back" signal. Nothing
 * else in this tool should have to think about `isCancel`.
 */

import type { Option } from "@clack/prompts";
import {
  autocomplete,
  box,
  cancel,
  confirm,
  isCancel,
  isTTY,
  log,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import {
  type Archive,
  type ContentNode,
  descendants,
  displayName,
  documentsUnder,
  quickTitle,
} from "./model";

export { log, outro, spinner, pc };

/**
 * Whether clack's framed output is safe to use.
 *
 * `box` and `note` size their borders from the terminal width, and a terminal
 * that reports zero columns — a pty opened without a size, which is what a
 * script or a CI runner usually hands over — makes that arithmetic negative and
 * throws. A pipe reports no width at all, which clack handles itself.
 */
function framed(): boolean {
  const columns = process.stdout.columns;
  return columns === undefined || columns >= 40;
}

/**
 * A titled block of output: clack's box where that renders, plain indented
 * text where it would not.
 */
export function panel(body: string, title?: string): void {
  if (framed()) {
    box(body, title);
    return;
  }
  if (title) console.log(`\n${pc.bold(title)}`);
  console.log(
    body
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
  );
  console.log("");
}

/** A panel for something short — a preview, a diff, a list of routes. */
export function notePanel(body: string, title?: string): void {
  if (framed()) {
    note(body, title);
    return;
  }
  panel(body, title);
}

/**
 * Refuses a prompt when there is no terminal to answer it at.
 *
 * Every flow can be driven by flags; this is the backstop that turns a missing
 * flag into a message instead of a process waiting forever on a pipe.
 */
function refuseHeadless(message: string): Back {
  log.error(`"${message}" needs a terminal to answer at.`);
  log.message(
    pc.dim(
      "Pass it as an argument or a flag instead — `bun run content --help` lists them.",
    ),
  );
  process.exitCode = 1;
  return BACK;
}

/** Signals that the reader cancelled a step but not the session. */
export const BACK = Symbol("back");
export type Back = typeof BACK;

export function interactive(): boolean {
  return isTTY(process.stdin) && isTTY(process.stdout);
}

/** Ends the session the way a cancel should: a word, not a stack trace. */
export function bail(message = "Nothing was changed."): never {
  cancel(message);
  process.exit(0);
}

/**
 * Resolves a prompt, treating a cancel as the end of the session.
 *
 * Clack reports a cancel as a symbol in the value's place, which is why these
 * take `Promise<unknown>` and hand back the caller's own type: the symbol never
 * escapes into the rest of the tool.
 */
export async function ask<T>(prompt: Promise<T | symbol>): Promise<T> {
  const value = await prompt;
  if (isCancel(value)) bail();
  return value as T;
}

/** Resolves a prompt, treating a cancel as a step back. */
export async function askOptional<T>(
  prompt: Promise<unknown>,
): Promise<T | Back> {
  const value = await prompt;
  if (isCancel(value)) return BACK;
  return value as T;
}

export function isBack<T>(value: T | Back): value is Back {
  return value === BACK;
}

// --- Node pickers -------------------------------------------------------------

export type NodeFilter = (node: ContentNode) => boolean;

export const filters = {
  any: () => true,
  categories: (node: ContentNode) => node.kind === "category",
  documents: (node: ContentNode) => node.kind !== "category",
  notes: (node: ContentNode) => node.kind === "note",
} satisfies Record<string, NodeFilter>;

function nodeHint(node: ContentNode): string {
  if (node.kind === "category") {
    const count = documentsUnder(node).length;
    const children = descendants(node).filter(
      (child) => child.kind === "category",
    ).length;
    const parts = [`${count} document${count === 1 ? "" : "s"}`];
    if (children > 0)
      parts.push(`${children} subdirector${children === 1 ? "y" : "ies"}`);
    return parts.join(" · ");
  }
  return quickTitle(node);
}

function nodeLabel(node: ContentNode): string {
  const marker =
    node.kind === "category" ? "/" : node.kind === "index" ? " ·home" : "";
  return `${node.slug}${marker}`;
}

export interface PickNodeOptions {
  message: string;
  archive: Archive;
  filter?: NodeFilter;
  /** Offers the content root as a destination, for a new or moved domain. */
  includeRoot?: boolean;
  rootLabel?: string;
  /** Excluded from the list, with the reason shown as a hint. */
  exclude?: (node: ContentNode) => string | null;
  initial?: ContentNode;
}

/**
 * Picks a node by typing. The slug is the label, so "debounce" finds the note
 * wherever it lives, and the title rides along as a hint.
 */
export async function pickNode(
  options: PickNodeOptions,
): Promise<ContentNode | null | Back> {
  if (!interactive()) return refuseHeadless(options.message);
  const filter = options.filter ?? filters.any;
  const candidates = options.archive.all.filter(filter);

  type Choice = { node: ContentNode | null; disabledReason?: string };

  const choices: { value: Choice; label: string; hint?: string }[] = [];

  if (options.includeRoot) {
    choices.push({
      value: { node: null },
      label: options.rootLabel ?? "content/",
      hint: "the content root — a new domain",
    });
  }

  for (const node of candidates) {
    const reason = options.exclude?.(node) ?? null;
    choices.push({
      value: { node, disabledReason: reason ?? undefined },
      label: nodeLabel(node),
      hint: reason ? pc.yellow(reason) : nodeHint(node),
    });
  }

  if (choices.length === 0) {
    log.warn("Nothing to choose from here.");
    return BACK;
  }

  const picked = await askOptional<Choice>(
    autocomplete<Choice>({
      message: options.message,
      options: choices as Option<Choice>[],
      maxItems: 12,
      placeholder: "type to filter",
      initialValue: options.initial
        ? choices.find((choice) => choice.value.node === options.initial)?.value
        : undefined,
      validate: (value) => {
        const choice = Array.isArray(value) ? value[0] : value;
        return choice?.disabledReason;
      },
    }),
  );

  if (isBack(picked)) return BACK;
  return picked.node;
}

// --- Rendering ----------------------------------------------------------------

/** The archive, or a part of it, as an indented tree. */
export function renderTree(
  nodes: ContentNode[],
  options: { baseDepth?: number; routes?: boolean } = {},
): string {
  const baseDepth = options.baseDepth ?? 0;
  const lines: string[] = [];

  const walk = (list: ContentNode[]) => {
    for (const node of list) {
      const indent = "  ".repeat(Math.max(0, node.depth - baseDepth));
      const number =
        node.order === null
          ? pc.dim(" --")
          : pc.cyan(String(node.order).padStart(3, " "));
      const name =
        node.kind === "category"
          ? pc.blue(`${displayName(node)}/`)
          : node.kind === "index"
            ? pc.cyan(displayName(node))
            : displayName(node);
      const trailer =
        options.routes !== false && node.route
          ? pc.dim(`  ${node.route}`)
          : node.kind === "category"
            ? pc.dim(`  (${documentsUnder(node).length})`)
            : "";
      lines.push(`${number} ${indent}${name}${trailer}`);
      walk(node.children);
    }
  };

  walk(nodes);
  return lines.join("\n");
}

/** A group of siblings with the numbers they currently hold. */
export function renderGroup(nodes: ContentNode[]): string {
  if (nodes.length === 0) return pc.dim("(nothing here)");
  const width = String(nodes.length).length;
  return nodes
    .map((node, index) => {
      const position = pc.dim(`${String(index + 1).padStart(width, " ")}.`);
      const number =
        node.order === null
          ? pc.dim("--")
          : pc.cyan(String(node.order).padStart(2, "0"));
      const name =
        node.kind === "category"
          ? pc.blue(`${displayName(node)}/`)
          : displayName(node);
      return `${position} ${number}  ${name}`;
    })
    .join("\n");
}

/** Old → new lines, for a rename or a renumber. */
export function renderRenames(renames: { from: string; to: string }[]): string {
  return renames
    .filter((rename) => rename.from !== rename.to)
    .map((rename) => `${pc.dim(rename.from)}\n  ${pc.green(`→ ${rename.to}`)}`)
    .join("\n");
}

// --- Re-exported prompt wrappers ----------------------------------------------

export async function askText(options: {
  message: string;
  placeholder?: string;
  initialValue?: string;
  defaultValue?: string;
  validate?: (value: string) => string | undefined;
}): Promise<string | Back> {
  if (!interactive()) return refuseHeadless(options.message);
  return askOptional<string>(
    text({
      message: options.message,
      placeholder: options.placeholder,
      initialValue: options.initialValue,
      defaultValue: options.defaultValue,
      validate: options.validate
        ? (value) => options.validate?.(value ?? "")
        : undefined,
    }),
  );
}

export async function askSelect<T>(options: {
  message: string;
  options: { value: T; label: string; hint?: string }[];
  initialValue?: T;
}): Promise<T | Back> {
  if (!interactive()) return refuseHeadless(options.message);
  return askOptional<T>(
    select<T>({
      message: options.message,
      options: options.options as Option<T>[],
      initialValue: options.initialValue,
    }),
  );
}

export async function askConfirm(options: {
  message: string;
  initialValue?: boolean;
}): Promise<boolean | Back> {
  if (!interactive()) return refuseHeadless(options.message);
  return askOptional<boolean>(
    confirm({
      message: options.message,
      initialValue: options.initialValue ?? false,
    }),
  );
}

export async function askMultiselect<T>(options: {
  message: string;
  options: { value: T; label: string; hint?: string }[];
  required?: boolean;
}): Promise<T[] | Back> {
  if (!interactive()) return refuseHeadless(options.message);
  return askOptional<T[]>(
    multiselect<T>({
      message: options.message,
      options: options.options as Option<T>[],
      required: options.required ?? false,
    }),
  );
}
