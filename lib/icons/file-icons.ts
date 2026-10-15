/**
 * Resolves a filename, language id or folder name to a Material Icon Theme SVG.
 *
 * These are the icons VS Code shows in its explorer and tab bar, so a reader
 * recognises a block of TypeScript or a Dockerfile before reading its label.
 * The theme ships a manifest of the same lookup tables the extension uses, and
 * this module is the only thing that reads them.
 *
 * Everything here runs on the server during static generation: entries are
 * prerendered, so the filesystem reads happen at build time and the icon markup
 * is inlined into the HTML. No icon data reaches the client bundle.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import manifest from "material-icon-theme/dist/material-icons.json" with {
  type: "json",
};

/**
 * Where the theme's `icons/` directory lives.
 *
 * Resolved from the working directory rather than with `createRequire`:
 * `import.meta.url` is rewritten to a module id by the bundler, so asking Node
 * to resolve against it throws during `next build`. Both the dev server and the
 * build run from the project root, and the lookup is verified below rather than
 * assumed.
 */
const ICONS_DIRECTORY = [".", "..", "../.."]
  .map((prefix) =>
    join(process.cwd(), prefix, "node_modules/material-icon-theme/icons"),
  )
  .find((candidate) => existsSync(candidate));

if (!ICONS_DIRECTORY) {
  console.warn(
    "[icons] material-icon-theme/icons not found; file type icons will be omitted.",
  );
}

interface IconManifest {
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  languageIds: Record<string, string>;
  folderNames: Record<string, string>;
  folderNamesExpanded: Record<string, string>;
  file: string;
  folder: string;
  folderExpanded: string;
}

const icons = manifest as unknown as IconManifest;

/**
 * Shiki language ids translated to the VS Code language ids the manifest keys
 * on. Shiki says `tsx` and `sh` where VS Code says `typescriptreact` and
 * `shellscript`, so without this the most common blocks in the archive would
 * fall through to the generic file icon.
 *
 * An empty string means "no meaningful icon": plain text gets the generic file
 * rather than a guess.
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  tsx: "typescriptreact",
  jsx: "javascriptreact",
  sh: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  shell: "shellscript",
  console: "shellscript",
  terminal: "shellscript",
  ps1: "powershell",
  yml: "yaml",
  md: "markdown",
  plaintext: "",
  text: "",
  txt: "",
};

/** Lowercased basename of a path, which is what the manifest keys on. */
function basename(path: string): string {
  const segments = path.split("/");
  return (segments[segments.length - 1] ?? path).toLowerCase();
}

/**
 * Longest-suffix extension match.
 *
 * The manifest keys compound extensions such as `test.ts` and `module.css`, so
 * the most specific suffix has to win over the last dot segment.
 */
function iconForExtension(name: string): string | undefined {
  const parts = name.split(".");
  for (let index = 1; index < parts.length; index++) {
    const candidate = parts.slice(index).join(".");
    const icon = icons.fileExtensions[candidate];
    if (icon) return icon;
  }
  return undefined;
}

/**
 * Icon id for a file path, or `undefined` when nothing in the manifest matched.
 *
 * The distinction matters: a `title=` is free text, so `title="Terminal"` is a
 * label rather than a filename and has to be recognisable as a miss.
 */
function matchFileIcon(path: string): string | undefined {
  const name = basename(path.trim());
  if (!name) return undefined;
  return icons.fileNames[name] ?? iconForExtension(name);
}

/** Icon id for a Shiki language id, or `undefined` when nothing matched. */
function matchLanguageIcon(language: string): string | undefined {
  const id = language.trim().toLowerCase();
  if (!id) return undefined;

  const alias = LANGUAGE_ALIASES[id];
  // An empty alias means the language has no meaningful icon of its own.
  if (alias === "") return undefined;

  // A language id the manifest does not know may still name an extension —
  // `zig` and `prisma` reach their icons that way.
  const resolved = alias ?? id;
  return icons.languageIds[resolved] ?? icons.fileExtensions[resolved];
}

/** Icon id for a file path or bare filename. */
export function fileIconId(path: string): string {
  return matchFileIcon(path) ?? icons.file;
}

/** Icon id for a Shiki language id, used when a block has no filename. */
export function languageIconId(language: string): string {
  return matchLanguageIcon(language) ?? icons.file;
}

/**
 * Icon id for a code block, which knows both a title and a language.
 *
 * The title wins when it names something the manifest recognises, because it is
 * the more specific of the two: `counter.tsx` under a `tsx` fence is still a
 * React component, but `types.ts` under a `typescript` fence is more precisely
 * described by the filename. A title that matches nothing is treated as a label
 * rather than a filename and the language is used instead, so a `bash` block
 * headed `Terminal` keeps its console glyph.
 */
export function codeIconId(name?: string, language?: string): string {
  return (
    (name ? matchFileIcon(name) : undefined) ??
    (language ? matchLanguageIcon(language) : undefined) ??
    icons.file
  );
}

/** Icon id for a directory name. */
export function folderIconId(name: string, expanded = false): string {
  const key = basename(name.trim().replace(/\/+$/, ""));
  const table = expanded ? icons.folderNamesExpanded : icons.folderNames;
  const fallback = expanded ? icons.folderExpanded : icons.folder;
  return (key && table[key]) || fallback;
}

/**
 * The SVG markup for an icon id, as `viewBox` plus inner content.
 *
 * The outer `<svg>` is discarded so the caller can size and label the element
 * itself; the icons carry their own fills and are not recoloured.
 */
export interface IconSvg {
  viewBox: string;
  body: string;
}

const svgCache = new Map<string, IconSvg | null>();

export function readIconSvg(iconId: string): IconSvg | null {
  const cached = svgCache.get(iconId);
  if (cached !== undefined) return cached;

  if (!ICONS_DIRECTORY) return null;

  let result: IconSvg | null = null;
  try {
    const markup = readFileSync(join(ICONS_DIRECTORY, `${iconId}.svg`), "utf8");
    const open = markup.match(/<svg\b[^>]*>/);
    const viewBox = open?.[0].match(/viewBox="([^"]+)"/)?.[1];

    if (open?.index !== undefined && viewBox) {
      result = {
        viewBox,
        body: markup.slice(open.index + open[0].length).replace("</svg>", ""),
      };
    }
  } catch {
    // A manifest entry without a shipped file: fall back to no icon rather
    // than failing the build over decoration.
  }

  svgCache.set(iconId, result);
  return result;
}
