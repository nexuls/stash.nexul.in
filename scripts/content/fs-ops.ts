/**
 * Filesystem mutations, routed through git where that preserves history.
 *
 * Every mutation goes through `plan()` so a dry run can print it and change
 * nothing, and so the TUI and the subcommands report the same lines.
 */

import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { CONTENT_DIR, REPO_ROOT } from "./model";
import { log, pc } from "./ui";

export interface RunOptions {
  dryRun: boolean;
}

/** What a mutation did, or would have done. */
export interface Mutation {
  description: string;
  applied: boolean;
}

const mutations: Mutation[] = [];

export function recordedMutations(): readonly Mutation[] {
  return mutations;
}

/**
 * Runs a mutation unless this is a dry run, recording it either way.
 */
export function plan(
  options: RunOptions,
  description: string,
  apply: () => void,
): Mutation {
  if (options.dryRun) {
    log.info(`${pc.yellow("would")} ${description}`);
    const mutation = { description, applied: false };
    mutations.push(mutation);
    return mutation;
  }
  apply();
  const mutation = { description, applied: true };
  mutations.push(mutation);
  return mutation;
}

/** `plan`, for a mutation that has to await something. */
export async function planAsync(
  options: RunOptions,
  description: string,
  apply: () => Promise<void>,
): Promise<Mutation> {
  if (options.dryRun) {
    log.info(`${pc.yellow("would")} ${description}`);
    const mutation = { description, applied: false };
    mutations.push(mutation);
    return mutation;
  }
  await apply();
  const mutation = { description, applied: true };
  mutations.push(mutation);
  return mutation;
}

// --- git ---------------------------------------------------------------------

function git(args: string[]): { ok: boolean; stdout: string } {
  const result = Bun.spawnSync(["git", ...args], {
    cwd: REPO_ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    ok: result.exitCode === 0,
    stdout: new TextDecoder().decode(result.stdout).trim(),
  };
}

let gitChecked: boolean | null = null;

export function gitAvailable(): boolean {
  if (gitChecked === null) {
    gitChecked = existsSync(join(REPO_ROOT, ".git")) && git(["--version"]).ok;
  }
  return gitChecked;
}

/** Whether git tracks anything under a path, so a rename can follow history. */
export function gitTracks(absPath: string): boolean {
  if (!gitAvailable()) return false;
  const rel = relative(REPO_ROOT, absPath);
  const result = git(["ls-files", "-z", "--", rel]);
  return result.ok && result.stdout.length > 0;
}

export function gitStaged(): string[] {
  if (!gitAvailable()) return [];
  const result = git([
    "status",
    "--porcelain",
    "--",
    relative(REPO_ROOT, CONTENT_DIR),
  ]);
  return result.ok && result.stdout ? result.stdout.split("\n") : [];
}

// --- operations --------------------------------------------------------------

export function moveDirectory(from: string, to: string): void {
  mkdirSync(dirname(to), { recursive: true });
  if (gitTracks(from)) {
    const result = git([
      "mv",
      relative(REPO_ROOT, from),
      relative(REPO_ROOT, to),
    ]);
    if (result.ok) return;
    // A path git declines to move (a partially untracked tree, say) still has
    // to move; the rename simply shows up as a delete plus an add.
  }
  renameSync(from, to);
}

export function copyDirectory(from: string, to: string): void {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

export function removeDirectory(absPath: string): void {
  if (gitTracks(absPath)) {
    git(["rm", "-r", "-q", "--", relative(REPO_ROOT, absPath)]);
    // `git rm` leaves untracked files behind, so clear whatever remains.
  }
  rmSync(absPath, { recursive: true, force: true });
}

export function createDirectory(absPath: string): void {
  mkdirSync(absPath, { recursive: true });
}

export async function writeFile(
  absPath: string,
  contents: string,
): Promise<void> {
  mkdirSync(dirname(absPath), { recursive: true });
  await Bun.write(absPath, contents);
}

/**
 * Applies a set of renames inside one directory in two phases, so a group can
 * rotate — swapping `01` and `02` would collide if each rename landed directly
 * on its final name.
 */
export function applyRenames(
  parentAbs: string,
  renames: { from: string; to: string }[],
): void {
  const moving = renames.filter((rename) => rename.from !== rename.to);
  if (moving.length === 0) return;

  const parked = moving.map((rename, index) => ({
    ...rename,
    temp: `.stash-reorder-${index}`,
  }));

  for (const rename of parked) {
    moveDirectory(join(parentAbs, rename.from), join(parentAbs, rename.temp));
  }
  for (const rename of parked) {
    moveDirectory(join(parentAbs, rename.temp), join(parentAbs, rename.to));
  }
}

/** A repository-relative path, for messages a reader can paste into an editor. */
export function repoPath(absPath: string): string {
  return relative(REPO_ROOT, absPath);
}
