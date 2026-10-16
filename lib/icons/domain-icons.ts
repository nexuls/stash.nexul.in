/**
 * Resolves a knowledge domain to the icon that represents it.
 *
 * The sidebar's domain switcher is the only place a domain is shown as a mark
 * rather than as its name, so the mapping lives here instead of in a component.
 * Domains are directories, so names are matched loosely.
 *
 * Two kinds of mark, in order of preference:
 *
 *   1. A Material Icon Theme glyph, for a domain that names a technology with a
 *      mark a reader already knows (React, TypeScript). Only the id is chosen
 *      here; the markup is read from disk by `domain-icon-svg.ts`, which is
 *      server-only, so this module stays importable from a Client Component.
 *   2. A Lucide icon, for everything else, falling back to a folder.
 */

import {
  Code2,
  Database,
  FileCode2,
  FolderOpen,
  type LucideIcon,
  PenLine,
  Server,
  Terminal,
} from "lucide-react";

/**
 * Domains whose mark is a Material Icon Theme glyph, keyed by the substring
 * that identifies the domain. The values are icon ids in that theme, not file
 * names, and `readIconSvg` is what turns one into markup.
 */
const MATERIAL_DOMAIN_ICONS: Record<string, string> = {
  react: "react",
  typescript: "typescript",
  // The authoring domain is about writing MDX, so it takes the MDX glyph
  // rather than the plain Markdown one it shares its shape with.
  authoring: "mdx",
};

/**
 * Material icon id for a domain, or `undefined` when the domain has no glyph of
 * its own and should use its Lucide icon.
 */
export function domainMaterialIconId(name: string): string | undefined {
  const normalized = name.toLowerCase();
  for (const [key, iconId] of Object.entries(MATERIAL_DOMAIN_ICONS)) {
    if (normalized.includes(key)) return iconId;
  }
  return undefined;
}

export function getDomainIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase();
  if (normalized.includes("react")) return Code2;
  if (normalized.includes("typescript") || normalized.includes("type"))
    return FileCode2;
  if (normalized.includes("authoring") || normalized.includes("writing"))
    return PenLine;
  if (
    normalized.includes("tui") ||
    normalized.includes("terminal") ||
    normalized.includes("linux") ||
    normalized.includes("bash")
  )
    return Terminal;
  if (normalized.includes("backend") || normalized.includes("api"))
    return Server;
  if (normalized.includes("db") || normalized.includes("database"))
    return Database;
  return FolderOpen;
}
