/**
 * Drops a leading `# Heading` from an entry body.
 *
 * An entry's title is derived from its first top-level heading when frontmatter
 * does not give one, and the route renders that title as the page masthead. A
 * document that opens with `# useDebounce Hook` would therefore print its own
 * name twice. Removing it here rather than asking authors to omit it keeps the
 * document readable on disk, where there is no masthead.
 *
 * Only a heading that opens the document is removed; a `#` later in the body is
 * the author structuring the page and is left alone.
 */

import type { HastNode } from "./hast";

interface MdastNode extends HastNode {
  depth?: number;
}

export function remarkStripTitleHeading() {
  return (tree: MdastNode) => {
    const children = (tree.children ?? []) as MdastNode[];
    if (children[0]?.type === "heading" && children[0].depth === 1) {
      tree.children = children.slice(1);
    }
  };
}
