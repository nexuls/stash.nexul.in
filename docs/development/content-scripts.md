# Managing content from the terminal

`bun run content` is the one entry point for everything that touches
`content/`: creating documents, categories and domains, ordering them, moving,
copying, renaming and removing them, editing frontmatter, and validating the
result.

```bash
bun run content                 # the interactive app
bun run content tree
bun run content validate
bun run content --help
```

It is a TypeScript program run by Bun (`scripts/content/index.ts`), and it does
not re-derive anything the site already knows. Slugs, routes, titles,
frontmatter, links and validation all come from `lib/content`, so the tool and
the build cannot disagree about what is served where. A test asserts that: every
document's computed route is checked against the loader's own `permalink`.

The interactive app is built with [`@clack/prompts`](https://bomb.sh/docs/clack/).
Pickers are type-to-filter, so `debounce` finds the note wherever it lives; the
slug is the label and the document's title is the hint. Escape steps back a
level rather than ending the session.

## What a path may look like

Every command that takes a path accepts whichever form is at hand:

| Form | Example |
| --- | --- |
| On disk | `01 - react/01 - hooks` |
| Slug | `react/hooks` |
| Route | `/stash/react/hooks` |

Order prefixes never reach a URL, so the slug and the route stay stable as the
numbering changes. `.` means the content root, where the domains live.

## Commands

```text
tree [path]                 The archive in content order
show <path>                 One document or category in detail
stats                       Totals as the build sees them
routes                      Every URL the build will emit
search <text>               Find a note by its contents

new document [parent]       A note: a directory with README.mdx
new category [parent]       A directory of notes
new domain                  A top-level category
new home <category>         A category's own authored page

order [parent]              Arrange a group interactively
order show <parent>         The group's current order
order renumber <parent>     Renumber the group 1..n as it stands
order clear <parent>        Strip the group's numbering
order up <path>             Move one directory up among its siblings
order down <path>           Move one directory down
order set <path> <position> Send one directory to a position

move <path> [destination]   Move a document or category
rename <path> [name]        Change a slug
copy <path> [destination]   Duplicate a document or category
rm <path>                   Delete a document or category
frontmatter <path>          Edit title, description, tags, dates

validate [numbering|structure|full]
```

Options: `-n`/`--dry-run` prints every change and writes none, `-y`/`--yes`
stands in for a confirmation when no terminal is attached, `--json` gives
machine-readable output where that makes sense (`stats`, `routes`, `search`,
`validate`).

### Running it from a script

Anything the app would ask for can be passed as a flag, and with no terminal
attached a flag is the only way in — a missing one is reported instead of
waiting on a prompt nobody can answer:

```bash
bun run content new document react/hooks \
  --name use-event-source --description "Subscribe to server-sent events." \
  --title "useEventSource hook" --tags react,hooks --order 7

bun run content new category react --name forms --description "Controlled inputs and submit paths."
bun run content new category react --name scratch --no-home
bun run content copy react/hooks/use-debounce react/hooks --name use-throttle
bun run content order renumber react/hooks
bun run content rm react/hooks/use-throttle --yes
```

Optional values fall back rather than prompt: a title becomes the slug in title
case, tags default to the domain, and placement defaults to last in the group.

## What it guarantees

- **Renames go through `git mv`** when the path is tracked, so `git status`
  shows a rename and the file's history follows the directory.
- **Routes are reported before anything moves.** A renumber says routes are
  unaffected; a move or rename lists every URL that changes and every document
  that links to the old one, with line numbers, and offers to rewrite them.
- **Reordering is explored before it is written.** The interactive arranger
  moves items in memory and redraws; nothing touches disk until you apply.
- **Renumbering cannot collide halfway.** Directories that move are parked
  under a temporary name first, so swapping `01` and `02` is safe.
- **A removal asks for the directory's name to be typed back**, and refuses to
  run without a terminal unless `--yes` is passed.
- **Slug collisions are refused up front**, naming the directory that already
  holds the slug, whether you are creating, moving, renaming or copying.
- **Frontmatter edits go through `yaml`'s document model**, so setting a title
  leaves key order, comments and the block-style tag list underneath it intact.

Inbound links are found structurally, from `entry.links`, which is why they come
with line numbers. The rewrite itself is textual, so it also catches a route
inside a JSX prop such as `<LinkCard href="…">`, which link extraction does not
report.

## Validation

`bun run content validate` runs two passes. The structural pass works off the
model and is instant: kebab-case names, duplicate order prefixes, route
collisions, empty categories, missing or empty documents, and a `home`
directory somewhere it cannot serve. It then calls `validateContent` from
`lib/content` in-process — no subprocess, same authority as
`bun run validate:content` — for frontmatter, assets and links.

`validate full` adds Biome, `tsc --noEmit` and the test suite, which is
`bun run check` plus tests.

## Layout

| File | Concern |
| --- | --- |
| `index.ts` | The entry point: flag parsing and subcommand dispatch |
| `model.ts` | The content tree, derived over `lib/content` |
| `fs-ops.ts` | Git-aware mutations, the dry run, two-phase renames |
| `frontmatter.ts` | Reading and editing frontmatter through `yaml` |
| `templates.ts` | What a new document starts as |
| `ui.ts` | Prompts, pickers, rendering, cancel handling |
| `tui.ts` | The interactive app |
| `commands/browse.ts` | Tree, details, stats, routes, search |
| `commands/create.ts` | Documents, categories, domains, home pages |
| `commands/order.ts` | The `NN - name` prefixes that order siblings |
| `commands/manage.ts` | Move, rename, copy, remove, frontmatter, relinking |
| `commands/validate.ts` | The structural pass and the project's own checks |
| `templates/*.mdx` | `entry.mdx` and `home.mdx`, with `{{TITLE}}`-style holes |

`model.ts` is the only place that walks `content/` itself, because the site
never needs the directories between entries — a category without a `home` page
serves nothing, so `lib/content` does not describe it. Everything derived from a
document is the loader's answer, not this tool's. Where the two conventions do
meet — which directory counts as a category index — `model.ts` documents that it
is matching `discovery.ts` deliberately, and a test pins both.

`STASH_CONTENT_DIR` points the tool at another archive, which is how
`scripts/content/__tests__/content-tool.test.ts` drives it over a fixture with
the violations a real archive should never have.
