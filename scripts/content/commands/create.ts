/**
 * Creating content: documents, categories, domains and category home pages.
 *
 * Nothing is registered anywhere. A directory holding a README.mdx is a
 * document, its path is its route, and the number in front of its name is where
 * it sits among its siblings. So creating is: pick a parent, pick a name, write
 * a file.
 */

import { join } from "node:path";
import { CATEGORY_INDEX_DIR, suggestKebabCase } from "../../../lib/content";
import { stripOrderPrefix } from "../../../lib/content/ordering";
import { today } from "../frontmatter";
import {
  createDirectory,
  plan,
  planAsync,
  type RunOptions,
  repoPath,
  writeFile,
} from "../fs-ops";
import {
  type Archive,
  CONTENT_DIR,
  type ContentNode,
  childrenOf,
  ENTRY_FILE,
  findSlugConflict,
  formatDirectoryName,
  loadArchive,
  nextOrder,
} from "../model";
import { renderTemplate, suggestTitle } from "../templates";
import type { Back } from "../ui";
import {
  askConfirm,
  askSelect,
  askText,
  filters,
  interactive,
  isBack,
  log,
  notePanel,
  pc,
  pickNode,
} from "../ui";

/**
 * Values a flow can be given instead of asking for them. A subcommand run from
 * a script passes these as flags; with no terminal attached they are the only
 * way in, and a flow says which ones are missing rather than hanging on a
 * prompt nobody can answer.
 */
export interface CreateArgs {
  name?: string;
  title?: string;
  description?: string;
  tags?: string;
  order?: string;
  home?: boolean;
}

export interface CreateInput {
  parent: ContentNode | null;
  name: string;
  title: string;
  description: string;
  tags: string[];
  order: number | null;
}

/** A name a directory can carry: kebab-case, and free among its siblings. */
export function validateName(
  archive: Archive,
  parent: ContentNode | null,
  raw: string,
): string | undefined {
  const name = raw.trim();
  if (!name) return "A name is required.";
  const suggestion = suggestKebabCase(name);
  if (suggestion !== name) {
    return `Use kebab-case: "${suggestion}".`;
  }
  const conflict = findSlugConflict(archive, parent, name);
  if (conflict) {
    return `content/${conflict.dirPath} already takes that slug here.`;
  }
  return undefined;
}

