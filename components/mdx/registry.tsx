/**
 * Central MDX component registry.
 *
 * Two layers: the HTML element renderers in `typographyComponents`, and the
 * components authors invoke as JSX tags. Element styling is deliberately kept
 * out of this file so the registry stays a readable index of what MDX can use.
 *
 * `createMdxComponents` additionally installs a diagnostic for tags that are
 * not registered, so a typo in an entry renders an actionable message instead
 * of taking down the page.
 */

import type { MDXComponents } from "next-mdx-remote-client/rsc";
import { Callout } from "@/components/mdx/callout";
import { CodeBlock, CodeFigure, Pre } from "@/components/mdx/code-block";
import { ComponentPreview } from "@/components/mdx/component-preview";
import { CopyButton } from "@/components/mdx/copy-button";
import { Details } from "@/components/mdx/details";
import { File, FileTree, Folder } from "@/components/mdx/file-tree";
import { Kbd } from "@/components/mdx/kbd";
import { CardGrid, LinkCard } from "@/components/mdx/link-card";
import { Prop, PropsTable } from "@/components/mdx/props-table";
import { Step, Steps } from "@/components/mdx/steps";
import { Tab, Tabs } from "@/components/mdx/tabs";
import { typographyComponents } from "@/components/mdx/typography";
import { UnregisteredComponentFallback } from "@/components/mdx/unregistered-fallback";

/**
 * Default HTML element overrides and registered custom components.
 */
export const baseMdxComponents = {
  // Annotation
  Callout,
  Details,

  // Code
  CodeBlock,
  CopyButton,
  ComponentPreview,

  // Structure
  Tabs,
  Tab,
  Steps,
  Step,
  FileTree,
  Folder,
  File,

  // Reference
  PropsTable,
  Prop,
  CardGrid,
  LinkCard,
  Kbd,

  // HTML elements
  ...typographyComponents,

  // Compiled code blocks arrive as <figure><pre><code>.
  figure: CodeFigure,
  pre: Pre,
};

/** Tag names an author can use, for the diagnostic fallback's suggestions. */
const registeredComponentNames = Object.keys(baseMdxComponents).filter((key) =>
  /^[A-Z]/.test(key),
);

/**
 * Builds the diagnostic renderer shown in place of an unregistered tag.
 */
function createFallback(name: string, availableComponents: string[]) {
  return function MissingComponent(props: Record<string, unknown>) {
    return (
      <UnregisteredComponentFallback
        componentName={name}
        availableComponents={availableComponents}
        props={props}
      />
    );
  };
}

/**
 * Creates an MDX component dictionary.
 *
 * When `source` is given, every capitalised JSX tag in the document is resolved
 * up front. MDX spreads the component map into a local object, so a Proxy alone
 * would not be consulted for a tag the map does not already contain; naming
 * them explicitly is what keeps an unknown tag from throwing at runtime.
 */
export function createMdxComponents(
  overrides?: MDXComponents,
  source?: string,
): MDXComponents {
  const merged: Record<string, unknown> = {
    ...baseMdxComponents,
    ...overrides,
  };
  const availableComponents = Object.keys(merged).filter((key) =>
    /^[A-Z]/.test(key),
  );

  if (source) {
    const jsxTagPattern = /<([A-Z][a-zA-Z0-9_]*)/g;
    for (const match of source.matchAll(jsxTagPattern)) {
      const name = match[1];
      if (!(name in merged)) {
        merged[name] = createFallback(name, availableComponents);
      }
    }
  }

  const proxy = new Proxy(merged, {
    get(target, property) {
      if (typeof property === "string" && property in target) {
        return target[property];
      }

      if (typeof property === "string" && /^[A-Z]/.test(property)) {
        return createFallback(property, availableComponents);
      }

      return Reflect.get(target, property);
    },
  });

  return proxy as unknown as MDXComponents;
}

export const defaultMdxComponents = createMdxComponents();

export { registeredComponentNames };
