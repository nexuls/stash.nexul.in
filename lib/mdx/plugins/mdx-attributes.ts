/**
 * Reading and writing attributes on MDX JSX nodes.
 *
 * Several plugins fill an authored tag with what only the pipeline knows — the
 * entry directory, a file's size, a compile-time diagnostic — and all of them
 * need the same two operations over the `attributes` array mdast-util-mdx puts
 * on a JSX node. They live here so a tag-filling plugin is only its own logic.
 */

export interface MdxAttribute {
  type: string;
  name?: string;
  value?: unknown;
}

/** Reads a plain string attribute; anything expression-valued is ignored. */
export function readStringAttribute(
  attributes: MdxAttribute[],
  name: string,
): string | undefined {
  const attribute = attributes.find(
    (candidate) =>
      candidate.type === "mdxJsxAttribute" && candidate.name === name,
  );
  return typeof attribute?.value === "string" ? attribute.value : undefined;
}

/** Sets a string attribute, replacing any value the author wrote. */
export function setAttribute(
  attributes: MdxAttribute[],
  name: string,
  value: string,
): void {
  const existing = attributes.find(
    (candidate) =>
      candidate.type === "mdxJsxAttribute" && candidate.name === name,
  );
  if (existing) {
    existing.value = value;
    return;
  }
  attributes.push({ type: "mdxJsxAttribute", name, value });
}
