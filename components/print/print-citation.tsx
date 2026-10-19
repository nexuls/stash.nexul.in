/**
 * Names the source of a printed page.
 *
 * A sheet that leaves the browser loses every address the screen carried, so
 * print runs a citation in the page margins: where the entry lives, who wrote
 * it, and which sheet of how many this is. Chrome draws those margin boxes
 * from `@page` in app/print.css, which cannot reach React state, so the entry's
 * own strings are handed to it as custom properties on the root element.
 *
 * Nothing here renders on screen: the declarations are only read by the margin
 * boxes, and those exist only on paper.
 */

import { siteConfig } from "@/lib/site-config";

/** Quotes a value for use as a CSS string token. */
function cssString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

interface PrintCitationProps {
  /** The entry's title, which opens the citation. */
  title: string;
  /** The entry's permalink, shown as the address it was read at. */
  permalink: string;
  /** The date the entry was last touched, if it carries one. */
  updated?: string;
}

export function PrintCitation({
  title,
  permalink,
  updated,
}: PrintCitationProps) {
  // The scheme is noise in a footer: the host and path are the address a
  // reader types back in.
  const address = `${siteConfig.url.replace(/^https?:\/\//, "")}${permalink}`;

  const declarations = [
    `--print-citation:${cssString(`${title} · ${address}`)}`,
    `--print-source:${cssString(`${siteConfig.name} · ${siteConfig.author.name}`)}`,
    updated ? `--print-updated:${cssString(`Updated ${updated}`)}` : null,
  ]
    .filter(Boolean)
    .join(";");

  return <style>{`:root{${declarations}}`}</style>;
}
