/**
 * Material Icon Theme glyph for a file, language or folder.
 *
 * A Server Component: the icon is read from disk during static generation and
 * inlined, so the markup costs one element in the HTML and nothing in the
 * client bundle. The icons carry their own colours, which is the point — they
 * are recognised by hue as much as by shape — so nothing here recolours them.
 *
 * Decorative by default. A block already names its language in the panel header
 * and a tree row already shows the filename, so the icon repeats information
 * that is on screen and is hidden from assistive technology.
 */

import { codeIconId, folderIconId, readIconSvg } from "@/lib/icons/file-icons";
import { cn } from "@/lib/utils";

interface FileIconProps {
  /** Filename or path; the most specific source, so it wins. */
  name?: string;
  /** Shiki language id, used when there is no filename. */
  language?: string;
  /** Render a folder icon for `name` instead of a file icon. */
  folder?: boolean;
  /** Use the opened-folder variant. */
  open?: boolean;
  className?: string;
}

export function FileIcon({
  name,
  language,
  folder = false,
  open = false,
  className,
}: FileIconProps) {
  if (!folder && !name && !language) return null;

  const iconId = folder
    ? folderIconId(name ?? "", open)
    : codeIconId(name, language);

  const svg = readIconSvg(iconId);
  if (!svg) return null;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={svg.viewBox}
      className={cn("size-4 shrink-0", className)}
      // Build-time markup from the theme package, not from content.
      // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted package asset
      dangerouslySetInnerHTML={{ __html: svg.body }}
    />
  );
}
