/**
 * Minimal hast helpers for the Stash MDX plugins.
 *
 * The unified ecosystem ships `unist-util-visit` and friends, but Stash only
 * needs a depth-first walk and a text collector. Keeping these local avoids
 * depending on packages that are only present transitively.
 */

export interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * Walks the tree depth-first, calling `visitor` for every node with its parent.
 */
export function walk(
  node: HastNode,
  visitor: (node: HastNode, parent: HastNode | null) => void,
  parent: HastNode | null = null,
): void {
  visitor(node, parent);
  for (const child of node.children ?? []) {
    walk(child, visitor, node);
  }
}

/**
 * Concatenates every text node beneath `node`.
 */
export function textContent(node: HastNode): string {
  if (node.type === "text") {
    return node.value ?? "";
  }
  let out = "";
  for (const child of node.children ?? []) {
    out += textContent(child);
  }
  return out;
}

/**
 * Reads a string property from a hast element.
 */
export function stringProperty(
  node: HastNode,
  name: string,
): string | undefined {
  const value = node.properties?.[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * True when the node is an element with the given tag name.
 */
export function isElement(node: HastNode, tagName: string): boolean {
  return node.type === "element" && node.tagName === tagName;
}
