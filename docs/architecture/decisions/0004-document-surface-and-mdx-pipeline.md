# ADR-0004: Document surface and MDX compile pipeline

## Status

Accepted. Supersedes parts of [ADR-0003](0003-mdx-and-code-presentation.md): the
engine and plugin choices there still hold, the component-level decisions below
replace the ones it records.

## Context

The entry page is the product. Everything else in Stash — discovery, navigation,
search — exists to deliver a reader to one document. Reviewing the rendered
result against the implementation surfaced four classes of problem.

**Rules that never matched.** `app/globals.css` styled highlighted lines and
words with `oklch(var(--primary) / 0.12)`. `--primary` already holds a complete
`oklch(...)` value, so the declaration was invalid and dropped. The word-highlight
selector looked for `[data-highlighted-word]`, while rehype-pretty-code emits
`<mark data-highlighted-chars>`. Both features were configured, documented and
inert.

**Styling that depended on a class that did not exist.** The entry page used
`prose dark:prose-invert` and `not-prose`, but `@tailwindcss/typography` is not a
dependency, so no element inherited anything from them. The document's spacing
came from a `space-y-4` wrapper fighting each component's own margins, and
`font-exo` was applied to `<html>` although no `--font-exo` entry existed in the
Tailwind theme — the display face was loaded on every request and never used.

**Entry assets could not be fetched.** An entry is a directory, so authors write
`![diagram](./diagram.svg)`. The browser resolves that against the route
(`/stash/react/hooks/use-debounce`), one segment too high, and `content/` is not
under `public/`. Every adjacent image and file link in the archive 404'd.

**Metadata recovered by inspection.** `CodeFigure` walked `React.Children` to
find the language and the title, and diff lines were detected by matching Shiki's
generated token colours (`style*="#22863A"`) in CSS. Both re-derive at render
time what the compiler already knew.

## Decision

### 1. The compiler answers structural questions, not the renderer

Four plugins run in `lib/mdx/options.ts`, each resolving something that is only
knowable while the document is being compiled:

- `remarkCodeBlockJsx` lowers `<CodeBlock code="..." />` to a real fenced code
  node when its props are statically known, so the JSX form is highlighted by
  the same Shiki pass as a fence instead of rendering as flat text beside it. A
  tag whose `code` is computed still renders through the component.
- `remarkEntryAssets` rewrites entry-relative references against the entry
  directory.
- `remarkImageFigures` marks an image that is alone in its paragraph, and retags
  that paragraph as a `<div>` so the renderer can emit `<figure>` with a caption
  without invalid nesting.
- `remarkStripTitleHeading` removes a `# Heading` that opens the body. The route
  renders the entry title as a masthead, and that heading is where the title
  came from, so the document was printing its own name twice.
- `rehypeCodeMeta` lifts language, title, line count, line-number width and diff
  shape onto the `<figure>`, and marks diff lines `data-diff="add" | "del"`.

The renderer is then a function of its props, and the stylesheet matches
structure rather than colour values.

### 2. Entry assets are served by a prerendered route

`app/content-assets/[...path]/route.ts` serves files from `content/`.
`generateStaticParams` enumerates every discovered asset and `dynamicParams`
is `false`, so the route is fully prerendered at build time and an unknown path
is a 404 rather than a request-time filesystem read. URLs are built in
`lib/content/asset-url.ts` by both the MDX pipeline and the companion-files list.

### 3. The document surface owns its own typography

`prose` and `not-prose` are gone. `.stash-doc` sets the measure, the body size
and the line height; `components/mdx/typography.tsx` declares every element an
author can reach, including the ones Markdown never generates. Rhythm is plain
top and bottom margins left to collapse in normal flow, so the gap between two
blocks does not depend on which came first.

Exo 2 is registered as `--font-display` and used for headings only; Inter carries
running text and JetBrains Mono carries code. Two clearly distinct families,
rather than one family doing both jobs.

MDX passes a tag the author types through as literal HTML without consulting the
component registry, so `<kbd>`, `<del>` and `<abbr>` are also styled as elements
under `.stash-doc`. That is the only reason element selectors appear there.

### 4. Semantic tokens, not palette colours

Callouts, diffs and code surfaces read from named tokens (`--note`, `--tip`,
`--warn`, `--danger`, `--highlight`, `--code-bg`, `--diff-add`, `--diff-del`)
tuned around the teal primary, instead of reaching into Tailwind's stock palette.
A callout carries its hue in a single `--callout` custom property consumed by
`.stash-callout`, so border, tint and icon cannot drift apart as variants are
added.

### 5. Components earn their place

Added because entries need them: `Steps` (a procedure is a real sequence, so
numbering is information), `FileTree` (content hierarchy is directory paths),
`PropsTable`, `LinkCard` and `CardGrid`, and `Kbd`.

Removed because they were decoration: the macOS traffic lights on every code
block. The code panel header now reports what a reader can act on — language,
path, line count or diff shape — plus soft wrap, copy, and a collapse control
for blocks over 28 lines.

`Tabs` instances sharing a `group` stay in sync, so choosing a package manager
once applies to the rest of the document.

## Consequences

- Line highlighting, word highlighting and diff rendering work for the first
  time, and diff detection no longer breaks if a Shiki theme changes.
- Adjacent images and file links resolve. Build output grows by one prerendered
  response per discovered asset.
- `@tailwindcss/typography` stays out of the dependency list; the document
  surface is explicit, which is also what makes it reviewable.
- `<CodeBlock>` with a computed `code` prop renders unhighlighted. This is
  visible in the output and documented in the authoring guide.
- `PropsTable` rows take plain text, not Markdown.
- A standalone figure keeps a light plate in both themes. Entry diagrams are
  authored for a light surface, and SVG text drawn in near-black vanished
  against a dark card. A diagram that handles both themes itself would have to
  opt out of the plate.
- Entry assets are public once discovered. Nothing in `content/` may be private.
