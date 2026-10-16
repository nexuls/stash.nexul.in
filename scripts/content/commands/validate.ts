/**
 * Validation.
 *
 * Two passes, deliberately. The structural pass answers the questions this tool
 * can break — naming, numbering, route collisions, a `home` somewhere it cannot
 * serve — directly off the model, so it is instant and its wording can point at
 * the command that fixes it. `validateContent` from `lib/content` then runs
 * in-process and stays authoritative for frontmatter, assets and links.
 */

import {
  isKebabCase,
  suggestKebabCase,
  type ValidationIssue,
  validateContent,
} from "../../../lib/content";
import { stripOrderPrefix } from "../../../lib/content/ordering";
import {
  type Archive,
  CONTENT_DIR,
  type ContentNode,
  childrenOf,
  documentsUnder,
  formatDirectoryName,
  loadArchive,
  parentOf,
  REPO_ROOT,
} from "../model";
import { log, pc } from "../ui";

export interface StructureReport {
  issues: ValidationIssue[];
  errors: number;
  warnings: number;
}

/** Everything the model can tell us is wrong before Bun parses any MDX. */
export function checkStructure(archive: Archive): StructureReport {
  const issues: ValidationIssue[] = [];

  for (const node of archive.all) {
    const name = stripOrderPrefix(node.name);

    // The stripped name is what becomes a slug segment, so that is what the
    // kebab-case rule applies to.
    if (!isKebabCase(name)) {
      issues.push({
        severity: "error",
        file: `content/${node.dirPath}`,
        rule: "path-kebab-case",
        message: `Directory segment "${name}" must be lowercase kebab-case.`,
        suggestion: `Rename it to "${formatDirectoryName(node.order, suggestKebabCase(name))}".`,
      });
    }

    if (node.kind === "category" && node.children.length === 0) {
      issues.push({
        severity: "warning",
        file: `content/${node.dirPath}`,
        rule: "empty-category",
        message: "Category holds no documents or subdirectories.",
        suggestion: "Add a document under it, or remove it.",
      });
    }

    // A `home` at the content root is not an index at all: the loader needs a
    // category above it, so that directory is served as an ordinary note at
    // /stash/home, which is almost certainly not what the author meant.
    if (
      node.kind === "note" &&
      !node.parentPath &&
      stripOrderPrefix(node.name) === "home"
    ) {
      issues.push({
        severity: "warning",
        file: `content/${node.dirPath}`,
        rule: "root-index",
        message: `A home directory at the content root is served as a note at ${node.route}.`,
        suggestion:
          "A home entry is a category's page, so move it under the category it opens.",
      });
    }

    if (node.kind === "index") {
      if (node.order !== null) {
        issues.push({
          severity: "warning",
          file: `content/${node.dirPath}`,
          rule: "numbered-index",
          message: "A home directory carries an order prefix.",
          suggestion:
            "It is not listed among notes, so the number has no effect. Drop it.",
        });
      }
    }
  }

  // Route collisions, among the directories that actually serve a page. A
  // `home` sharing its category's route is the convention, not a collision.
  const byRoute = new Map<string, ContentNode>();
  for (const node of archive.all) {
    if (!node.route) continue;
    const existing = byRoute.get(node.route);
    if (existing) {
      issues.push({
        severity: "error",
        file: `content/${node.dirPath}`,
        rule: "duplicate-route",
        message: `Resolves to ${node.route}, which content/${existing.dirPath} already serves.`,
        suggestion:
          "Rename one of them; order prefixes do not separate routes.",
      });
    } else {
      byRoute.set(node.route, node);
    }
  }

  // Two siblings claiming one number leaves their order to a tiebreak.
  const groups: (ContentNode | null)[] = [
    null,
    ...archive.all.filter((n) => n.children.length > 0),
  ];
  for (const parent of groups) {
    const seen = new Map<number, ContentNode>();
    for (const child of childrenOf(archive, parent)) {
      if (child.order === null || child.kind === "index") continue;
      const existing = seen.get(child.order);
      if (existing) {
        issues.push({
          severity: "warning",
          file: `content/${child.dirPath}`,
          rule: "duplicate-order",
          message: `Claims order ${child.order}, as does content/${existing.dirPath}.`,
          suggestion: `Renumber the group: \`bun run content order renumber ${parent ? parent.slug : "."}\`.`,
        });
      } else {
        seen.set(child.order, child);
      }
    }
  }

  return {
    issues,
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
  };
}

