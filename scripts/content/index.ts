#!/usr/bin/env bun
/**
 * One entry point for everything that touches `content/`.
 *
 * With no arguments it opens the TUI; every action it offers is also a
 * subcommand, so the same code paths work from a script or a hook. The modules
 * beside this one own one concern each:
 *
 *   model.ts        the content tree, derived over lib/content
 *   fs-ops.ts       git-aware mutations, dry run, two-phase renames
 *   frontmatter.ts  reading and editing frontmatter through yaml
 *   templates.ts    what a new document starts as
 *   ui.ts           prompts, pickers and rendering (@clack/prompts)
 *   tui.ts          the interactive app
 *   commands/       browse, create, order, manage, validate
 *
 * Nothing here re-derives what the site already knows: slugs, routes, titles,
 * links and validation all come from `lib/content`.
 */

import { parseArgs } from "node:util";
import {
  printRoutes,
  printSearch,
  printStats,
  printTree,
  searchArchive,
  showNode,
} from "./commands/browse";
import {
  type CreateArgs,
  categoryFlow,
  documentFlow,
  homeFlow,
} from "./commands/create";
import {
  copyFlow,
  frontmatterFlow,
  type ManageOptions,
  moveFlow,
  removeFlow,
  renameFlow,
} from "./commands/manage";
import {
  clearNumbering,
  nudge,
  orderFlow,
  renumber,
  setPosition,
  showGroup,
} from "./commands/order";
import { runFullValidation, runValidation } from "./commands/validate";
import {
  type Archive,
  type ContentNode,
  loadArchive,
  resolveNode,
} from "./model";
import { runTui } from "./tui";
import { interactive, log, pc } from "./ui";

const USAGE = `${pc.bold("stash content")} — manage the archive under content/

${pc.dim("Usage")}
  bun run content                        Open the TUI
  bun run content <command> [arguments]

${pc.dim("Browsing")}
  tree [path]                            The archive in content order
  show <path>                            One document or category in detail
  stats                                  Totals as the build sees them
  routes                                 Every URL the build will emit
  search <text>                          Find a note by its contents

${pc.dim("Creating")}
  new document [parent]                  A note: a directory with README.mdx
  new category [parent]                  A directory of notes
  new domain                             A top-level category
  new home <category>                    A category's own authored page

${pc.dim("Ordering")}
  order [parent]                         Arrange a group interactively
  order show <parent>                    The group's current order
  order renumber <parent>                Renumber the group 1..n as it stands
  order clear <parent>                   Strip the group's numbering
  order up <path>                        Move one directory up among siblings
  order down <path>                      Move one directory down
  order set <path> <position>            Send one directory to a position

${pc.dim("Managing")}
  move <path> [destination]              Move a document or category
  rename <path> [name]                   Change a slug
  copy <path> [destination]              Duplicate a document or category
  rm <path>                              Delete a document or category
  frontmatter <path>                     Edit title, description, tags, dates

${pc.dim("Validating")}
  validate                               Structure and content
  validate numbering                     Gaps and mixed groups
  validate full                          Adds Biome, TypeScript and tests

${pc.dim("Creating without a terminal")}
  new document <parent> --name <slug> --description <text> [--title <text>]
                       [--tags a,b] [--order <n>|none]
  new category <parent> --name <slug> --description <text> [--no-home]
  new home <category> --description <text> [--title <text>]
  copy <path> <destination> --name <slug>

${pc.dim("Options")}
  -n, --dry-run                          Print what would change, change nothing
  -y, --yes                              Allow a removal with no terminal attached
  --json                                 Machine-readable output where it applies
  -h, --help                             This text

${pc.dim('A path may be given on disk ("01 - react/01 - hooks"), as a slug')}
${pc.dim('("react/hooks"), or as a route ("/stash/react/hooks"). Order prefixes never')}
${pc.dim("reach a URL, so renumbering is always safe.")}
`;

/** Resolves a path argument, or explains why it did not resolve. */
function requireNode(archive: Archive, query: string): ContentNode {
  const node = resolveNode(archive, query);
  if (!node) {
    log.error(`No such content path: ${query}`);
    log.message(pc.dim("`bun run content tree` lists what there is."));
    process.exit(1);
  }
  return node;
}

