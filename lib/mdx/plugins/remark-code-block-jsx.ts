/**
 * Compiles `<CodeBlock code={...} />` into a real fenced code block.
 *
 * Authors reach for the JSX form when the code lives in a prop rather than in
 * a fence, but a React component cannot run Shiki: highlighting happens in the
 * compile pipeline. Rewriting the tag to a `code` node before rehype-pretty-code
 * runs means both forms are highlighted by the same pass and render identically,
 * instead of the JSX form arriving as flat text beside its highlighted
 * neighbours.
 *
 * Only statically known values can be lifted. A tag whose `code` is computed at
 * runtime is left alone and still renders through the `CodeBlock` component.
 */

import type { HastNode } from "./hast";

interface EstreeNode {
  type: string;
  value?: unknown;
  raw?: string;
  quasis?: Array<{ value: { cooked?: string; raw: string } }>;
  expressions?: unknown[];
  elements?: EstreeNode[];
  body?: Array<{ type: string; expression?: EstreeNode }>;
}

interface MdxAttribute {
  type: string;
  name?: string;
  value?:
    | string
    | {
        type?: string;
        value?: string;
        data?: { estree?: EstreeNode };
      };
}

interface MdastNode extends HastNode {
  name?: string;
  lang?: string;
  meta?: string;
  attributes?: MdxAttribute[];
}

/** Unwraps the single expression an MDX attribute's estree program holds. */
function expressionOf(attribute: MdxAttribute): EstreeNode | undefined {
  if (typeof attribute.value === "string" || !attribute.value) return undefined;
  const statement = attribute.value.data?.estree?.body?.[0];
  return statement?.type === "ExpressionStatement"
    ? statement.expression
    : undefined;
}

/** Reads a string attribute, from either a literal or a plain template. */
function readString(attribute: MdxAttribute): string | undefined {
  if (typeof attribute.value === "string") return attribute.value;

  const expression = expressionOf(attribute);
  if (!expression) return undefined;

  if (expression.type === "Literal" && typeof expression.value === "string") {
    return expression.value;
  }

  // A template literal is only static when nothing is interpolated into it.
  if (
    expression.type === "TemplateLiteral" &&
    (expression.expressions?.length ?? 0) === 0
  ) {
    return (
      expression.quasis?.[0]?.value.cooked ?? expression.quasis?.[0]?.value.raw
    );
  }

  return undefined;
}

/** Reads a boolean attribute; a bare attribute counts as `true`. */
function readBoolean(attribute: MdxAttribute): boolean | undefined {
  if (attribute.value === null || attribute.value === undefined) return true;
  if (typeof attribute.value === "string") return attribute.value !== "false";

  const expression = expressionOf(attribute);
  return expression?.type === "Literal" && typeof expression.value === "boolean"
    ? expression.value
    : undefined;
}

/** Reads an array of numbers, for `highlightLines`. */
function readNumbers(attribute: MdxAttribute): number[] | undefined {
  const expression = expressionOf(attribute);
  if (expression?.type !== "ArrayExpression") return undefined;

  const numbers: number[] = [];
  for (const element of expression.elements ?? []) {
    if (element?.type !== "Literal" || typeof element.value !== "number") {
      return undefined;
    }
    numbers.push(element.value);
  }
  return numbers;
}

/** Collapses consecutive line numbers into `{1,3-5}` meta syntax. */
export function formatLineRanges(lines: number[]): string {
  const sorted = [...new Set(lines)].sort((a, b) => a - b);
  const ranges: string[] = [];

  let start = sorted[0];
  let previous = sorted[0];

  for (const line of sorted.slice(1)) {
    if (line === previous + 1) {
      previous = line;
      continue;
    }
    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = line;
    previous = line;
  }

  if (start !== undefined) {
    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
  }

  return `{${ranges.join(",")}}`;
}

export function remarkCodeBlockJsx() {
  return (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      const children = (node.children ?? []) as MdastNode[];

      for (let index = 0; index < children.length; index++) {
        const child = children[index];

        if (
          child.type === "mdxJsxFlowElement" &&
          child.name === "CodeBlock" &&
          Array.isArray(child.attributes)
        ) {
          const byName = new Map<string, MdxAttribute>();
          for (const attribute of child.attributes) {
            if (attribute.type === "mdxJsxAttribute" && attribute.name) {
              byName.set(attribute.name, attribute);
            }
          }

          const codeAttribute = byName.get("code");
          const code = codeAttribute ? readString(codeAttribute) : undefined;

          if (code !== undefined) {
            const language = byName.get("language");
            const filename = byName.get("filename");
            const showLineNumbers = byName.get("showLineNumbers");
            const highlightLines = byName.get("highlightLines");

            const meta: string[] = [];
            const title = filename ? readString(filename) : undefined;
            if (title) meta.push(`title="${title}"`);
            if (showLineNumbers && readBoolean(showLineNumbers)) {
              meta.push("showLineNumbers");
            }
            const lines = highlightLines
              ? readNumbers(highlightLines)
              : undefined;
            if (lines && lines.length > 0) meta.push(formatLineRanges(lines));

            children[index] = {
              type: "code",
              lang:
                (language ? readString(language) : undefined) ?? "plaintext",
              meta: meta.join(" ") || undefined,
              value: code,
            } as MdastNode;
            continue;
          }
        }

        visit(child);
      }
    };

    visit(tree);
  };
}
