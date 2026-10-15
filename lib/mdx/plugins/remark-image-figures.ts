/**
 * Promotes standalone images to figures.
 *
 * Markdown wraps every image in a paragraph, so a diagram cannot carry a
 * caption without invalid nesting: `<figure>` is not allowed inside `<p>`. This
 * plugin retags the paragraph around a lone image as a `<div>` and marks the
 * image itself, which lets the renderer emit a captioned figure for a standalone
 * diagram while an image sitting in a sentence stays inline.
 */

import type { HastNode } from "./hast";

interface MdastNode extends HastNode {
  url?: string;
  title?: string | null;
  alt?: string | null;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

/** True for whitespace-only text, which Markdown leaves around an image. */
function isBlank(node: MdastNode): boolean {
  return node.type === "text" && (node.value ?? "").trim() === "";
}

export function remarkImageFigures() {
  return (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      if (node.type === "paragraph") {
        const children = (node.children ?? []) as MdastNode[];
        const meaningful = children.filter((child) => !isBlank(child));
        const [only] = meaningful;

        if (meaningful.length === 1 && only?.type === "image") {
          node.data = {
            ...node.data,
            // `<figure>` cannot live inside `<p>`; a div can hold either.
            hName: "div",
          };
          only.data = {
            ...only.data,
            hProperties: { ...only.data?.hProperties, "data-figure": "" },
          };
        }
      }

      for (const child of (node.children ?? []) as MdastNode[]) {
        visit(child);
      }
    };

    visit(tree);
  };
}