/** Resolves an optional parent argument, where nothing means the content root. */
function optionalParent(
  archive: Archive,
  query: string | undefined,
): ContentNode | null | undefined {
  if (query === undefined) return undefined;
  if (query === "." || query === "/" || query === "content") return null;
  return requireNode(archive, query);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    allowPositionals: true,
    strict: false,
    options: {
      "dry-run": { type: "boolean", short: "n", default: false },
      yes: { type: "boolean", short: "y", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      // Values the create flows would otherwise prompt for, so a script can
      // drive them without a terminal.
      name: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      tags: { type: "string" },
      order: { type: "string" },
      home: { type: "boolean", default: true },
    },
  });

  if (values.help) {
    console.log(USAGE);
    return;
  }

  const options: ManageOptions = {
    dryRun: Boolean(values["dry-run"]),
    yes: Boolean(values.yes),
  };
  const json = Boolean(values.json);

  // `args` is only passed on when a flag was actually given: its presence is
  // what tells a flow not to prompt.
  const createFlags: CreateArgs = {
    name: values.name as string | undefined,
    title: values.title as string | undefined,
    description: values.description as string | undefined,
    tags: values.tags as string | undefined,
    order: values.order as string | undefined,
    home: values.home === false ? false : undefined,
  };
  const createArgs: CreateArgs | undefined = Object.values(createFlags).some(
    (value) => value !== undefined,
  )
    ? createFlags
    : undefined;

  const [command, ...args] = positionals as string[];

  if (!command) {
    if (!interactive()) {
      console.log(USAGE);
      return;
    }
    await runTui(options);
    return;
  }

  const archive = loadArchive();

  switch (command) {
    case "tree":
      printTree(archive, args[0] ? requireNode(archive, args[0]) : null);
      return;

    case "show": {
      if (!args[0]) {
        log.error("Which one? `bun run content show <path>`");
        process.exitCode = 1;
        return;
      }
      showNode(requireNode(archive, args[0]));
      return;
    }

    case "stats":
      printStats(archive, json);
      return;

    case "routes":
      printRoutes(archive, json);
      return;

    case "search": {
      const query = args.join(" ").trim();
      if (!query) {
        log.error("Search for what? `bun run content search <text>`");
        process.exitCode = 1;
        return;
      }
      const hits = searchArchive(archive, query);
      if (json) {
        console.log(
          JSON.stringify(
            hits.map((hit) => ({
              route: hit.node.route,
              path: hit.node.dirPath,
              matches: hit.matches,
            })),
            null,
            2,
          ),
        );
        return;
      }
      printSearch(hits, query);
      return;
    }

    case "new": {
      const what = args[0];
      const parent = optionalParent(archive, args[1]);
      if (what === "document" || what === "doc" || what === "note") {
        await documentFlow(archive, options, parent, createArgs);
      } else if (what === "category" || what === "dir") {
        await categoryFlow(archive, options, parent, createArgs);
      } else if (what === "domain") {
        await categoryFlow(archive, options, null, createArgs);
      } else if (what === "home" || what === "index") {
        await homeFlow(
          archive,
          options,
          args[1] ? requireNode(archive, args[1]) : undefined,
          createArgs,
        );
      } else {
        log.error(`Unknown: new ${what ?? ""}`);
        log.message(pc.dim("One of: document, category, domain, home."));
        process.exitCode = 1;
      }
      return;
    }

    case "order": {
      const action = args[0];

      // `order <parent>` with no verb opens the arranger on that group.
      if (
        !action ||
        !["show", "renumber", "clear", "up", "down", "set"].includes(action)
      ) {
        await orderFlow(archive, options, optionalParent(archive, action));
        return;
      }

      if (action === "show") {
        showGroup(archive, optionalParent(archive, args[1]) ?? null);
        return;
      }
      if (action === "renumber") {
        await renumber(
          archive,
          optionalParent(archive, args[1]) ?? null,
          options,
        );
        return;
      }
      if (action === "clear") {
        await clearNumbering(
          archive,
          optionalParent(archive, args[1]) ?? null,
          options,
        );
        return;
      }
      if (action === "up" || action === "down") {
        if (!args[1]) {
          log.error(`Which one? \`bun run content order ${action} <path>\``);
          process.exitCode = 1;
          return;
        }
        await nudge(archive, requireNode(archive, args[1]), action, options);
        return;
      }
      if (action === "set") {
        if (!args[1] || !args[2]) {
          log.error("Usage: bun run content order set <path> <position>");
          process.exitCode = 1;
          return;
        }
        const position = Number.parseInt(args[2], 10);
        if (Number.isNaN(position)) {
          log.error(`"${args[2]}" is not a position.`);
          process.exitCode = 1;
          return;
        }
        await setPosition(
          archive,
          requireNode(archive, args[1]),
          position,
          options,
        );
        return;
      }
      return;
    }

    case "move":
    case "mv":
      await moveFlow(
        archive,
        options,
        args[0] ? requireNode(archive, args[0]) : undefined,
        optionalParent(archive, args[1]),
      );
      return;

    case "rename":
      await renameFlow(
        archive,
        options,
        args[0] ? requireNode(archive, args[0]) : undefined,
        args[1],
      );
      return;

    case "copy":
    case "cp":
      await copyFlow(
        archive,
        options,
        args[0] ? requireNode(archive, args[0]) : undefined,
        optionalParent(archive, args[1]),
        values.name as string | undefined,
      );
      return;

    case "rm":
    case "remove":
    case "delete":
      await removeFlow(
        archive,
        options,
        args[0] ? requireNode(archive, args[0]) : undefined,
      );
      return;

    case "frontmatter":
      await frontmatterFlow(
        archive,
        options,
        args[0] ? requireNode(archive, args[0]) : undefined,
      );
      return;

    case "validate":
    case "check": {
      const scope = args[0];
      let ok: boolean;
      if (scope === "full" || scope === "all") {
        ok = await runFullValidation();
      } else if (scope === "numbering") {
        ok = await runValidation({
          structureOnly: true,
          numbering: true,
          json,
        });
      } else if (scope === "structure") {
        ok = await runValidation({ structureOnly: true, json });
      } else {
        ok = await runValidation({ json });
      }
      if (!ok) process.exitCode = 1;
      return;
    }

    case "help":
      console.log(USAGE);
      return;

    default:
      log.error(`Unknown command: ${command}`);
      console.log(USAGE);
      process.exitCode = 2;
  }
}

/**
 * `bun run content routes | head` closes the pipe while output is still being
 * written, which is a normal end to a command, not a failure.
 */
function quietOnBrokenPipe(): void {
  const handle = (error: unknown) => {
    if ((error as { code?: string } | null)?.code === "EPIPE") process.exit(0);
    throw error;
  };
  process.stdout.on("error", handle);
  process.stderr.on("error", handle);
}

quietOnBrokenPipe();

try {
  await main();
} catch (error) {
  if ((error as { code?: string } | null)?.code === "EPIPE") process.exit(0);
  throw error;
}
