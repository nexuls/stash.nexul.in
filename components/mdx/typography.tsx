/**
 * HTML element renderers for MDX documents.
 *
 * Every element an author can reach from Markdown or raw HTML is declared here,
 * so the document surface has one source of truth and nothing falls back to
 * browser defaults. Vertical rhythm is expressed as plain top and bottom
 * margins and left to collapse in normal flow, which keeps the spacing between
 * two blocks independent of the order they appear in.
 *
 * Sizes are relative to the document font size set by `.stash-doc`, so the
 * whole surface scales from one declaration.
 *
 * Colour works the same way, in two levels: running text inherits the dimmed
 * `--prose` set on `.stash-doc-body`, and anything the author marked up —
 * emphasis, inline code, links, term names, table headers — opts up to
 * `--prose-emphasis`. Nothing here restates a foreground colour for plain
 * text, so the balance is tuned in components/mdx/styles/tokens.css.
 */

import Link from "next/link";
import type * as React from "react";
import { HeadingLinkButton } from "@/components/mdx/heading-link-button";
import { MdxImage } from "@/components/mdx/image";
import { Kbd } from "@/components/mdx/kbd";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Headings                                                                   */
/* -------------------------------------------------------------------------- */

type HeadingLevel = "h2" | "h3" | "h4" | "h5" | "h6";

/**
 * Builds a heading that carries its own anchor.
 *
 * The control follows the heading text inline (see `.stash-anchor`) and is
 * revealed on hover or keyboard focus. It copies a permalink rather than
 * navigating, so it is a button and not an anchor.
 */
