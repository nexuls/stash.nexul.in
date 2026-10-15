/**
 * Turns line numbers on for every code block unless the author opts out.
 *
 * Numbered lines are what an entry is usually for: the surrounding prose refers
 * to "line 12", and a reader comparing a snippet against their own file needs
 * the gutter. Making authors remember `showLineNumbers` on every fence meant
 * most blocks silently went without it, so the default is inverted here and the
 * opt-out is explicit:
 *
 * ```ts showLineNumbers=false
 * <CodeBlock showLineNumbers={false} />
 * ```
 *
 * This runs after `remarkCodeBlockJsx`, so a lowered `<CodeBlock>` is already a
 * fence by the time it is seen and both forms go through one rule. The opt-out
 * token is stripped rather than left in place: rehype-pretty-code matches a
 * bare `showLineNumbers` anywhere in the meta string and would read
 * `showLineNumbers=false` as a request to switch them on.
 */

import type { HastNode } from "./hast";

interface MdastNode extends HastNode {
  meta?: string | null;
  value?: string;
}

/** `showLineNumbers=false`, or the shorter `noLineNumbers`. */
const OPT_OUT = /\s*\b(?:showLineNumbers\s*=\s*false|noLineNumbers)\b/g;

/** A real request for line numbers, with or without a start value. */
const OPT_IN = /\bshowLineNumbers\b(?!\s*=)/;

export function remarkCodeLineNumbers() {
  return (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      if (node.type === "code") {
        const meta = node.meta ?? "";

        if (OPT_OUT.test(meta)) {
          OPT_OUT.lastIndex = 0;
          const stripped = meta.replace(OPT_OUT, "").trim();
          node.meta = stripped || undefined;
          return;
        }
        OPT_OUT.lastIndex = 0;

        if (!OPT_IN.test(meta)) {
          node.meta = meta ? `${meta} showLineNumbers` : "showLineNumbers";
        }
        return;
      }

      for (const child of (node.children ?? []) as MdastNode[]) {
        visit(child);
      }
    };

    visit(tree);
    return tree;
  };
}
