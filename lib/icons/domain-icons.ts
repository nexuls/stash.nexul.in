/**
 * Resolves a knowledge domain to the icon that represents it.
 *
 * The sidebar's domain switcher is the only place a domain is shown as a mark
 * rather than as its name, so the mapping lives here instead of in a component.
 * Domains are directories, so names are matched loosely and fall back to a
 * folder.
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

export function getDomainIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase();
  if (normalized.includes("react")) return Code2;
  if (normalized.includes("typescript") || normalized.includes("type"))
    return FileCode2;
  if (normalized.includes("authoring") || normalized.includes("writing"))
    return PenLine;
  if (normalized.includes("linux") || normalized.includes("bash"))
    return Terminal;
  if (normalized.includes("backend") || normalized.includes("api"))
    return Server;
  if (normalized.includes("db") || normalized.includes("database"))
    return Database;
  return FolderOpen;
}