function createHeading(level: HeadingLevel, headingClassName: string) {
  const Tag = level;

  function Heading({
    className,
    id,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<HeadingLevel>) {
    return (
      <Tag
        id={id}
        className={cn(
          "stash-heading scroll-mt-24 font-display text-foreground",
          headingClassName,
          className,
        )}
        {...props}
      >
        {children}
        {id && <HeadingLinkButton id={id} />}
      </Tag>
    );
  }

  Heading.displayName = `Mdx${level.toUpperCase()}`;
  return Heading;
}

/* -------------------------------------------------------------------------- */
/* Links                                                                      */
/* -------------------------------------------------------------------------- */

const linkClassName = cn(
  "font-medium text-prose-emphasis underline decoration-primary/45 decoration-1 underline-offset-[3px]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm",
  "text-primary-foreground/70 hover:text-primary-foreground",
  "transition-colors hover:decoration-primary",
);

/**
 * Routes internal links through Next.js and opens external ones in a new tab.
 */
export function MdxLink({
  href = "",
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");

  if (isInternal) {
    return (
      <Link href={href} className={cn(linkClassName, className)} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(linkClassName, className)}
      {...props}
    >
      {children}
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Wraps a table in a scroll region.
 *
 * The region is focusable and labelled so a keyboard user can reach and scroll
 * a wide table, which a plain `overflow-x-auto` container does not allow.
 */
function MdxTable({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"table">) {
  return (
    <section
      aria-label="Table"
      // A wide table has to be scrollable by keyboard, which needs the
      // scroll container itself to be focusable.
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the scroll region must be keyboard reachable
      tabIndex={0}
      className="my-6 overflow-x-auto rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table
        className={cn(
          "w-full caption-bottom border-collapse text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </table>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Lists                                                                      */
/* -------------------------------------------------------------------------- */

/** remark-gfm marks task lists on the list and on each item. */
function isTaskList(className?: string): boolean {
  return Boolean(className?.includes("contains-task-list"));
}

function MdxUl({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      className={cn(
        "my-5 space-y-2",
        isTaskList(className)
          ? "list-none pl-0"
          : "list-disc pl-6 marker:text-muted-foreground/60",
        className,
      )}
      {...props}
    />
  );
}

function MdxOl({ className, ...props }: React.ComponentPropsWithoutRef<"ol">) {
  return (
    <ol
      className={cn(
        "my-5 list-decimal space-y-2 pl-6 marker:font-mono marker:text-muted-foreground/70 marker:tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function MdxLi({ className, ...props }: React.ComponentPropsWithoutRef<"li">) {
  return (
    <li
      className={cn(
        "leading-7 [&>ul]:my-2 [&>ol]:my-2 [&>p]:my-0",
        // A task item puts its checkbox where a marker would be.
        className?.includes("task-list-item") &&
          "flex items-baseline gap-2.5 [&>input]:translate-y-px",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The disabled checkbox remark-gfm emits for a task list item.
 *
 * It is styled rather than replaced so the checked state stays readable to
 * assistive technology, and left disabled because a document records state
 * rather than collecting it.
 */
function MdxInput({
  className,
  type,
  ...props
}: React.ComponentPropsWithoutRef<"input">) {
  if (type !== "checkbox") {
    return <input type={type} className={className} {...props} />;
  }

  // The checkmark is a mask image, so it is declared in globals.css rather
  // than inlined as a data URL in a utility class.
  return (
    <input
      type="checkbox"
      className={cn("stash-task-checkbox", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Inline code                                                                */
/* -------------------------------------------------------------------------- */

function MdxCode({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"code"> & Record<string, unknown>) {
  // Inside a compiled code block, Shiki owns the markup entirely.
  if (
    props["data-language"] !== undefined ||
    props["data-theme"] !== undefined
  ) {
    return (
      <code
        className={cn("bg-muted border border-b-2 px-1 rounded-sm", className)}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <code
      className={cn(
        "rounded border border-border/70 bg-muted px-[0.3em] py-[0.1em]",
        "font-mono text-[0.85em] text-prose-emphasis",
        // A link or heading already carries its own emphasis.
        "in-[a]:border-primary/25 in-[a]:text-inherit",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

/* -------------------------------------------------------------------------- */
/* Element map                                                                */
/* -------------------------------------------------------------------------- */

export const typographyComponents = {
  h1: ({ className, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
    <h1
      className={cn(
        "mt-0 mb-6 scroll-mt-24 font-display text-3xl font-semibold tracking-tight text-foreground lg:text-4xl",
        className,
      )}
      {...props}
    />
  ),
  h2: createHeading(
    "h2",
    "mt-12 mb-5 border-t border-border pt-8 text-[1.5rem] font-semibold leading-tight tracking-tight first:mt-0 first:border-0 first:pt-0",
  ),
  h3: createHeading(
    "h3",
    "mt-10 mb-4 text-[1.3125rem] font-semibold leading-snug tracking-tight",
  ),
  h4: createHeading(
    "h4",
    "mt-8 mb-3 text-[1.0625rem] font-semibold leading-snug",
  ),
  h5: createHeading(
    "h5",
    "mt-6 mb-2 text-[0.9375rem] font-semibold uppercase tracking-wide text-muted-foreground",
  ),
  h6: createHeading(
    "h6",
    "mt-6 mb-2 text-[0.875rem] font-semibold tracking-wide text-muted-foreground",
  ),

  p: ({ className, ...props }: React.ComponentPropsWithoutRef<"p">) => (
    <p className={cn("my-5", className)} {...props} />
  ),

  a: MdxLink,
  ul: MdxUl,
  ol: MdxOl,
  li: MdxLi,
  input: MdxInput,

  blockquote: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={cn(
        "my-6 border-l-2 border-primary/50 pl-5",
        "[&>p:first-child]:mt-0 [&>p:last-child]:mb-0",
        // A nested quotation steps back rather than adding another rule.
        "[&_blockquote]:border-border [&_blockquote]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),

  hr: ({ className, ...props }: React.ComponentPropsWithoutRef<"hr">) => (
    <hr className={cn("my-10 border-border", className)} {...props} />
  ),

  table: MdxTable,
  thead: ({ className, ...props }: React.ComponentPropsWithoutRef<"thead">) => (
    <thead className={cn("bg-muted/50", className)} {...props} />
  ),
  tbody: ({ className, ...props }: React.ComponentPropsWithoutRef<"tbody">) => (
    <tbody className={cn("divide-y divide-border", className)} {...props} />
  ),
  tr: ({ className, ...props }: React.ComponentPropsWithoutRef<"tr">) => (
    <tr
      className={cn("border-b border-border last:border-0", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className={cn(
        "px-4 py-2.5 text-left align-bottom font-medium text-prose-emphasis",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.ComponentPropsWithoutRef<"td">) => (
    <td
      className={cn(
        "px-4 py-2.5 align-top [&>code]:whitespace-nowrap",
        className,
      )}
      {...props}
    />
  ),
  caption: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"caption">) => (
    <caption
      className={cn("px-4 py-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  ),

  code: MdxCode,
  kbd: Kbd,
  img: MdxImage,

  strong: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"strong">) => (
    <strong
      className={cn("font-semibold text-prose-emphasis", className)}
      {...props}
    />
  ),
  em: ({ className, ...props }: React.ComponentPropsWithoutRef<"em">) => (
    <em className={cn("italic text-prose-emphasis", className)} {...props} />
  ),
  del: ({ className, ...props }: React.ComponentPropsWithoutRef<"del">) => (
    <del
      className={cn(
        "text-muted-foreground line-through decoration-1",
        className,
      )}
      {...props}
    />
  ),
  abbr: ({ className, ...props }: React.ComponentPropsWithoutRef<"abbr">) => (
    <abbr
      className={cn(
        "cursor-help underline decoration-dotted underline-offset-[3px]",
        className,
      )}
      {...props}
    />
  ),
  mark: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"mark"> & Record<string, unknown>) => (
    <mark
      className={cn(
        // Shiki wraps highlighted tokens in <mark>; those are styled as part
        // of the code panel and must not pick up prose highlighting.
        props["data-highlighted-chars"] === undefined &&
          "rounded bg-warn/20 px-0.5 text-prose-emphasis",
        className,
      )}
      {...props}
    />
  ),

  dl: ({ className, ...props }: React.ComponentPropsWithoutRef<"dl">) => (
    <dl className={cn("my-5 space-y-3", className)} {...props} />
  ),
  dt: ({ className, ...props }: React.ComponentPropsWithoutRef<"dt">) => (
    <dt
      className={cn("font-medium text-prose-emphasis", className)}
      {...props}
    />
  ),
  dd: ({ className, ...props }: React.ComponentPropsWithoutRef<"dd">) => (
    <dd className={cn("pl-5", className)} {...props} />
  ),

  /** Footnote references, emitted by remark-gfm. */
  sup: ({ className, ...props }: React.ComponentPropsWithoutRef<"sup">) => (
    <sup
      className={cn(
        "ml-0.5 text-[0.7em] [&>a]:font-mono [&>a]:no-underline [&>a]:text-primary",
        className,
      )}
      {...props}
    />
  ),
  sub: ({ className, ...props }: React.ComponentPropsWithoutRef<"sub">) => (
    <sub className={cn("text-[0.7em]", className)} {...props} />
  ),

  /** The footnote list that remark-gfm appends to the document. */
  section: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"section"> & Record<string, unknown>) => (
    <section
      className={cn(
        props["data-footnotes"] !== undefined &&
          "mt-12 border-t border-border pt-6 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
};