/** Groups whose numbering has gaps, or mixes numbered with unnumbered. */
export function checkNumbering(archive: Archive): string[] {
  const notes: string[] = [];
  const groups: (ContentNode | null)[] = [
    null,
    ...archive.all.filter((node) => node.children.length > 0),
  ];

  for (const parent of groups) {
    const children = childrenOf(archive, parent).filter(
      (child) => child.kind !== "index",
    );
    if (children.length === 0) continue;

    const numbered = children.filter((child) => child.order !== null);
    const unnumbered = children.length - numbered.length;
    const label = `content/${parent ? parent.dirPath : "."}`;

    if (numbered.length > 0 && unnumbered > 0) {
      notes.push(
        `${label} mixes ${numbered.length} numbered with ${unnumbered} unnumbered`,
      );
      continue;
    }

    const sequence = numbered
      .map((child) => child.order as number)
      .sort((a, b) => a - b);
    const sequential = sequence.every((value, index) => value === index + 1);
    if (sequence.length > 0 && !sequential) {
      notes.push(`${label} is numbered ${sequence.join(", ")}`);
    }
  }

  return notes;
}

export function printIssues(issues: ValidationIssue[]): void {
  for (const issue of issues) {
    const location = issue.line
      ? `${issue.file}:${issue.line}${issue.column ? `:${issue.column}` : ""}`
      : issue.file;
    const head = `${pc.dim(`[${issue.rule}]`)} ${location}`;
    const body = `   ${issue.message}${issue.suggestion ? `\n   ${pc.dim(`↳ ${issue.suggestion}`)}` : ""}`;
    if (issue.severity === "error") {
      log.error(`${head}\n${body}`);
    } else {
      log.warn(`${head}\n${body}`);
    }
  }
}

export interface ValidateOptions {
  json?: boolean;
  /** Skips the MDX pass, for the checks that run between every mutation. */
  structureOnly?: boolean;
  numbering?: boolean;
}

/** Returns true when nothing is wrong. */
export async function runValidation(
  options: ValidateOptions = {},
): Promise<boolean> {
  const archive = loadArchive();
  const structure = checkStructure(archive);
  const content = options.structureOnly
    ? null
    : await validateContent(CONTENT_DIR);
  const numbering = options.numbering ? checkNumbering(archive) : [];

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          structure: structure.issues,
          content: content?.issues ?? [],
          numbering,
          entryCount:
            content?.entryCount ?? archive.all.filter((n) => n.route).length,
          assetCount: content?.assetCount ?? null,
          valid: structure.errors === 0 && (content?.valid ?? true),
        },
        null,
        2,
      ),
    );
    return structure.errors === 0 && (content?.valid ?? true);
  }

  log.step("Structure");
  if (structure.issues.length === 0) {
    log.success("Naming, numbering, routes and documents are consistent.");
  } else {
    printIssues(structure.issues);
  }

  if (numbering.length > 0) {
    log.step("Numbering");
    for (const line of numbering) log.info(line);
  } else if (options.numbering) {
    log.step("Numbering");
    log.success("Every group is numbered 1..n without gaps.");
  }

  if (content) {
    log.step("Content");
    log.message(
      pc.dim(
        `${content.entryCount} entries, ${content.assetCount} adjacent assets.`,
      ),
    );
    if (content.issues.length === 0) {
      log.success("Frontmatter, assets and internal links are valid.");
    } else {
      printIssues(content.issues);
    }
  }

  const errors =
    structure.errors +
    (content?.issues.filter((i) => i.severity === "error").length ?? 0);
  const warnings =
    structure.warnings +
    (content?.issues.filter((i) => i.severity === "warning").length ?? 0);

  if (errors > 0) {
    log.error(
      `${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}.`,
    );
    return false;
  }
  if (warnings > 0) {
    log.warn(`No errors, ${warnings} warning${warnings === 1 ? "" : "s"}.`);
  }
  return true;
}

/** The repository's own checks, as `bun run check` plus tests would run them. */
export async function runFullValidation(): Promise<boolean> {
  let ok = await runValidation({ numbering: true });

  const steps: { title: string; command: string[] }[] = [
    { title: "Biome", command: ["bun", "run", "lint"] },
    { title: "TypeScript", command: ["bun", "x", "tsc", "--noEmit"] },
    { title: "Tests", command: ["bun", "test"] },
  ];

  for (const step of steps) {
    log.step(step.title);
    const result = Bun.spawnSync(step.command, {
      cwd: REPO_ROOT,
      stdout: "inherit",
      stderr: "inherit",
    });
    if (result.exitCode === 0) {
      log.success(`${step.title} passed.`);
    } else {
      log.error(`${step.title} failed.`);
      ok = false;
    }
  }

  return ok;
}

/** A compact structural check, for running after a mutation. */
export function warnIfBroken(): void {
  const structure = checkStructure(loadArchive());
  const errors = structure.issues.filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    log.warn("The archive now has structural errors:");
    printIssues(errors);
  }
}

export { documentsUnder, parentOf };
