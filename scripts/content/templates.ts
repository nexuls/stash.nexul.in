/**
 * What a new document starts as.
 *
 * The templates are MDX files rather than strings in here, so editing what new
 * notes look like does not mean editing the tool.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatSlugToTitle } from "../../lib/content";
import { today } from "./frontmatter";

const TEMPLATE_DIR = join(import.meta.dir, "templates");

export type TemplateName = "entry" | "home";

export interface TemplateValues {
  title: string;
  description: string;
  tags: string[];
  date?: string;
}

/**
 * Fills a template's placeholders. `{{TAGS}}` stands on a line of its own and
 * expands to a block list, or drops the line entirely when there are no tags.
 */
export function renderTemplate(
  name: TemplateName,
  values: TemplateValues,
): string {
  const raw = readFileSync(join(TEMPLATE_DIR, `${name}.mdx`), "utf-8");
  const tagLines =
    values.tags.length === 0
      ? []
      : ["tags:", ...values.tags.map((tag) => `  - ${tag}`)];

  return raw
    .split("\n")
    .flatMap((line) => (line.trim() === "{{TAGS}}" ? tagLines : [line]))
    .join("\n")
    .replace(/\{\{TITLE\}\}/g, values.title)
    .replace(/\{\{DESCRIPTION\}\}/g, values.description)
    .replace(/\{\{DATE\}\}/g, values.date ?? today());
}

/** A title to offer for a new directory, from its slug. */
export function suggestTitle(slug: string): string {
  return formatSlugToTitle(slug);
}
