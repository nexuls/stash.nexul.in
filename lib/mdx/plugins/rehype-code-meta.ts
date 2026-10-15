/**
 * Lifts code-block metadata onto the `<figure>` produced by rehype-pretty-code.
 *
 * rehype-pretty-code describes a code block across three nested elements: the
 * title lives in a `<figcaption>`, the language on the `<pre>`, and the line
 * count only implicitly in the number of `[data-line]` children. Resolving that
 * in React means inspecting `children`, which is brittle and forces the code
 * figure to be a client component. This plugin resolves it once at build time
 * and writes the answers onto the figure as data attributes, so the renderer is
 * a plain function of its props.
 *
 * It also marks diff lines structurally (`data-diff="add" | "del"`) instead of
 * leaving the stylesheet to match Shiki's generated token colors.
 */

import {
  type HastNode,
  isElement,
  stringProperty,
  textContent,
  walk,
} from "./hast";

/** Languages rendered as a terminal session rather than a source file. */
const TERMINAL_LANGUAGES = new Set([
  "bash",
  "sh",
  "shell",
  "zsh",
  "fish",
  "powershell",
  "ps1",
  "console",
  "terminal",
]);

function findDescendant(node: HastNode, tagName: string): HastNode | undefined {
  let found: HastNode | undefined;
  walk(node, (candidate) => {
    if (!found && isElement(candidate, tagName)) {
      found = candidate;
    }
  });
  return found;
}

/**
 * Marks each line of a diff block as an addition, a deletion, or context.
 *
 * Returns the number of added and removed lines so the figure header can report
 * the shape of the change without re-reading the code.
 */
function annotateDiffLines(code: HastNode): {
  additions: number;
  deletions: number;
} {
  let additions = 0;
  let deletions = 0;

  for (const line of code.children ?? []) {
    if (
      line.type !== "element" ||
      line.properties?.["data-line"] === undefined
    ) {
      continue;
    }

    const text = textContent(line).trimStart();
    line.properties ??= {};

    if (text.startsWith("+")) {
      line.properties["data-diff"] = "add";
      additions += 1;
    } else if (text.startsWith("-")) {
      line.properties["data-diff"] = "del";
      deletions += 1;
    }
  }

  return { additions, deletions };
}

/**
 * Rehype plugin. Runs after rehype-pretty-code.
 */
export function rehypeCodeMeta() {
  return (tree: HastNode) => {
    walk(tree, (node) => {
      if (
        !isElement(node, "figure") ||
        node.properties?.["data-rehype-pretty-code-figure"] === undefined
      ) {
        return;
      }

      const children = node.children ?? [];
      const caption = children.find(
        (child) =>
          isElement(child, "figcaption") &&
          child.properties?.["data-rehype-pretty-code-title"] !== undefined,
      );

      const title = caption ? textContent(caption).trim() : undefined;
      if (caption) {
        // The header is rebuilt in React from these attributes; leaving the
        // figcaption in place would render the title twice.
        node.children = children.filter((child) => child !== caption);
      }

      const pre = findDescendant(node, "pre");
      const code = pre ? findDescendant(pre, "code") : undefined;
      const language =
        stringProperty(pre ?? node, "data-language") ??
        stringProperty(caption ?? node, "data-language") ??
        "plaintext";

      node.properties ??= {};
      node.properties["data-language"] = language;
      if (title) {
        node.properties["data-title"] = title;
      }
      if (TERMINAL_LANGUAGES.has(language.toLowerCase())) {
        node.properties["data-terminal"] = "";
      }

      if (!code) {
        return;
      }

      const lines = (code.children ?? []).filter(
        (child) =>
          child.type === "element" &&
          child.properties?.["data-line"] !== undefined,
      );
      node.properties["data-line-count"] = String(lines.length);

      code.properties ??= {};
      const showsLineNumbers =
        code.properties["data-line-numbers"] !== undefined;
      if (showsLineNumbers) {
        node.properties["data-line-numbers"] = "";

        // rehype-pretty-code reports the widest line number it emitted; the
        // gutter is sized from it so a 3-digit block does not clip and a
        // 2-line block does not reserve empty space. The value arrives as a
        // number or a string depending on how the property was written.
        const digits = Number(
          code.properties["data-line-numbers-max-digits"] ?? 2,
        );
        const style =
          typeof code.properties.style === "string"
            ? code.properties.style
            : "";
        code.properties.style = `${style};--stash-line-digits:${Number.isFinite(digits) && digits > 0 ? digits : 2}`;
      }

      if (language.toLowerCase() === "diff") {
        const { additions, deletions } = annotateDiffLines(code);
        node.properties["data-diff-additions"] = String(additions);
        node.properties["data-diff-deletions"] = String(deletions);
      }
    });
  };
}
