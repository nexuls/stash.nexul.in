# Stash implementation checklist

## 1. Content foundation

- [x] Add the `content/` directory and a filesystem-first entry convention using `README.mdx`.
- [x] Implement typed content discovery in `lib/content/`, including path-to-slug/category derivation and adjacent asset discovery.
- [x] Define minimal optional frontmatter and sensible title/description defaults.
- [x] Add example entries with Markdown, code, an asset, and a link between entries.
- [x] Add build-time content validation for invalid paths, duplicate slugs, malformed metadata, missing documents, and missing assets.
- [x] Validate internal Stash links and report file-specific, actionable failures.
- [x] Add a `bun run validate:content` command and include it in a future `bun run check` command.

## 2. MDX and code presentation

- [x] Select MDX integration compatible with the installed Next.js version after reading its local guide.
- [x] Add an MDX component registry and implement a small initial set: `Callout`, `Tabs`, `Details`, and a code presentation component.
- [x] Ensure unregistered or malformed MDX components fail with useful author-facing errors where practical.
- [x] Add syntax highlighting, language labels, copy buttons, and mobile-safe overflow for fenced code blocks.
- [x] Decide and document support for filenames, line highlighting, line numbers, terminal blocks, and diff blocks.

## 3. Documentation routes and navigation

- [ ] Create stable `/stash/[...slug]` routes derived from discovered entries.
- [ ] Add a documentation page layout with semantic landmarks, breadcrumbs, heading anchors, and a table of contents.
- [ ] Add category navigation derived from directories without a hard-coded taxonomy.
- [ ] Add previous/next navigation, directory-aware related content, and a restrained “see also” experience.
- [ ] Implement responsive navigation for phone, tablet, and desktop.
- [ ] Add a useful `not-found` experience for invalid content URLs.

## 4. Homepage and visual system

- [ ] Create the Stash homepage at `/` emphasizing engineering references and fast search.
- [ ] Implement light and dark themes using semantic colors and high-contrast tokens.
- [ ] Add layout-level search entry points and an easily discoverable keyboard-friendly trigger.
- [ ] Add category overviews or directory-based collection pages where helpful.
- [ ] Ensure the overall visual system feels like Arif Sardar's personal engineering library.

## 5. Search and fast retrieval

- [ ] Choose a client-side or static search approach fitting a static-first site.
- [ ] Build a search index generation pipeline during build or prerender.
- [ ] Implement a command palette / search dialog (`Cmd+K`).
- [ ] Support fast keyboard-driven navigation from search results directly to entries and sections.
- [ ] Keep search performant without adding heavyweight client dependencies.

## 6. Testing, verification, and tooling

- [ ] Add tests for content discovery, category derivation, and metadata parsing.
- [ ] Add tests for link validation and asset validation.
- [ ] Add tests for search index generation and query matching.
- [ ] Add component tests or smoke tests for key interactive components.
- [ ] Configure `bun run check` to run linter, typecheck, tests, and content validation in one command.

## 7. Deployment and performance

- [ ] Ensure full static export or pure prerendering works with `bun run build`.
- [ ] Verify production bundle size and ensure scripts remain minimal.
- [ ] Ensure mobile navigation, tables, and code blocks do not cause layout shifts or horizontal clipping.
- [ ] Document the local development workflow and deployment instructions in `README.md`.

## 8. Backlog and future ideas

- [ ] Tag index pages or tag filtering.
- [ ] RSS/Atom feed for recent updates.
- [ ] OpenGraph image generation for entries.
- [ ] Mermaid diagram rendering.
- [ ] Export or copy whole entries as raw Markdown.
