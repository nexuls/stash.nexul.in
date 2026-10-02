# Stash implementation backlog

This is the selectable work queue. Nothing below is implemented unless [Project state](PROJECT_STATE.md) says so. Items are grouped by a sensible delivery order, but the owner may choose any item or ask for a smaller slice.

## 0. Foundation and decisions

- [x] Confirm the intended deployment provider and add only the necessary deployment configuration.
- [x] Replace starter site metadata with centralized Stash site configuration.
- [x] Decide whether light and dark themes are part of the initial product; document the decision.
- [x] Review the existing shadcn primitives and add only components needed by selected UI work.
- [x] Record ADRs for any material deviation from the filesystem, MDX, static-index, or BM25 direction.

## 1. Content foundation

- [x] Add the `content/` directory and a filesystem-first entry convention using `README.mdx`.
- [x] Implement typed content discovery in `lib/content/`, including path-to-slug/category derivation and adjacent asset discovery.
- [x] Define minimal optional frontmatter and sensible title/description defaults.
- [x] Add example entries with Markdown, code, an asset, and a link between entries.
- [x] Add build-time content validation for invalid paths, duplicate slugs, malformed metadata, missing documents, and missing assets.
- [x] Validate internal Stash links and report file-specific, actionable failures.
- [x] Add a `bun run validate:content` command and include it in a future `bun run check` command.

## 2. MDX and code presentation

- [ ] Select MDX integration compatible with the installed Next.js version after reading its local guide.
- [ ] Add an MDX component registry and implement a small initial set: `Callout`, `Tabs`, `Details`, and a code presentation component.
- [ ] Ensure unregistered or malformed MDX components fail with useful author-facing errors where practical.
- [ ] Add syntax highlighting, language labels, copy buttons, and mobile-safe overflow for fenced code blocks.
- [ ] Decide and document support for filenames, line highlighting, line numbers, terminal blocks, and diff blocks.

## 3. Documentation routes and navigation

- [ ] Create stable `/stash/[...slug]` routes derived from discovered entries.
- [ ] Add a documentation page layout with semantic landmarks, breadcrumbs, heading anchors, and a table of contents.
- [ ] Add category navigation derived from directories without a hard-coded taxonomy.
- [ ] Add previous/next navigation, directory-aware related content, and a restrained “see also” experience.
- [ ] Implement responsive navigation for phone, tablet, and desktop.
- [ ] Add a useful `not-found` experience for invalid content URLs.

## 4. Homepage and visual system

- [ ] Replace the Next.js starter page with a polished Stash home page centered on discovery.
- [ ] Add recently added content and category entry points from the content index.
- [ ] Decide the initial definition and source for “popular/useful” content; do not invent usage metrics.
- [ ] Establish documentation typography, spacing, and code styles consistent with the existing Tailwind theme.
- [ ] Review color contrast, focus styles, reduced motion, and mobile overflow across the new UI.

## 5. BM25 search

- [ ] Implement a search-domain module independent of UI with tokenization, normalization, indexing, scoring, and highlighting.
- [ ] Index title, description, headings, body text, tags, categories, and selected code with documented field weights.
- [ ] Generate the index at build time or from the content loader without a database.
- [ ] Add phrase handling and measured fuzzy matching only if baseline BM25 misses realistic queries.
- [ ] Create an accessible `⌘K`/`Ctrl+K` command search dialog with keyboard navigation, snippets, highlights, and no-results guidance.
- [ ] Test ranking with representative queries, including vague remembered terms.

## 6. Metadata, discoverability, and operations

- [ ] Generate per-entry metadata, canonical URLs, OpenGraph/Twitter data, sitemap, and robots directives from content.
- [ ] Add structured data only where it gives search engines useful, accurate context.
- [ ] Confirm image and static-asset handling for entry-local assets.
- [ ] Add a Bun-based CI workflow: install, typecheck, Biome, content validation, tests, and production build.
- [ ] Document deployment once the host and release path are confirmed.

## 7. Verification and maintenance

- [ ] Choose a lightweight test runner that fits the existing dependency set and add focused tests for content discovery, parsing, validation, slugs, links, and BM25 ranking.
- [ ] Add type checking to `bun run check` without duplicating work unnecessarily.
- [ ] Add test coverage for MDX component registration and critical navigation behavior as those features land.
- [ ] Update project state, authoring guidance, ADRs, and this backlog as meaningful architecture changes land.
- [ ] Review stale starter assets, dependencies, and README guidance once replacement UI is implemented.
