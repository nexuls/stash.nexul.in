/**
 * Reads the Material Icon Theme markup for the domains that have a glyph.
 *
 * Server-only, because it reaches the filesystem through `file-icons.ts`. The
 * sidebar is a Client Component, so the markup is resolved during static
 * generation in `app/stash/layout.tsx` and handed down as a prop: the theme's
 * icon files stay out of the client bundle and only the handful of domains the
 * archive actually has is paid for.
 */

import { domainMaterialIconId } from "@/lib/icons/domain-icons";
import { type IconSvg, readIconSvg } from "@/lib/icons/file-icons";

/** Domain glyphs, keyed by domain slug. A domain without one is absent. */
export type DomainIcons = Record<string, IconSvg>;

export function resolveDomainIcons(slugs: Iterable<string>): DomainIcons {
  const icons: DomainIcons = {};

  for (const slug of slugs) {
    const iconId = domainMaterialIconId(slug);
    if (!iconId) continue;

    const svg = readIconSvg(iconId);
    if (svg) icons[slug] = svg;
  }

  return icons;
}
