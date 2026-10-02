# Content authoring

## Status

Implemented (Stage 1: Content foundation, Stage 2: MDX and code presentation).

## Entry convention

Every content entry in Stash is a directory under `content/` with a primary `README.mdx` document and optional adjacent code and media files:

```text
content/react/hooks/use-debounce/
├── README.mdx
├── debounce-diagram.svg
└── use-debounce.ts
```

### Hierarchy and slugs

- **Directory path**: Defines the route slug after `/stash/`.
- **Kebab-case requirement**: All directory segments must be lowercase kebab-case (e.g. `use-debounce`, `command-menu`).
- **Category hierarchy**: Parent directories become category segments (e.g. `react/hooks/use-debounce` -> categories `["react", "hooks"]`, primary category `"react"`).
- **Auto-discovery**: No manual route, navigation, or search registry updates are required.

## Frontmatter specification

Frontmatter is optional and minimal. Surrounding `---` YAML delimiters are parsed at build time:

```yaml
---
title: useDebounce Hook
description: A production-ready custom hook to debounce rapidly updating values.
date: 2026-10-02
tags:
  - react
  - hooks
  - performance
draft: false
deprecated: false
category: react
order: 1
---
```

### Supported fields

| Field | Type | Required | Description / Default Behavior |
| --- | --- | --- | --- |
| `title` | `string` | Optional | If omitted, defaults to the document's first `# Heading`. If no `# Heading`, uses any heading, or formats the directory slug (`use-debounce` -> `Use Debounce`). |
| `description` | `string` | Optional | If omitted, defaults to the first readable body paragraph (markdown stripped, truncated at word boundary ~180 chars). |
| `date` | `string` | Optional | Publication or creation date in ISO format (`YYYY-MM-DD`). |
| `updated` | `string` | Optional | Last updated date in ISO format (`YYYY-MM-DD`). |
| `tags` | `string[]` | Optional | Array of topic tags used for search indexing and categorization. |
| `draft` | `boolean` | Optional | Defaults to `false`. When `true`, excluded from default entry listings. |
| `deprecated` | `boolean \| string` | Optional | Defaults to `false`. Can be boolean or a deprecation notice string. |
| `category` | `string` | Optional | Explicit category override if different from primary parent directory. |
| `order` | `number` | Optional | Optional manual ordering weight for navigation. |

## Code blocks and presentation

Fenced code blocks are powered by `rehype-pretty-code` with dual light/dark themes (`github-light` and `github-dark`), language badges, and one-click copy buttons.

### Filenames and titles

Add a `title="..."` attribute to display a file path or title in the header bar:

````markdown
```typescript title="lib/debounce.ts"
export function debounce(fn: Function, ms = 300) {
  // ...
}
```
````

### Line numbers

Add `showLineNumbers` to render line numbers using CSS counters. Line numbers are never copied when the user clicks the copy button:

````markdown
```typescript title="lib/math.ts" showLineNumbers
export function add(a: number, b: number) {
  return a + b;
}
```
````

### Line highlighting

Specify single lines or line ranges in curly brackets:

````markdown
```typescript {2,4-6}
const a = 1;
const b = 2; // highlighted
const c = 3;
const d = 4; // highlighted
const e = 5; // highlighted
const f = 6; // highlighted
```
````

### Word highlighting

Wrap specific words in quotes to highlight tokens across lines:

````markdown
```typescript "useState"
import { useState } from "react";
const [value, setValue] = useState("");
```
````

### Terminal blocks

Use `bash`, `sh`, `shell`, or `zsh` as the code fence language. Terminal blocks feature an interactive terminal prompt icon:

````markdown
```bash
bun add next-mdx-remote-client
```
````

### Diff blocks

Use the `diff` language identifier. Lines starting with `+` are highlighted in green, lines starting with `-` are highlighted in red:

````markdown
```diff
- const timeout = 100;
+ const timeout = 300;
```
````

## Interactive MDX components

The following custom components are built-in and globally available in all MDX documents:

### Callout

Renders an accessible callout box with semantic visual styling, icons, and ARIA attributes:

```mdx
<Callout type="note" title="Author Note">
  This is helpful contextual information.
</Callout>

<Callout type="tip">
  Use Bun for lightning-fast test execution.
</Callout>

<Callout type="warning">
  Avoid mutating state directly.
</Callout>

<Callout type="danger">
  Permanently deletes the configuration.
</Callout>

<Callout type="important">
  Always review security credentials before deployment.
</Callout>
```

Supported types: `note` (default), `tip`, `warning`, `danger`, `important` (aliases `info` and `caution` are automatically normalized).

### Tabs and Tab

Tabbed containers for multi-language snippets or multi-tool workflows:

```mdx
<Tabs items={["Bun", "pnpm", "npm"]}>
  <Tab value="Bun">
    ```bash
    bun add lucide-react
    ```
  </Tab>
  <Tab value="pnpm">
    ```bash
    pnpm add lucide-react
    ```
  </Tab>
  <Tab value="npm">
    ```bash
    npm install lucide-react
    ```
  </Tab>
</Tabs>
```

Supports keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`) and accessible `tablist`/`tabpanel` semantics.

### Details

Collapsible disclosure using native `<details>` and `<summary>` elements with an animated chevron:

```mdx
<Details summary="View configuration options" defaultOpen={false}>
  Detailed explanation of parameters and optional overrides.
</Details>
```

### Standalone CodeBlock

Programmatically render code blocks with custom properties:

```mdx
<CodeBlock
  code="console.log('Programmatic snippet');"
  language="typescript"
  filename="demo.ts"
  showLineNumbers={true}
  highlightLines={[1]}
/>
```

## Error handling & author diagnostics

- **Unregistered components**: If an unregistered component (e.g. `<UnknownWidget />`) is used, Stash renders an informative diagnostic banner displaying the missing component name, passed props, and available components rather than crashing the page.
- **Syntax errors**: Malformed JSX or unclosed tags render a clear error alert indicating the file path and exact compilation issue.

## Adjacent assets

Place code examples, schemas, and diagrams directly in the entry directory beside `README.mdx`:

- **Code files**: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.py`, `.sh`, `.css`, etc.
- **Image assets**: `.svg`, `.png`, `.jpg`, `.webp`, `.avif`, etc.
- **Reference syntax**: Use relative paths from `README.mdx` (e.g., `![Diagram](./debounce-diagram.svg)` or `[use-debounce.ts](./use-debounce.ts)`).
- **Asset discovery**: Discovered automatically by `lib/content/assets.ts` and typed in entry metadata.

## Links and cross-references

The content validation system checks all internal references at build time:

- **Internal entry links**: Use canonical `/stash/...` routes (e.g., `[Command Menu](/stash/react/components/command-menu)`).
- **Heading anchors**: Link to specific sections (e.g., `[Keyboard Navigation](/stash/react/components/command-menu#keyboard-navigation)` or local anchor `[Overview](#overview)`). Target anchors are verified against target heading slugs.
- **Relative links**: Relative markdown paths (e.g. `../command-menu`) are resolved and validated.
- **Asset references**: Checked against physical existence on disk.

## Validation commands

Validate the content filesystem and verify all paths, frontmatter, assets, and internal links:

```bash
# Run content validation alone
bun run validate:content

# Run full project checks (linting, type checking, content validation)
bun run check

# Run unit tests
bun run test
```
