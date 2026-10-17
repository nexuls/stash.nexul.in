# Content authoring

## Status

Implemented (Stage 1: Content foundation, Stage 2: MDX and code presentation).

Everything specified here also has a rendered page in the archive itself, under
the `authoring` domain (`content/authoring/`): one entry per element and
component, each showing the thing it documents. This document is the
specification; those pages are the proof, and a renderer regression shows up
there first.

## Entry convention

Every content entry in Stash is a directory under `content/` with a primary `README.mdx` document and optional adjacent code and media files:

```text
content/01 - react/01 - hooks/01 - use-debounce/
├── README.mdx
├── debounce-diagram.svg
└── use-debounce.ts
```

The numbers in those directory names order them and nothing else; the entry above is served at `/stash/react/hooks/use-debounce`. See [Ordering](#ordering-01---name).

### The opening heading

An entry's title comes from frontmatter, or from the document's first `# Heading`. The route renders that title above the body, so a `# Heading` that opens the document is removed before rendering rather than printed twice. Keep it in the file: it is what makes the entry readable on disk and on GitHub. A `#` further down the document is left alone.

### Hierarchy and slugs

- **Directory path**: Defines the route slug after `/stash/`.
- **Kebab-case requirement**: All directory segments must be lowercase kebab-case (e.g. `use-debounce`, `command-menu`).
- **Category hierarchy**: Parent directories become category segments (e.g. `react/hooks/use-debounce` -> categories `["react", "hooks"]`, primary category `"react"`).
- **Auto-discovery**: No manual route, navigation, or search registry updates are required.

### Ordering (`01 - name`)

A directory may open its name with a number to fix its place among its siblings. The number is sorting information only: it is stripped before the segment becomes a slug, a route, or a title.

```text
content/03 - authoring/
├── home/
├── 01 - markdown/
│   ├── 01 - typography/   -> /stash/authoring/markdown/typography
│   └── 02 - lists/        -> /stash/authoring/markdown/lists
└── 02 - code/
```

- **Where it applies**: Any directory level — a domain, a category, or an entry. Every directory in the archive is numbered today, apart from the `home` entry points, which are not listed among notes.
- **What is ordered**: Everything listing content reads the same order: the sidebar, the landing page index, the category pages, and previous/next links.
- **Unnumbered directories**: Follow the numbered ones, alphabetically — directories by name, notes by title. Numbering some siblings and not others is fine.
- **Gaps and widths**: Numbers only have to sort. `01`, `02`, `10` and `1`, `2`, `10` behave identically, and gaps are free: leave room to insert.
- **Separator**: `01 - name`, `01 -name`, `01- name` and `01 name` are all read as number 1. What makes a prefix a prefix is the whitespace, so a name such as `2025-review` or `v2-migration` is left alone.
- **Clashes**: Two directories in the same place claiming the same number is a validation warning; the pages still build, but their relative order is left to the filesystem.
- **Renaming is safe**: Adding or changing a number does not change a URL, so nothing linking to the entry breaks. Changing the name after the number does.
- **Frontmatter `order`**: Still honoured for an entry whose directory carries no number. The directory wins when both say something.

### Category entry points (`home`)

A directory named `home` inside a category is that category's own page, served at the category's path rather than its own:

```text
content/01 - react/
├── home/
│   └── README.mdx      -> /stash/react
└── 01 - hooks/
    └── 01 - use-debounce/
        └── README.mdx  -> /stash/react/hooks/use-debounce
```

- It is an ordinary entry otherwise: frontmatter, adjacent assets and MDX all behave the same, and its assets are still served under `react/home`.
- It needs no number: it is not listed among the category's notes, so it has nothing to be ordered against.
- Its `title` and `description` name the category wherever the category is listed, including the cards on the landing page. Without a `home` entry a category falls back to its directory name and shows no summary.
- The page renders the document and then lists every note in the category, grouped by directory, so the MDX body only needs to say what the category is for.
- It is not a note: it is excluded from note listings, counts, related entries and previous/next navigation. `getAllEntries({ includeCategoryIndexes: true })` includes them when that is what you want, and `getCategoryIndexes()` returns them keyed by category path.
- `/stash/react/home` is not a route. An entry answers at one URL only, so the directory path returns 404.
- A category with a `home` page is listed even while it holds no notes: it appears on the landing page, in the domain switcher and in the sidebar, where its row links to its page instead of expanding onto nothing. A category with no `home` page and no notes is nothing at all — no page is served, so nothing lists it.
- A category inside a category works the same way. `content/04 - opentui/01 - patches/home/README.mdx` serves `/stash/opentui/patches`, and that page lists the notes under `patches` rather than the whole domain's.

## Frontmatter specification

Frontmatter is optional and minimal. Surrounding `---` YAML delimiters are parsed at build time:

```yaml
---
title: useDebounce hook
description: Debounce a rapidly updating value without dropping the last change.
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
| `order` | `number` | Optional | Sort position among siblings, for an entry whose directory carries no `01 - ` prefix. The directory prefix wins when both are present. |

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

### Panel header

A code panel is headed like an editor tab: the file-type icon, then the `title=` path if there is one, or the language id if there is not. The icon is chosen from the title's filename when present and from the language otherwise, so `title="components/counter.tsx"` shows the React/TypeScript glyph.

### Line numbers

Every code block is numbered, using CSS counters. Line numbers are never copied when the user clicks the copy button:

````markdown
```typescript title="lib/math.ts"
export function add(a: number, b: number) {
  return a + b;
}
```
````

Opt out with `showLineNumbers=false`, or the shorter `noLineNumbers`, when the numbers would be noise, such as a one-line shell command or a block of prose-like output:

````markdown
```bash noLineNumbers
bun run dev
```
````

The `<CodeBlock>` form takes `showLineNumbers={false}` for the same purpose. Writing `showLineNumbers` explicitly is still valid and still turns them on, so existing entries need no change.

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

Use the `diff` language identifier. Lines are marked as additions or deletions while the document is compiled, and the panel header reports the shape of the change:

````markdown
```diff
- const timeout = 100;
+ const timeout = 300;
```
````

### What the panel header shows

Every code block is rendered in a panel whose header reports the language, the file path when one is given, and the line count, or `+n -n` for a diff. The header also carries a soft-wrap toggle and a copy button. Blocks longer than 28 lines open collapsed, with a control to show the rest; line numbers are generated content and are never copied.

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

Add `compact` for a one-sentence aside that does not need a heading:

```mdx
<Callout type="tip" compact>
  Press <kbd>/</kbd> to jump to the sidebar filter.
</Callout>
```

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

Add a `group` to keep every Tabs block in the document on the same choice, so a reader who picks Bun once sees Bun throughout:

```mdx
<Tabs items={["Bun", "pnpm", "npm"]} group="package-manager">
```

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

When the props are literals, the tag is lowered to a fenced code block before highlighting, so it renders exactly like a fence. A `code` prop computed at runtime cannot be lowered and renders without syntax highlighting; prefer a fence or a literal.

### Steps and Step

A numbered procedure. Use it when the order is part of the content; a plain ordered list is better when it is not.

```mdx
<Steps>
  <Step title="Create the entry directory">
    Directory names become the route.

    ```bash
    mkdir -p content/react/hooks/use-interval
    ```
  </Step>
  <Step title="Write the document">
    Frontmatter is optional.
  </Step>
</Steps>
```

### FileTree, Folder and File

A directory listing with selectable names, rather than ASCII art in a code fence. `Folder` takes `defaultOpen`; both nodes take `highlight` to mark the subject of the surrounding prose, and `comment` for a short trailing note.

Each row picks its own icon from the name you give it, using the same Material Icon Theme glyphs VS Code shows, so `use-debounce.ts` and `README.mdx` are distinguishable at a glance. There is nothing to configure; see [ADR-0005](../architecture/decisions/0005-file-type-icons.md).

```mdx
<FileTree>
  <Folder name="use-debounce" highlight>
    <File name="README.mdx" highlight comment="the entry document" />
    <File name="use-debounce.ts" />
  </Folder>
</FileTree>
```

### PropsTable

The props of a component or the options of a function. Row text is plain text, not Markdown.

Each row shows its name and a short type; a row that carries anything else —
a description, a `typeDetail` signature, `parameters`, `returns` or a
`default` — opens to show it. A name without `required: true` prints as
optional, the way TypeScript writes it.

```mdx
<PropsTable
  of="<Callout />"
  rows={[
    { name: "type", type: "string", default: "note", description: "Which notice to show." },
    { name: "title", type: "string", required: true, description: "Replaces the default heading." },
    {
      name: "onDismiss",
      type: "function",
      typeDetail: "(reason: string) => void",
      parameters: [{ name: "reason", description: "Why the notice closed." }],
      returns: "Nothing.",
    },
  ]}
/>
```

For a prop that needs more than a sentence, write the row as a `<Prop>` child
instead. Its children are MDX — a code span, a link, a list, a fenced block
the pipeline highlights — the way a JSDoc comment is written. The attributes
are the same as a row's, minus `description`:

```mdx
<PropsTable of="<Callout />">
  <Prop name="type" type="string" default="note">
    Which notice to show. `info` and `caution` are accepted as aliases.

    ```tsx
    <Callout type="tip" title="Worth knowing" />
    ```
  </Prop>
  <Prop name="title" type="string" required>
    Replaces the default heading for the chosen type.
  </Prop>
</PropsTable>
```

A table takes `rows`, `<Prop>` children, or both; a row with nothing beyond a
name and type renders as a plain line rather than a disclosure.

### CardGrid and LinkCard

A cross-reference that deserves a larger target than an inline link.

```mdx
<CardGrid>
  <LinkCard
    href="/stash/react/hooks/use-debounce"
    eyebrow="react/hooks"
    title="useDebounce"
    description="Debouncing rapidly updating values."
  />
</CardGrid>
```

### Kbd

A keyboard key. A `<kbd>` typed directly in the document renders identically, so either form is fine.

```mdx
Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to open the command menu.
```

## Error handling & author diagnostics

- **Unregistered components**: If an unregistered component (e.g. `<UnknownWidget />`) is used, Stash renders an informative diagnostic banner displaying the missing component name, passed props, and available components rather than crashing the page.
- **Syntax errors**: Malformed JSX or unclosed tags render a clear error alert indicating the file path and exact compilation issue.

## Adjacent assets

Place code examples, schemas, and diagrams directly in the entry directory beside `README.mdx`:

- **Code files**: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.py`, `.sh`, `.css`, etc.
- **Image assets**: `.svg`, `.png`, `.jpg`, `.webp`, `.avif`, etc.
- **Reference syntax**: Use relative paths from `README.mdx` (e.g., `![Diagram](./debounce-diagram.svg)` or `[use-debounce.ts](./use-debounce.ts)`). These are rewritten at compile time to resolve against the entry directory rather than the route.
- **Serving**: Assets are served from `content/` by `app/content-assets/[...path]/route.ts`, prerendered at build time. Anything in an entry directory is public once discovered.
- **Captions**: An image alone on its line becomes a figure and can carry a caption through the Markdown title: `![alt](./diagram.svg "How it fits together")`. An image inside a sentence stays inline.
- **Figure background**: A figure sits on a light plate in both themes, so diagrams drawn with dark strokes stay readable in dark mode. Author diagrams for a light surface.
- **Asset discovery**: Discovered automatically by `lib/content/assets.ts` and typed in entry metadata.

## Links and cross-references

The content validation system checks all internal references at build time:

- **Internal entry links**: Use canonical `/stash/...` routes (e.g., `[Accessible command menu](/stash/react/components/command-menu)`).
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