/** The domain a path sits in makes a reasonable first tag. */
function defaultTags(parent: ContentNode | null): string {
  if (!parent) return "";
  return stripOrderPrefix(parent.dirPath.split("/")[0] ?? "");
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function askOrder(
  archive: Archive,
  parent: ContentNode | null,
): Promise<number | null | Back> {
  const suggestion = nextOrder(archive, parent);
  const siblings = childrenOf(archive, parent).filter(
    (c) => c.kind !== "index",
  );

  const choice = await askSelect<"next" | "pick" | "none">({
    message: "Where should it sit?",
    options: [
      {
        value: "next",
        label: `Last — number ${String(suggestion).padStart(2, "0")}`,
        hint:
          siblings.length > 0
            ? `after ${stripOrderPrefix(siblings[siblings.length - 1]?.name ?? "")}`
            : "first here",
      },
      {
        value: "pick",
        label: "Choose the number",
        hint: "the group can be renumbered after",
      },
      {
        value: "none",
        label: "Unnumbered",
        hint: "sorts alphabetically, after the numbered ones",
      },
    ],
    initialValue: "next",
  });
  if (isBack(choice)) return choice;

  if (choice === "next") return suggestion;
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

/** Writes a document directory. Returns the new node's path on disk. */
export async function createDocument(
  input: CreateInput,
  options: RunOptions,
  template: "entry" | "home" = "entry",
): Promise<string> {
  const dirName =
    template === "home"
      ? CATEGORY_INDEX_DIR
      : formatDirectoryName(input.order, input.name);
  const dirPath = input.parent ? `${input.parent.dirPath}/${dirName}` : dirName;
  const absPath = join(CONTENT_DIR, dirPath);

  const contents = renderTemplate(template, {
    title: input.title,
    description: input.description,
    tags: input.tags,
    date: today(),
  });

  await planAsync(
    options,
    `create content/${dirPath}/${ENTRY_FILE}`,
    async () => {
      createDirectory(absPath);
      await writeFile(join(absPath, ENTRY_FILE), contents);
    },
  );

  return dirPath;
}

export async function createCategoryDirectory(
  input: Omit<CreateInput, "title" | "description" | "tags">,
  options: RunOptions,
): Promise<string> {
  const dirName = formatDirectoryName(input.order, input.name);
  const dirPath = input.parent ? `${input.parent.dirPath}/${dirName}` : dirName;

  plan(options, `create content/${dirPath}/`, () => {
    createDirectory(join(CONTENT_DIR, dirPath));
  });

  return dirPath;
}

// --- Interactive flows --------------------------------------------------------

function previewRoute(
  parent: ContentNode | null,
  name: string,
  isIndex = false,
): string {
  const parentSlug = parent?.slug ?? "";
  if (isIndex) return parentSlug ? `/stash/${parentSlug}` : "/stash";
  return parentSlug ? `/stash/${parentSlug}/${name}` : `/stash/${name}`;
}

/**
 * A value from a flag, from a prompt, or — with no terminal — from a sensible
 * default. Only the fields a document cannot do without are required as flags.
 */
async function resolveValue(
  given: string | undefined,
  fallback: string,
  prompt: () => Promise<string | Back>,
): Promise<string | Back> {
  if (given !== undefined) return given;
  if (!interactive()) return fallback;
  return prompt();
}

/** Reports the flags a headless run is missing, if any. */
function missingFlags(
  args: CreateArgs | undefined,
  required: (keyof CreateArgs)[],
): string[] {
  if (interactive()) return [];
  return required.filter((key) => !args?.[key]).map((key) => `--${key}`);
}

function parseOrderArg(
  archive: Archive,
  parent: ContentNode | null,
  raw: string | undefined,
): number | null {
  if (raw === undefined) return nextOrder(archive, parent);
  if (raw === "none" || raw === "") return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? nextOrder(archive, parent) : parsed;
}

export async function documentFlow(
  archive: Archive,
  options: RunOptions,
  preselected?: ContentNode | null,
  args?: CreateArgs,
): Promise<void> {
  const missing = missingFlags(args, ["name", "description"]);
  if (missing.length > 0) {
    log.error(`With no terminal attached, pass ${missing.join(" and ")}.`);
    process.exitCode = 1;
    return;
  }

  const parent =
    preselected !== undefined
      ? preselected
      : await pickNode({
          message: "Which directory does it belong in?",
          archive,
          filter: filters.categories,
          includeRoot: true,
          rootLabel: "content/ (a note at the root)",
        });
  if (isBack(parent)) return;

  const name = await resolveValue(args?.name, "", () =>
    askText({
      message: "Directory name",
      placeholder: "use-debounce",
      validate: (value) => validateName(archive, parent, value),
    }),
  );
  if (isBack(name)) return;

  const problem = validateName(archive, parent, name);
  if (problem) {
    log.error(problem);
    process.exitCode = 1;
    return;
  }

  const title = await resolveValue(args?.title, suggestTitle(name.trim()), () =>
    askText({ message: "Title", initialValue: suggestTitle(name.trim()) }),
  );
  if (isBack(title)) return;

  const description = await resolveValue(args?.description, "", () =>
    askText({
      message: "Description",
      placeholder: "One sentence: what this answers, and when.",
      validate: (value) =>
        value.trim().length > 0 ? undefined : "A description is required.",
    }),
  );
  if (isBack(description)) return;

  const tags = await resolveValue(args?.tags, defaultTags(parent), () =>
    askText({
      message: "Tags",
      placeholder: "comma separated",
      initialValue: defaultTags(parent),
    }),
  );
  if (isBack(tags)) return;

  const order =
    args || !interactive()
      ? parseOrderArg(archive, parent, args?.order)
      : await askOrder(archive, parent);
  if (isBack(order)) return;

  notePanel(
    [
      `${pc.dim("directory")}  content/${parent ? `${parent.dirPath}/` : ""}${formatDirectoryName(order, name.trim())}`,
      `${pc.dim("route")}      ${previewRoute(parent, name.trim())}`,
      `${pc.dim("title")}      ${title.trim()}`,
    ].join("\n"),
    "New document",
  );

  if (interactive() && !options.dryRun) {
    const confirmed = await askConfirm({
      message: "Create it?",
      initialValue: true,
    });
    if (isBack(confirmed) || !confirmed) {
      log.warn("Nothing was created.");
      return;
    }
  }

  const dirPath = await createDocument(
    {
      parent,
      name: name.trim(),
      title: title.trim(),
      description: description.trim(),
      tags: parseTags(tags),
      order,
    },
    options,
  );

  if (options.dryRun) return;
  log.success(`Created ${repoPath(join(CONTENT_DIR, dirPath, ENTRY_FILE))}`);
  log.message(pc.dim(`Served at ${previewRoute(parent, name.trim())}`));
}

export async function categoryFlow(
  archive: Archive,
  options: RunOptions,
  preselected?: ContentNode | null,
  args?: CreateArgs,
): Promise<void> {
  const wantsHomeHeadless = args?.home !== false;
  const required: (keyof CreateArgs)[] = wantsHomeHeadless
    ? ["name", "description"]
    : ["name"];
  const missing = missingFlags(args, required);
  if (missing.length > 0) {
    log.error(
      `With no terminal attached, pass ${missing.join(" and ")} (or --no-home for a bare directory).`,
    );
    process.exitCode = 1;
    return;
  }

  const parent =
    preselected !== undefined
      ? preselected
      : await pickNode({
          message: "Which directory does it belong in?",
          archive,
          filter: filters.categories,
          includeRoot: true,
          rootLabel: "content/ (a new domain)",
        });
  if (isBack(parent)) return;

  const name = await resolveValue(args?.name, "", () =>
    askText({
      message: "Directory name",
      placeholder: "state-management",
      validate: (value) => validateName(archive, parent, value),
    }),
  );
  if (isBack(name)) return;

  const problem = validateName(archive, parent, name);
  if (problem) {
    log.error(problem);
    process.exitCode = 1;
    return;
  }

  const order =
    args || !interactive()
      ? parseOrderArg(archive, parent, args?.order)
      : await askOrder(archive, parent);
  if (isBack(order)) return;

  const wantsHome =
    interactive() && !args
      ? await askConfirm({
          message: "Give it a home page? (its own authored category page)",
          initialValue: true,
        })
      : wantsHomeHeadless;
  if (isBack(wantsHome)) return;

  let homeTitle = args?.title ?? "";
  let homeDescription = args?.description ?? "";
  let homeTags = args?.tags ?? (defaultTags(parent) || name.trim());

  if (wantsHome && !args) {
    const title = await askText({
      message: "Category title",
      initialValue: suggestTitle(name.trim()),
    });
    if (isBack(title)) return;
    homeTitle = title.trim();

    const description = await askText({
      message: "Category description",
      placeholder: "One sentence: what this directory collects.",
      validate: (value) =>
        value.trim().length > 0 ? undefined : "A description is required.",
    });
    if (isBack(description)) return;
    homeDescription = description.trim();

    const tags = await askText({
      message: "Tags",
      placeholder: "comma separated",
      initialValue: homeTags,
    });
    if (isBack(tags)) return;
    homeTags = tags;
  }

  if (wantsHome && !homeTitle) homeTitle = suggestTitle(name.trim());

  notePanel(
    [
      `${pc.dim("directory")}  content/${parent ? `${parent.dirPath}/` : ""}${formatDirectoryName(order, name.trim())}`,
      `${pc.dim("route")}      ${wantsHome ? previewRoute(parent, name.trim()) : pc.dim("— nothing until it has a home page")}`,
      `${pc.dim("home page")}  ${wantsHome ? "yes" : "no"}`,
    ].join("\n"),
    parent ? "New category" : "New domain",
  );

  if (interactive() && !options.dryRun) {
    const confirmed = await askConfirm({
      message: "Create it?",
      initialValue: true,
    });
    if (isBack(confirmed) || !confirmed) {
      log.warn("Nothing was created.");
      return;
    }
  }

  const dirPath = await createCategoryDirectory(
    { parent, name: name.trim(), order },
    options,
  );
  if (!options.dryRun) log.success(`Created content/${dirPath}/`);

  if (!wantsHome) {
    log.warn(
      "An empty category serves no route and fails the structure check until it holds a document.",
    );
    return;
  }

  if (options.dryRun) return;

  // The category exists now, so the tree has to be re-read before its home
  // page can be written inside it.
  const refreshed = loadArchive();
  const created = refreshed.byDirPath.get(dirPath) ?? null;

  const homePath = await createDocument(
    {
      parent: created,
      name: CATEGORY_INDEX_DIR,
      title: homeTitle,
      description: homeDescription,
      tags: parseTags(homeTags),
      order: null,
    },
    options,
    "home",
  );

  log.success(`Created ${repoPath(join(CONTENT_DIR, homePath, ENTRY_FILE))}`);
  log.message(
    pc.dim(
      `Served at ${previewRoute(parent, name.trim())} — /stash/${created?.slug ?? name.trim()}/${CATEGORY_INDEX_DIR} stays a 404.`,
    ),
  );
}

export async function homeFlow(
  archive: Archive,
  options: RunOptions,
  preselected?: ContentNode,
  args?: CreateArgs,
): Promise<void> {
  const missing = missingFlags(args, ["description"]);
  if (missing.length > 0) {
    log.error(`With no terminal attached, pass ${missing.join(" and ")}.`);
    process.exitCode = 1;
    return;
  }

  const category =
    preselected ??
    (await pickNode({
      message: "Which category needs a page?",
      archive,
      filter: filters.categories,
      exclude: (node) =>
        node.children.some((child) => child.kind === "index")
          ? "already has one"
          : null,
    }));
  if (isBack(category) || !category) {
    if (!isBack(category)) log.error("A home page needs a category above it.");
    return;
  }

  if (category.children.some((child) => child.kind === "index")) {
    log.error(`content/${category.dirPath} already has a home page.`);
    process.exitCode = 1;
    return;
  }

  const title = await resolveValue(
    args?.title,
    suggestTitle(category.slug),
    () =>
      askText({ message: "Title", initialValue: suggestTitle(category.slug) }),
  );
  if (isBack(title)) return;

  const description = await resolveValue(args?.description, "", () =>
    askText({
      message: "Description",
      placeholder: "One sentence: what this directory collects.",
      validate: (value) =>
        value.trim().length > 0 ? undefined : "A description is required.",
    }),
  );
  if (isBack(description)) return;

  const tags = await resolveValue(
    args?.tags,
    defaultTags(category) || category.slug,
    () =>
      askText({
        message: "Tags",
        placeholder: "comma separated",
        initialValue: defaultTags(category) || category.slug,
      }),
  );
  if (isBack(tags)) return;

  const dirPath = await createDocument(
    {
      parent: category,
      name: CATEGORY_INDEX_DIR,
      title: title.trim(),
      description: description.trim(),
      tags: parseTags(tags),
      order: null,
    },
    options,
    "home",
  );

  if (options.dryRun) return;

  log.success(`Created ${repoPath(join(CONTENT_DIR, dirPath, ENTRY_FILE))}`);
  log.message(pc.dim(`Served at /stash/${category.slug}`));
}
