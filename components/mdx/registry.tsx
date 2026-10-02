/**
 * Central MDX component registry.
 *
 * Maps MDX elements and custom components (Callout, Tabs, Tab, Details, CodeBlock)
 * to design-system compliant components. Includes an author-facing fallback that intercepts
 * unregistered component usage to provide diagnostics without crashing.
 */

import Link from "next/link";
import type { MDXComponents } from "next-mdx-remote-client/rsc";
import type * as React from "react";
import { Callout } from "@/components/mdx/callout";
import { CodeBlock, CodeFigure, Pre } from "@/components/mdx/code-block";
import { CopyButton } from "@/components/mdx/copy-button";
import { Details } from "@/components/mdx/details";
import { Tab, Tabs } from "@/components/mdx/tabs";
import { UnregisteredComponentFallback } from "@/components/mdx/unregistered-fallback";
import { cn } from "@/lib/utils";

/**
 * Standard anchor link handler for MDX.
 * Automatically uses Next.js Link for internal Stash routes.
 */
function AnchorLink({
  href = "",
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");

  if (isInternal) {
    return (
      <Link
        href={href}
        className={cn(
          "font-medium text-foreground underline decoration-border/80 underline-offset-4 transition-colors hover:decoration-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-medium text-foreground underline decoration-border/80 underline-offset-4 transition-colors hover:decoration-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Responsive table container for MDX.
 */
function TableWrapper({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-6 w-full overflow-x-auto rounded-lg border border-border">
      <table
        className={cn("w-full caption-bottom text-left text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

/**
 * Default HTML element overrides and registered custom components.
 */
export const baseMdxComponents = {
  // Custom interactive components
  Callout,
  Tabs,
  Tab,
  Details,
  CodeBlock,
  CopyButton,

  // Enhanced HTML elements
  h1: ({ className, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
    <h1
      className={cn(
        "scroll-mt-24 font-bold text-3xl text-foreground tracking-tight lg:text-4xl",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={cn(
        "mt-10 scroll-mt-24 border-b border-border/60 pb-2 font-semibold text-foreground text-xl tracking-tight first:mt-0 lg:text-2xl",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
    <h3
      className={cn(
        "mt-8 scroll-mt-24 font-semibold text-foreground text-lg tracking-tight lg:text-xl",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: React.ComponentPropsWithoutRef<"h4">) => (
    <h4
      className={cn(
        "mt-6 scroll-mt-24 font-semibold text-base text-foreground tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: React.ComponentPropsWithoutRef<"p">) => (
    <p
      className={cn(
        "text-foreground/90 leading-7 [&:not(:first-child)]:mt-4",
        className,
      )}
      {...props}
    />
  ),
  a: AnchorLink,
  ul: ({ className, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
    <ul
      className={cn(
        "my-4 ml-6 list-disc space-y-1 text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
    <ol
      className={cn(
        "my-4 ml-6 list-decimal space-y-1 text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.ComponentPropsWithoutRef<"li">) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  blockquote: ({
    className,
    ...props
  }: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className={cn(
        "mt-6 border-primary/60 border-l-2 pl-4 italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  table: TableWrapper,
  thead: ({ className, ...props }: React.ComponentPropsWithoutRef<"thead">) => (
    <thead
      className={cn("border-border border-b bg-muted/50", className)}
      {...props}
    />
  ),
  tbody: ({ className, ...props }: React.ComponentPropsWithoutRef<"tbody">) => (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
  tr: ({ className, ...props }: React.ComponentPropsWithoutRef<"tr">) => (
    <tr
      className={cn(
        "border-border border-b transition-colors hover:bg-muted/40",
        className,
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.ComponentPropsWithoutRef<"td">) => (
    <td
      className={cn("p-4 align-middle text-foreground/90", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }: React.ComponentPropsWithoutRef<"hr">) => (
    <hr className={cn("my-8 border-border", className)} {...props} />
  ),
  code: ({
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"code">) => {
    // If inside a pre tag (data-language present), keep as is for Shiki styling
    if ((props as Record<string, unknown>)["data-language"] !== undefined) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    // Inline code styling
    return (
      <code
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-medium font-mono text-foreground text-xs",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: Pre,
  figure: CodeFigure,
};

/**
 * Creates an MDX component dictionary.
 *
 * If `source` is provided, discovers all custom uppercase JSX tags used in the MDX
 * and pre-registers informative diagnostic fallbacks so MDX's internal component
 * spread `{ ...props.components }` preserves them instead of throwing runtime errors.
 */
export function createMdxComponents(
  overrides?: MDXComponents,
  source?: string,
): MDXComponents {
  const merged: Record<string, unknown> = {
    ...baseMdxComponents,
    ...overrides,
  };
  const registeredNames = Object.keys(merged).filter((key) =>
    /^[A-Z]/.test(key),
  );

  if (source) {
    const jsxTagRegex = /<([A-Z][a-zA-Z0-9_]*)/g;
    let match: RegExpExecArray | null = jsxTagRegex.exec(source);
    while (match !== null) {
      const name = match[1];
      if (!(name in merged)) {
        merged[name] = function MissingComponentFallback(
          props: Record<string, unknown>,
        ) {
          return (
            <UnregisteredComponentFallback
              componentName={name}
              availableComponents={registeredNames}
              props={props}
            />
          );
        };
      }
      match = jsxTagRegex.exec(source);
    }
  }

  const proxy = new Proxy(merged, {
    get(target, prop) {
      if (typeof prop === "string" && prop in target) {
        return target[prop];
      }

      // If prop starts with an uppercase letter, it's an intended custom React/MDX component
      if (typeof prop === "string" && /^[A-Z]/.test(prop)) {
        return function MissingComponentProxy(props: Record<string, unknown>) {
          return (
            <UnregisteredComponentFallback
              componentName={prop}
              availableComponents={registeredNames}
              props={props}
            />
          );
        };
      }

      return Reflect.get(target, prop);
    },
  });

  return proxy as unknown as MDXComponents;
}

export const defaultMdxComponents = createMdxComponents();
