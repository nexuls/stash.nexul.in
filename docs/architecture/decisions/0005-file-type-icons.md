# ADR-0005: File type icons from the Material Icon Theme

## Status

Accepted.

## Context

A code panel labelled `tsx` and a file tree row labelled `use-debounce.ts` both
say what they are in words. A reader scanning an entry for the snippet they want
reads the shape and colour first and the label second, which is why editors show
a file-type glyph next to every tab and every explorer row. Stash had neither:
code panels carried a monospace pill with the language id, and the file tree drew
the same grey outline for every file and every folder.

The icons also have to survive the constraints the rest of the surface works
under: entries are statically generated, the client bundle is kept small, and
nothing in the document should depend on JavaScript to render.

## Decision

Use the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
— the icon set most VS Code users actually see — as a build-time asset.

**One module owns the lookup.** `lib/icons/file-icons.ts` reads the theme's own
manifest (`dist/material-icons.json`), which is the same set of tables the
extension uses: `fileNames`, `fileExtensions`, `languageIds`, `folderNames` and
their open variants. Resolution order for a file is exact filename, then longest
compound extension, then the generic file icon, so `button.test.ts` reaches the
test icon rather than the TypeScript one.

**Shiki's language ids are translated, not assumed.** Shiki says `tsx`, `jsx` and
`sh`; the manifest says `typescriptreact`, `javascriptreact` and `shellscript`.
A small alias table bridges them, and an id the manifest does not know is tried
as an extension before giving up. This is the only part of the mapping Stash
owns, so it is the part under test.

**Icons are inlined as SVG by a Server Component.** `components/mdx/file-icon.tsx`
reads the file during static generation and emits the `viewBox` and inner markup
directly. No icon data reaches the client bundle, there is no sprite request, and
the glyph is in the HTML before any script runs. The icons keep their own fills:
hue is half of what makes them recognisable, so they are not tinted to the theme.

**The glyphs are decorative.** Every icon sits beside the name it illustrates —
a panel header that already says `components/counter.tsx`, a tree row that
already says `README.mdx`. They are `aria-hidden`, because announcing them would
repeat what the adjacent text already says.

## Consequences

Code panels, `<FileTree>` and the companion-files list on an entry page all show
the same glyph for the same type, so a reader learns one vocabulary. The panel
header now reads as an editor tab — icon, then path — and the language pill is
gone; a block with no `title=` shows its language as plain text instead.

The theme ships 1251 SVGs (about 5 MB) as a dependency. None of it is served:
only the icons an entry actually uses are inlined, which is roughly 12 KB across
a dense authoring note's icons, and the repetition compresses well. If that ever
matters, the per-page set is small enough to emit once as `<symbol>` definitions
and reference with `<use>`.

Icon files are read from `node_modules` relative to the working directory rather
than through `createRequire`, because `import.meta.url` is rewritten to a module
id by the bundler and resolving against it throws during `next build`. The
lookup verifies the directory exists and warns once if it does not; a missing
icon degrades to no icon rather than failing a build over decoration.

Entries do not choose icons. There is no frontmatter or prop for it, and the
archive gains nothing from letting one entry disagree with another about what a
TypeScript file looks like.
