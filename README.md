# Stash

A filesystem-first documentation site for a personal engineering archive: notes,
reusable components, patterns and references, each one a directory with a
`README.mdx` inside it. There are no routes to register, no navigation file to
maintain and no database. You create a directory, write Markdown, and the site
derives the URL, the title, the sidebar, the breadcrumbs, the table of contents
and the previous/next links from the tree on disk.

![Next.js 16](https://img.shields.io/badge/Next.js-16-000)
![React 19](https://img.shields.io/badge/React-19-087ea4)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Bun](https://img.shields.io/badge/Bun-1.3-f9f1e1)
![MIT](https://img.shields.io/badge/license-MIT-blue)

> [!TIP]
> This repository is the live source of [stash.nexul.in](https://stash.nexul.in),
> and it is built to be cloned. Replace `content/` and `lib/site-config.ts` and
> it is your archive — see [Make it yours](#make-it-yours).

## Contents

- [What it gives you](#what-it-gives-you)
- [Quick start](#quick-start)
- [How content works](#how-content-works)
- [Writing a note](#writing-a-note)
- [The content tool](#the-content-tool)
- [Make it yours](#make-it-yours)
- [Project layout](#project-layout)
- [Commands](#commands)
- [Deployment](#deployment)
- [Status](#status)
- [Documentation](#documentation)
- [License](#license)

## What it gives you

### Content

- **Filesystem discovery** — `lib/content/` derives slugs, permalinks and
  categories from directory paths, and reads headings, links, adjacent assets and
  reading time.
- **Zod everywhere** — a malformed document is a build error with a file path
  attached, not a blank page.
- **Optional frontmatter** — the title falls back to the first heading, the
  description to the first paragraph, the rest to the path.
- **Ordering, not routing** — a `NN - ` prefix fixes a directory's place among
  its siblings and is stripped from every URL, so renumbering is always safe.
- **Authored category pages** — a `home` directory becomes its category's own
  page, served at the category's path, followed by the notes in it.

### Documents

- **MDX pipeline** — server-rendered through `next-mdx-remote-client`, with
  compile-time plugins that lower `<CodeBlock code="…" />` to a real fence,
  resolve entry-relative assets, caption lone images, and lift language and diff
  shape onto the code panel.
- **Code panels** — Shiki with paired light and dark themes, Material file
  icons, line numbers as CSS counters so they never land in your clipboard, line
  and token highlighting, terminal and diff styling, soft-wrap, copy, and
  collapse for long blocks.
- **Authoring components** — `Callout`, `Tabs`/`Tab` (synchronised by `group`),
  `Steps`/`Step`, `Details`, `FileTree`/`Folder`/`File`, `PropsTable`,
  `CardGrid`/`LinkCard`, `Kbd`, `CodeBlock`, and `ComponentPreview` for live,
  resizable previews of a real component.
- **Author-facing errors** — an unregistered tag renders a diagnostic listing
  its props and the components that exist; a compile error shows the file and the
  syntax error. Neither crashes the page.

### Interface

- **Derived navigation** — the sidebar is the directory tree at any depth, and
  the breadcrumbs, scroll-aware table of contents, pager and "see also" section
  come from the same model. Nothing is declared by hand.
- **Keyboard access** — `/` focuses the sidebar filter, arrow keys walk the
  tree, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>B</kbd> collapses the rail. The
  active trail is resolved from the route, not held in state.
- **A landing page that scales** — categories first, notes on their category
  pages, search replacing the listing while it is active, and every figure
  derived from the content at build time.
- **Restrained motion** — one canvas field behind the hero: 30fps, stopped
  off-screen, reduced to a single still frame under `prefers-reduced-motion`.
- **Static and themed** — every route and entry asset prerendered, light and
  dark through `next-themes`, shadcn/ui on Base UI primitives, client components
  kept narrow on purpose.

### Tooling

- **`bun run content`** — browse, create, move, rename, renumber, validate and
  edit frontmatter, as a TUI and as a subcommand for every action, git-aware and
  with a dry run.
- **`bun run check`** — Biome, `tsc --noEmit` and content validation in one
  command.

## Quick start

> [!IMPORTANT]
> Requires [Bun](https://bun.sh) 1.3.14, matching the `packageManager` field.

```bash
git clone https://github.com/nexuls/stash.nexul.in.git my-stash
cd my-stash
bun install
bun run dev
```

The site is at `http://localhost:3000`. Edit anything under `content/` and the
page reloads.

Before committing:

```bash
bun run check   # Biome, tsc --noEmit, content validation
bun run test
bun run build
```

## How content works

`content/` is the source of truth. An entry is a **directory** containing
`README.mdx`, plus whatever files belong beside it.

```
content/
  01 - react/
    home/
      README.mdx              ->  /stash/react
    02 - hooks/
      01 - use-event-listener/
        README.mdx            ->  /stash/react/hooks/use-event-listener
        use-event-listener.ts     served beside the note, linkable
  02 - typescript/
    01 - patterns/
      01 - result-type/
        README.mdx            ->  /stash/typescript/patterns/result-type
```

Three conventions, and that is the whole system:

- A **directory with `README.mdx`** is a note, at the URL its path spells.
- A **`NN - ` prefix** sets that directory's position among its siblings, and
  never reaches the URL.
- A **`home` directory** inside a category is that category's own page, at the
  category's URL.

The hierarchy is the directory path, nesting is arbitrary depth, and nothing has
to be registered anywhere else.

## Writing a note

```bash
bun run content new document react/hooks
```

Or by hand — create the directory and write `README.mdx`:

````mdx
---
title: useEventListener hook
description: Attach a DOM event listener once and keep the handler current.
date: 2026-10-07
tags:
  - react
  - hooks
---

# useEventListener hook

An inline handler in a `useEffect` dependency array re-subscribes on every
render. A ref holds the handler instead.

<Callout type="tip">
  Separates how long the subscription lives from which function it calls.
</Callout>

```ts title="use-event-listener.ts" showLineNumbers {4-6}
export function useEventListener(type, handler) {
  // …
}
```

See the [source beside this note](./use-event-listener.ts).
````

> [!NOTE]
> Frontmatter is optional and minimal. The loader falls back to the first
> heading for the title, the first paragraph for the description, and the path
> for the slug and category.

- **Frontmatter keys** — `title`, `description`, `date`, `updated`, `tags`,
  `draft`, `deprecated`, `category`, `order`.
- **Code fence meta** — `title="path/to/file.ts"`, `showLineNumbers`, `{1,3-5}`
  for lines, `"word"` for tokens.
- **Languages with their own treatment** — `bash`, `sh`, `zsh` render as a
  terminal; `diff` gets add and delete styling.

The full reference is
[docs/development/content-authoring.md](docs/development/content-authoring.md),
and the `authoring` domain in `content/` documents every component by using it.

## The content tool

`bun run content` with no arguments opens an interactive app. Every action is
also a subcommand, so the same code paths work from a script.

```bash
bun run content                          # the TUI
bun run content tree                     # the archive in content order
bun run content routes                   # every URL the build will emit
bun run content new document react/hooks
bun run content new category react --name testing --description "…"
bun run content order react/hooks        # arrange a group interactively
bun run content rename react/hooks/use-foo use-bar
bun run content move react/hooks/use-foo typescript/patterns
bun run content frontmatter react/hooks/use-foo
bun run content validate full            # structure, content, Biome, tsc, tests
bun run content --help
```

It derives nothing the site already derives: slugs, routes, titles, links,
ordering and validation all come from `lib/content`.

<details>
<summary><strong>Why it is safe to point at a real archive</strong></summary>

<br />

- **Renames go through `git mv`** when the files are tracked.
- **A route change is reported before anything moves**, together with the
  documents that link to it, with line numbers, and an offer to rewrite them.
- **Renumbering parks directories under a temporary name** first, so swapping
  `01` and `02` cannot collide.
- **A slug collision is refused** before a single file is touched, naming the
  directory that already holds it.
- **A removal needs the directory name typed back**, or `--yes` with no terminal
  attached.
- **`--dry-run` prints every mutation and writes nothing**, and `--json` covers
  `stats`, `routes`, `search` and `validate`.
- **A path may be given three ways** — on disk (`"01 - react/02 - hooks"`), as a
  slug (`react/hooks`), or as a route (`/stash/react/hooks`).

</details>

Details in
[docs/development/content-scripts.md](docs/development/content-scripts.md).

## Make it yours

This is a fork-and-edit template. In rough order:

1. **Site identity** — `lib/site-config.ts` holds the name, title, description,
   canonical URL, author and links, validated by Zod at load. Nothing else
   hard-codes any of it, so this one file is the rename.
2. **Your content** — delete the directories under `content/` and create your
   own. Keeping `content/03 - authoring/` is worth considering: it is the
   component reference, written in the components themselves. Give each top-level
   domain a `home/README.mdx` so it has a page.
3. **Theme** — the tokens live in `app/globals.css` (`:root` and `.dark`).
   `--primary` is the one that sets the character; the callout, diff and code
   tokens (`--note`, `--tip`, `--warn`, `--danger`, `--code-bg`, `--diff-add`,
   `--diff-del`) are tuned around it. `components.json` records the shadcn style
   (`base-luma`, `mist`) for anything you add later.
4. **Fonts** — `app/fonts.ts`. Exo 2 for display, Inter for running text,
   JetBrains Mono Nerd Font (vendored in `public/assets/fonts/`) for code. Swap
   the imports and the `--font-*` variables follow.
5. **Domain icons** — `lib/icons/domain-icons.ts` maps a top-level directory name
   to a Lucide icon for the sidebar switcher. Add a case for each domain of
   yours; unmatched names fall back to a folder.
6. **Remote images** — `next.config.ts` allows one Cloudinary account for the
   photographs a couple of layout notes need. Point it at yours, or remove the
   `remotePatterns` block and commit images beside their notes instead.
7. **Favicon and OG** — `app/favicon.ico`, and the metadata assembled in
   `app/layout.tsx` from the site config.
8. **Agent instructions** — `AGENTS.md` (and `CLAUDE.md`, which includes it)
   describe this project to coding agents. Rewrite the project-specific parts if
   you use them; the Next.js block at the top is regenerated by `next dev`.
9. **Housekeeping** — `package.json` `name`, the `LICENSE` copyright line, and
   the `docs/` tree, which records this project's decisions and state rather
   than yours.

> [!WARNING]
> `lib/site-config.ts` is parsed by `siteConfigSchema` at load, so an invalid
> URL or a missing field fails the build rather than shipping a half-renamed
> site. That is deliberate; fill every field.

## Project layout

<details>
<summary><strong>The directories that matter</strong></summary>

<br />

```
app/                     Routes. / is the archive index, /stash/[...slug] every
                         entry, /content-assets/[...path] prerendered assets
components/
  mdx/                   The MDX component registry and its components
  navigation/            Sidebar, header, domain switcher, TOC, pager
  landing/               Archive browser, hero field, header backdrop, guides
  archive/               Category view and note lists
  ui/                    shadcn primitives (Base UI)
content/                 The archive. Source of truth
lib/
  content/               Discovery, parsing, validation, ordering, nav tree,
                         archive index
  mdx/                   Renderer, options, remark and rehype plugins
  icons/                 File-type icons (Material) and domain icons
  site-config.ts         Site-wide constants, Zod-validated
scripts/
  content/               The content management tool
  validate-content.ts    Build-time validation
docs/                    State, backlog, architecture, ADRs, guides
```

</details>

Domain logic stays in `lib/`, presentation in `components/`, composition in
`app/`. A database or CMS is out of scope without a documented requirement and
an ADR.

## Commands

- `bun run dev` — development server.
- `bun run build` — production build; prerenders every route and asset.
- `bun run start` — serve the production build.
- `bun run lint` — Biome check.
- `bun run format` — Biome format, writing changes.
- `bun run test` — `bun test`.
- `bun run validate:content` — content validation only.
- `bun run content` — the content tool (TUI and subcommands).
- `bun run check` — Biome, `tsc --noEmit` and content validation.

## Deployment

Static-first Next.js, so anything that runs Next will do. This repository is set
up for Vercel (`vercel.json`, framework `nextjs`), where Bun is detected from
`bun.lock` and `packageManager`. Install with `bun install`, build with
`bun run build`.

Gate deployments on `bun run check`, `bun run test` and `bun run build`, and
fail the deploy when any of them fail. Notes in
[docs/operations/deployment.md](docs/operations/deployment.md).

## Status

- [x] Content foundation — discovery, parsing, validation, assets
- [x] MDX and code presentation
- [x] Documentation routes and navigation
- [x] Document surface and the compile-time MDX pipeline
- [x] File-type icons
- [x] Category entry points and the landing page
- [x] Content ordering by directory prefix
- [x] The content management tool
- [ ] Search

> [!CAUTION]
> Search is not built yet. The `⌘K` control on documentation pages emits a
> `stash:open-search` event that nothing listens for. A build-time BM25 index
> with a small client interface is the planned approach.

[docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) records what is done and verified;
[docs/TODO.md](docs/TODO.md) is the remaining backlog, including a couple of known
gaps and two pre-existing failing tests.

## Documentation

- [Current state and constraints](docs/PROJECT_STATE.md)
- [Prioritized backlog](docs/TODO.md)
- [Architecture overview](docs/architecture/overview.md)
- [Content system](docs/architecture/content-system.md)
- [Search design](docs/architecture/search.md)
- [Architecture decisions](docs/architecture/decisions/)
- [Development setup](docs/development/setup.md)
- [Content authoring](docs/development/content-authoring.md)
- [Content tool](docs/development/content-scripts.md)
- [Contributing](docs/development/contributing.md)
- [Deployment](docs/operations/deployment.md)
- [Agent guide](AGENTS.md)

## License

[MIT](LICENSE) © Arif Sardar.

The code is yours to clone and change. The writing under `content/` is the
author's own notes — keep what is useful as a starting point, but replace it
with your own work rather than republishing it as yours.
