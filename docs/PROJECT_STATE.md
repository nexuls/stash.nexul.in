# Project state: stash.nexul.in

This document records what has been decided, built, and verified. Update it whenever an architectural decision is approved or a milestone is reached.

## Current milestone: Stage 3.6 (Landing page), completed

### 1. Stage 1: Content foundation (Completed)
- Filesystem content system implemented under `content/` and `lib/content/` (`types.ts`, `parser.ts`, `assets.ts`, `discovery.ts`, `validator.ts`) with strict Zod validation.
- Site configuration in `lib/site-config.ts` strictly validated at load time via `siteConfigSchema` .
- Example entries added under `content/react/hooks/use-debounce/`, `content/react/components/command-menu/`, and `content/typescript/patterns/result-type/`.
- Build-time content validation script `scripts/validate-content.ts` and command `bun run validate:content`.

### 2. Stage 2: MDX and code presentation (Completed)
- MDX engine integration:
  - Selected and installed `next-mdx-remote-client` (v2.1+) as the drop-in successor to the deprecated `next-mdx-remote`. It works with Next.js 16 (React 19) and React Server Components.
  - Server-side evaluator and renderer implemented in `lib/mdx/renderer.tsx` (`renderMdx` and `<MDXRenderer />`).
- Syntax highlighting and code presentation:
  - Integrated `rehype-pretty-code` and `shiki` dual themes (`github-light` and `github-dark`) configured in `lib/mdx/options.ts` and styled in `app/globals.css`.
  - Supports filenames and file paths via `title="..."` meta.
  - Supports line numbers via `showLineNumbers` meta, rendered using CSS counters so numbers are not copied when copying code.
  - Supports line highlighting via `{1,3-5}` meta and token highlighting via `"word"` meta.
  - Formats terminal code blocks (`bash`, `sh`, `shell`, `zsh`) with terminal iconography.
  - Formats diff blocks (`diff`) with addition (green) and deletion (red) line styling.
  - Built-in `CopyButton` client component with 2-second copied state feedback, accessible ARIA announcements, and DOM text-content extraction without copying line numbers.
- Core MDX component registry (`components/mdx/`):
  - `Callout`: Semantic visual variants (`note`, `tip`, `warning`, `danger`, `important`, plus `info` and `caution` aliases) with Lucide icons, accessible ARIA roles, and Zod prop validation.
  - `Tabs` & `Tab`: Accessible tabbed interfaces with WAI-ARIA tablist/tab/tabpanel markup and keyboard arrow navigation.
  - `Details`: Native `<details>` and `<summary>` element with rotating chevron.
  - `CodeBlock` & `CodeFigure`: Programmatic and rehype-intercepting code presentation containers with mobile-safe horizontal scrolling.
  - Enhanced HTML elements: headings (`h1`–`h4`) with scroll margins, links (`a`) with Next.js internal link routing, tables with responsive wrapper, lists, and blockquotes.
- Author-facing error resilience:
  - Dynamic discovery and Proxy fallback via `UnregisteredComponentFallback` catches unregistered MDX tags (e.g. `<UnknownWidget />`), rendering clear diagnostic warnings, listing passed props, and showing available components without fatal React crashes.
  - `MdxError` catches JSX/MDX compilation errors and displays file path, exact syntax errors, and recovery suggestions.
- Tests and verification:
  - 43 automated tests passing in `bun test` across content and MDX suites (`lib/content/__tests__/content.test.ts` and `lib/mdx/__tests__/mdx.test.ts`).
  - Verifies that all real filesystem entries compile and render to HTML without error.
  - Full project check `bun run check` (Biome lint, TypeScript `tsc --noEmit`, content validation) passes with 0 errors and 0 warnings.
  - Production build `bun run build` succeeds cleanly.
  - Recorded in [ADR-0003](architecture/decisions/0003-mdx-and-code-presentation.md) and documented in `docs/development/content-authoring.md`.

### 3. Stage 3: Documentation routes and navigations (Completed)
- Shadcn UI Components integrated:
  - Standardized on shadcn `base-luma` style with `@base-ui/react` primitives: `Sidebar`, `Sheet`, `Tooltip`, `Separator`, `Input`, `Breadcrumb`, `DropdownMenu`, `Badge`, `Skeleton`.
  - Responsive `useIsMobile` hook wired to shadcn sidebar sheet drawer for phones/tablets and collapsible rail for desktops.
- Theme System (`next-themes`):
  - Installed `next-themes` and wired `ThemeProvider` in root layout (`app/layout.tsx`).
  - Built `ThemeToggle` component with Light, Dark, and System modes, smooth transitions, and accessible dropdown menu.
- Headings and Anchor Navigation:
  - Integrated `rehype-slug` to generate predictable, clean IDs for MDX headings.
  - MDX `h2`, `h3`, `h4` rendered with hoverable `#` anchor direct-links linking to `#${id}`.
- Scroll-Aware Table of Contents (`DocsToc`):
  - Client component tracking active headings dynamically via `IntersectionObserver` with smooth scroll behavior.
  - Dual presentation: sticky right rail on desktop (`xl+`) and compact card for mobile/tablet.
  - Filters to `h2` and `h3` levels with indented depth hierarchy and "Scroll to top" button.
- Documentation Navigation Shell:
  - `DocsSidebar`: Domain-scoped navigation shell. A `DomainSwitcher` selects one knowledge domain and `SidebarNavTree` renders that domain's contents as the directory tree it is derived from, at arbitrary nesting depth, with guide rails, an active-row tick, per-directory counts, and a live filter.
  - `lib/content/nav-tree.ts`: Pure derivation of the navigation tree from entry category paths (`buildNavTree`, `filterNavTree`, `getNavDomains`, `getActiveDomain`, `getActiveTrail`), keeping navigation logic out of the UI. The active domain and the expanded trail are resolved from the route rather than held in component state, so the sidebar cannot disagree with the page on display.
  - Sidebar interaction: `collapsible="icon"` rail (no floating overlay trigger), `SidebarRail` edge toggling, `Ctrl/Cmd+B` to collapse, `/` to focus the filter, arrow keys to walk the tree, Left/Right to collapse and expand directories, Enter to open the top match, Escape to clear. The filter clears on navigation, the active trail auto-expands, and the current note is scrolled into view within the sidebar only.
  - `DocsHeader`: Sticky header with `SidebarTrigger`, breadcrumbs (`Breadcrumb`), dummy search button with `⌘K` badge, external GitHub repository link, and `ThemeToggle`.
  - `SearchTrigger`: Reusable client trigger component emitting `stash:open-search` for Stage 5 search dialog.
  - `DocsPager`: Linear Previous / Next entry navigation cards, restrained "See Also & Related Notes" discovery section based on category/tag scoring, reading time, timestamp, and GitHub source links.
- Routes & Pages:
  - Dynamic route `/stash/[...slug]`: Implements `generateStaticParams()` and `generateMetadata()`, MDX rendering, adjacent companion files/assets section, mobile/desktop TOC, and pager.
  - Archive index: the landing page at `/` (rebuilt in Stage 3.6, below). Note that `app/stash/page.tsx` does not exist, so `/stash` currently 404s while `docs-header.tsx`, `docs-mobile-header.tsx`, and both `not-found.tsx` pages still link to it.
  - Custom 404 pages: `/stash/not-found.tsx` and root `/app/not-found.tsx` with helpful recovery actions and search trigger.
- Verification & Test Suite:
  - 65 tests passing across 4 test suites (`bun test`), including navigation tree derivation, filtering, and domain resolution.
  - Strict Biome check, TypeScript check (`tsc --noEmit`), and content validation check (`bun run check`) pass with 0 errors.
  - Production build `bun run build` verifies clean static generation (SSG) of all routes.

### 4. Stage 3.5: Document surface and MDX pipeline (Completed)

Recorded in [ADR-0004](architecture/decisions/0004-document-surface-and-mdx-pipeline.md).

- Compile-time plugins (`lib/mdx/plugins/`), so the renderer never re-derives what the compiler knew:
  - `remarkCodeBlockJsx` lowers `<CodeBlock code="..." />` with statically known props to a real fenced code node, so the JSX form is syntax highlighted by the same Shiki pass as a fence.
  - `remarkEntryAssets` rewrites entry-relative references (`./diagram.svg`) against the entry directory.
  - `remarkImageFigures` promotes an image that is alone in its paragraph to a captioned figure.
  - `rehypeCodeMeta` lifts language, title, line count, line-number width and diff shape onto the code figure, and marks diff lines structurally.
- Entry assets are served by `app/content-assets/[...path]/route.ts`, fully prerendered via `generateStaticParams` with `dynamicParams = false`. Adjacent images and file links resolve for the first time.
- Fixed rendering defects: `oklch(var(--primary) / …)` was invalid so line and word highlighting never rendered; the word-highlight selector did not match what Shiki emits; `prose`/`not-prose` were applied without `@tailwindcss/typography` installed; `font-exo` was applied with no matching theme entry.
- Document surface: `.stash-doc` owns measure (~74 characters), body size and rhythm; `components/mdx/typography.tsx` declares every element an author can reach. Exo 2 is registered as `--font-display` for headings, Inter for running text, JetBrains Mono for code.
- Semantic tokens for callouts, diffs and code surfaces (`--note`, `--tip`, `--warn`, `--danger`, `--highlight`, `--code-bg`, `--diff-add`, `--diff-del`), tuned around the teal primary.
- Code panel: language, file path, line count or `+n -n`, soft-wrap toggle, copy, and collapse for blocks over 28 lines. The macOS traffic lights were removed.
- New components: `Steps`/`Step`, `FileTree`/`Folder`/`File`, `PropsTable`, `CardGrid`/`LinkCard`, `Kbd`. `Tabs` gained a `group` prop that keeps every group member in sync; `Callout` gained `compact`.
- `lib/content/parser.ts` now splits a Markdown link title from its destination, so `![alt](./x.svg "Caption")` validates.
- Verification: 79 of 80 tests pass (`bun test`); `bun x tsc --noEmit` and `bun run validate:content` are clean; `bun run build` prerenders every entry and asset. Light and dark renderings were reviewed at desktop and phone widths, with no horizontal page overflow at 390px.

### 5. File type icons (Completed)

Recorded in [ADR-0005](architecture/decisions/0005-file-type-icons.md).

- `material-icon-theme` added as a dependency, read at build time only; `lib/icons/file-icons.ts` resolves a filename, Shiki language id or folder name against the theme's own manifest.
- `components/mdx/file-icon.tsx` is a Server Component that inlines the SVG, so no icon data reaches the client bundle.
- Wired into code panel headers, `<FileTree>` rows and the companion-files list. The code panel's language pill was replaced by icon-then-name, the way an editor tab reads.
- Shiki's language ids are translated to VS Code's (`tsx` → `typescriptreact`, `sh` → `shellscript`); that mapping is covered by `lib/__tests__/file-icons.test.ts`.
- The sidebar's domain switcher uses the same theme for the domains that name a technology with a mark a reader knows: `lib/icons/domain-icons.ts` maps a domain loosely to a Material icon id (`react`, `typescript`, and `mdx` for `authoring`) and keeps the Lucide fallback for every other domain. Because the sidebar is a Client Component, `lib/icons/domain-icon-svg.ts` resolves the markup in `app/stash/layout.tsx` and it is handed down as the `domainIcons` prop, so the theme's icon files still never reach the client bundle. A theme glyph is not recoloured; a Lucide one still takes the row's text colour. Covered by `lib/__tests__/domain-icons.test.ts`.

### Known failing test

`components/navigation/__tests__/navigation.test.tsx` → "scopes the tree to the active domain and counts its notes" asserts a note count that commit `bba74cb` removed from the sidebar. Pre-existing and unrelated to the document surface.

### 6. Stage 3.6: Category entry points and the landing page (Completed)

Recorded in [ADR-0006](architecture/decisions/0006-landing-page-as-archive-index.md) and [ADR-0007](architecture/decisions/0007-category-entry-points.md).

- Category entry points: a `home` directory inside a category is that category's page, authored like any entry and served at the category's path (`content/react/home/README.mdx` → `/stash/react`). `/stash/react/home` returns 404, so no page is served under two URLs.
  - `lib/content/discovery.ts` sets `isCategoryIndex` on the entry, rewrites its `permalink` to the category route while the `slug` keeps naming the directory on disk (which assets are served under), excludes these entries from `getAllEntries` by default, resolves a category path to its index in `getEntryBySlug`, adds `getCategoryIndexes()`, and makes `getAllSlugs` emit route segments.
  - `app/stash/[...slug]/page.tsx` renders `components/archive/category-view.tsx` for them: the authored document, then every note in the category grouped by directory. Entries now 404 at any path other than their own `permalink`.
  - Authored `home` entries exist for `react`, `typescript` and `authoring`; their titles and descriptions name those categories everywhere they are listed.
- The landing page leads with the categories rather than every note. Listing the whole archive worked at 21 notes and would not have worked at 200; the notes now live on the category pages.
  - `components/landing/archive-browser.tsx` shows the categories by default, and replaces them with matching notes while a search is active. `/` focuses the field, Escape clears it.
  - `components/archive/note-list.tsx` renders a group of notes for both the search results and the category pages.
  - Hero copy names no technology and quotes no quantity, since both change without the copy being revisited. Every figure shown is derived from the content at build time.
- `lib/content/archive-index.ts` derives the model (`buildArchiveIndex`, `filterArchive`); it now takes the category indexes so a category carries its authored label, summary and `href`. The client receives title, description, permalink, date and a prepared search string, never `body` or `rawContent`.
- Motion: a canvas draws contour lines of a slowly drifting field behind the hero, at 30fps, stopped while off-screen or on a hidden tab, capped at 2× backing store, re-reading its colour on theme change, and reduced to a single still frame under `prefers-reduced-motion`. Nothing else on the page animates.
- The field runs behind the header: `main` is pulled up by the header's height and the hero adds it back as padding, so the hero's box starts at the top of the document. The header's backdrop is transparent at rest and solidifies over the first 10rem of scroll.
  - The page scrolls inside a shadcn `ScrollArea` rather than the document, matching the documentation pages, so everything scroll-reactive reads that container. `lib/dom/scroll-parent.ts` resolves it and is now shared with `DocsToc`, which had its own copy.
  - Two drivers for one ramp: a CSS scroll timeline (`.stash-header-backdrop` in `app/globals.css`) where scroll timelines exist, and `components/landing/header-backdrop.tsx`, the header's only Client Component, where they do not. Firefox 156 reports `CSS.supports('animation-timeline: scroll()') === false`, so the `@supports` block is skipped there and the listener takes over. The component detects which case it is in from `element.getAnimations()` (a scroll-driven animation is never on the document timeline), because a browser can parse the property without running the animation.
  - Dashed guides (`components/landing/page-guides.tsx`) run the full height of the content column, with section rules and category dividers dashed to match; content rows keep solid rules, so dashed always means structure. Hidden below `sm`, where they would sit on the viewport edge.
  - Transparent is the resting state, so neither driver has a solid first paint to undo; a `noscript` rule pins the backdrop solid when no script runs at all. Verified in Chromium and in Firefox 156 over WebDriver BiDi, both before and after the move into a `ScrollArea`: both ramp 0 → 0.25 → 0.5625 → 1 across the same scroll offsets of the container, and in Chromium the component leaves the element's inline style untouched.
- The landing page no longer shows a ⌘K control that nothing listens for; the documentation pages keep theirs, wired for Stage 5.
- `getDomainIcon` moved to `lib/icons/domain-icons.ts`, since `components/navigation/domain-switcher.tsx` was importing it from a landing page component. `formatSegmentLabel` gained a casing table, so `typescript` reads as TypeScript in the sidebar too.
- Known gap: the sidebar's domain switcher still opens a category's first note rather than its new category page.
- Verification: 21 tests in `lib/content/__tests__/archive-index.test.ts` covering the model, the filter and the category-index convention; `bun x tsc --noEmit` and `bun run validate:content` clean; `bun run build` prerenders `/`, every category and every note. The category-first default, search, the live field, the reduced-motion still frame, route resolution and the absence of horizontal overflow were driven and checked in a real browser.

### 7. Content ordering (Completed)

Recorded in [ADR-0008](architecture/decisions/0008-ordered-directory-prefixes.md).

- A directory name may open with a number (`content/authoring/01 - markdown/`) which fixes its place among its siblings and is stripped from slugs, routes, categories, labels and derived titles. Numbering a directory cannot change a URL.
- `lib/content/ordering.ts` holds the convention: `parseOrderedSegment`, `stripOrderPrefix(es)`, `compareOrder`. A prefix is only a prefix when whitespace separates the number from the name, so `2025-review` stays a name.
- `lib/content/discovery.ts` builds slugs from the stripped segments, records `order`, `categoryOrders` and `rawSlugSegments` on every entry, resolves a slug to its directory through `resolveEntryDirectory` (directory names no longer match slugs), and returns entries in content order via `compareEntriesByContentOrder` — numbered first, then directories by name and notes by title, level by level.
- One order, read everywhere: `lib/content/nav-tree.ts` sorts numbered siblings ahead of the groups-then-entries default, `lib/content/archive-index.ts` keeps the order `getAllEntries` reports and places numbered domains and directories first, and previous/next now follows the sidebar instead of publication date.
- `app/content-assets/[...path]/route.ts` resolves the owning entry by the longest matching slug prefix and serves the file from that entry's directory, since the URL's slug is no longer a path on disk.
- The validator checks the stripped name for kebab-case and warns (`duplicate-order`) when two directories in one place claim the same number. Colliding stripped names remain a `duplicate-slug` error.
- Applied to the whole archive. Domains read `01 - react`, `02 - typescript`, `03 - authoring`; `react` reads hooks → patterns → components → state management → performance → testing, and `authoring` reads markdown → code → components → assets. Entries inside each directory are numbered from the common case toward the specialised one. The `home` entry points keep plain names, since they are not listed among notes.
- All 41 routes are byte-identical to the ones generated before the renames, which is the property the convention is built on.
- Verification: 137 tests pass in `bun test` (the two known pre-existing failures unchanged); `bun x tsc --noEmit`, `bun run validate:content` and `bun run build` clean, with every route unchanged by the renames.

### 8. Content management tool (Completed)

- `bun run content` (`scripts/content/index.ts`, run by Bun) is the single entry
  point for everything that touches `content/`: browse, create, order, move,
  rename, copy, remove, edit frontmatter, validate. It opens an interactive app
  with no arguments and exposes every action as a subcommand, so the same code
  paths work from a script. Documented in
  [docs/development/content-scripts.md](development/content-scripts.md).
- The tool derives nothing the site already derives. `scripts/content/model.ts`
  walks `content/` only for the directories between entries — which
  `lib/content` has no reason to describe — and takes slugs, routes, titles,
  frontmatter, links, ordering and validation from `lib/content` itself. Where
  the conventions meet (which directory is a category index) the model documents
  that it mirrors `discovery.ts`, and a test pins the agreement: all 41
  documents' computed routes match the loader's `permalink`.
- Modules own one concern each: `model.ts`, `fs-ops.ts` (git-aware mutations,
  dry run, two-phase renames), `frontmatter.ts` (`yaml` document model, so an
  edit keeps key order and block lists), `templates.ts`, `ui.ts`, `tui.ts`, and
  `commands/{browse,create,order,manage,validate}.ts`.
- The interactive app is built on `@clack/prompts` (added as a devDependency
  with `picocolors`). Pickers are type-to-filter over the slug with the title as
  a hint, Escape steps back a level, and the order arranger moves items in
  memory and redraws, writing only when applied. Framed output is skipped when
  the terminal reports zero columns, because clack's border arithmetic throws
  there.
- Every prompt has a flag, and with no terminal attached a missing flag is
  reported rather than waited on; optional values fall back (title from the
  slug, tags from the domain, placement last in the group). `--dry-run` prints
  each mutation and writes nothing; `--json` covers `stats`, `routes`, `search`
  and `validate`.
- Safety properties: renames go through `git mv` when tracked; routes are
  reported before anything moves, together with the documents that link to them
  (found structurally from `entry.links`, so with line numbers) and an offer to
  rewrite those links textually, which also catches a route inside a JSX prop;
  renumbering parks directories under a temporary name first so swapping `01`
  and `02` cannot collide; a removal needs the directory name typed back, or
  `--yes` with no terminal; a slug collision is refused before any file is
  touched, naming the directory that holds it.
- `validate` runs a structural pass off the model (kebab-case names, duplicate
  order prefixes, route collisions, empty categories, empty documents, a
  misplaced `home`) and then `validateContent` in-process; `validate full` adds
  Biome, `tsc` and tests. `STASH_CONTENT_DIR` repoints the tool, which is how
  its tests run over a fixture.
- Verification: 24 tests in `scripts/content/__tests__/content-tool.test.ts`
  (model, routes, resolution, ordering and rotation, the structural rules,
  frontmatter round-tripping, link rewriting and its route boundary, dry run).
  `bun x tsc --noEmit` and `bun x biome check scripts/content` are clean. The
  mutations were driven against a copy of the real archive in a scratch git
  repository, and the app itself was driven over a pseudo-terminal, which is how
  the clack `box` crash on a zero-width terminal was found and guarded.

### 9. Empty categories are part of the archive

- A category that authored a `home` page is now listed whether or not it holds a note yet. Both listings were derived from notes alone, so a new domain was served at its URL and reachable by nothing: the OpenTUI domain and its three categories existed on disk, built, and appeared in neither the landing page nor the sidebar.
- `lib/content/nav-tree.ts` takes the category indexes (`buildNavTree(entries, toNavCategoryIndexes(indexes))`) and seeds their groups before placing notes, so a category's own order prefix decides its position rather than the first note that happens to live under it. `NavGroupNode` records `homePermalink`, and `getNavDomains` reads it instead of being told which paths have an index.
- `lib/content/archive-index.ts` seeds a domain for every top-level category index. A seeded directory with nothing in it is left out of the rendered listing, since it would be a heading over an empty list, but the domain and its page stay.
- `findCategory(domains, path)` resolves a category at any depth and is what `app/stash/[...slug]/page.tsx` now uses. A nested category page previously looked itself up among the top-level domains, found nothing, and listed none of its notes; `/stash/opentui/patches` is the first category inside a category, which is why that was never noticed.
- The sidebar's "nothing matches" state is now reserved for an active filter; a domain holding no notes showed it with an empty query quoted back. An empty category renders as a link to its page (`EmptyGroupRow`) rather than a collapsible that opens onto nothing.
- `lib/icons/domain-icons.ts` resolves `tui`/`terminal` to the Lucide terminal mark, so OpenTUI is not a plain folder in the switcher.
- Verification: new tests in `lib/content/__tests__/archive-index.test.ts` (`findCategory`, the seeded domain) and `components/navigation/__tests__/navigation.test.tsx` (seeding, ordering, `homePermalink`); `bun x tsc --noEmit`, `bun x biome check .` and `bun run build` clean, with the 17 failures the suite already had unchanged. Checked against the running dev server: the landing page lists OpenTUI, `/stash/opentui` shows its three categories in the sidebar, and each category page is served.

### 10. Downloading an entry's files (Completed)

- `<FileDownloads />` offers an entry's adjacent files as downloads, authored for the place a reader asks for them: under the preview, rather than only in the entry page's footer list. Both `react/layout/masonry-row-grid` and `react/canvas/svg-particles` use it.
- `remarkFileDownloads` (`lib/mdx/plugins/remark-file-downloads.ts`) resolves the authored `files` list against the entry directory at compile time, reads each size, and writes the asset URL prefix onto the tag. Written bare, the tag offers every asset `discoverAdjacentAssets` finds, so an added file needs no edit to the document. A name that does not exist renders a diagnostic where the list would have been, the way a renamed `<ComponentPreview>` source does.
- `components/mdx/file-downloads.tsx` is a Server Component: the rows are plain anchors carrying `download`, pointing at the already-prerendered content asset route, so saving a file costs nothing in the client bundle.
- `readStringAttribute`/`setAttribute` moved to `lib/mdx/plugins/mdx-attributes.ts`, shared by the two plugins that fill a tag. `formatFileSize` moved to `lib/utils.ts`, so the footer list and the download rows round a size the same way.
- Verification: four tests in `lib/mdx/__tests__/mdx.test.ts` (an authored list, bare discovery, the three diagnostics, the size format); `bun run lint` and `bun x tsc --noEmit` clean; `bun run build` prerenders both entries with `download` anchors and compile-time sizes. The 20 failures the suite already had are unchanged.

### 11. A preview worth the whole screen (Completed)

- The preview frame's header gained a full-screen control, offered on both tabs: a demo too small to judge in a document column, and a long source file, both get the viewport. `components/mdx/preview-frame.tsx` owns it; nothing changes for an author, since every `<ComponentPreview>` has it.
- The frame is taken out of flow rather than moved into a portal (`position: fixed` on the `<figure>` itself, a portalled backdrop behind it). The demo keeps running in the DOM it was mounted in, so a reader's state inside it survives the trip to full screen and back. A wrapper holds the height the frame vacates, so the document behind the overlay does not jump and the frame has a rectangle to land in.
- The transition is the one a zoomed figure uses: laid out at the final geometry, animated from the rectangle it left behind. `lib/dom/lift.ts` now holds the duration, the easing, the reduced-motion check and `invertedTransform`, shared by `image-zoom.tsx` and the preview frame, which is what makes the two read as one gesture. The transform scales both axes, since a frame growing to fill the viewport changes shape where a figure does not.
- While lifted the frame is a dialog: Escape returns it, the backdrop closes it, Tab stays inside it, and the body keeps its scroll position and width. The authored `height` applies in the document; full screen gives the open tab whatever is left of the viewport.
- Two bugs in the same component were fixed on the way. Dragging the preview back out to the full track stored a pixel width equal to the track instead of returning to full width, so the full-width control read as unselected and the preview stopped following the column. The `ResizeObserver` also took the zero width reported while the code tab hides the panel as a real measurement and clamped a chosen width to nothing, so a width survived neither a tab change nor the trip to full screen.
- Verification: driven in headless Chrome over CDP against the dev server (`react/layout/masonry-row-grid`). A chosen 390px width survives a tab round trip; stepping the thumb and dragging it past the right edge both restore `width: 100%` with the full-width control pressed; the lifted frame is `fixed`, inset from the viewport, unclipped by the scroll container, with the backdrop up, focus inside and the demo still mounted; Escape returns it to its original rectangle with no leftover transform or held height; under `prefers-reduced-motion: reduce` both directions are instant and land on the same rectangle; resizing the window while lifted reflows the frame and re-measures the track. `bun run lint`, `bun x tsc --noEmit` and `bun run build` are clean, and the 20 failures the suite already had are unchanged.

### 12. Printing an entry (Completed)

- Printing produced the application shell photographed once: the sidebar on the sheet, and the entry cut off at the first page, because the document scrolls inside a Base UI scroll area and a scroll container paginates to exactly its own box. `app/print.css` (imported by `app/globals.css`, print-only, so nothing on screen changes) undoes the shell on paper: the sidebar, toggles, table of contents, pager and clipboard controls are dropped, and the heights and overflow on `html`/`body`, the sidebar wrapper and inset, and the scroll area and its viewport are released so the document flows and paginates. The viewport carries `overflow: scroll` as an inline style, which is why that file is exempt from Biome's `noImportantStyles` in `biome.json`.
- Both themes print on the light palette: the print sheet restates it under `html:root`, which outranks `.dark` wherever the file sits in the import order, and whitens the page surfaces. Code keeps its light Shiki tokens, wraps instead of scrolling sideways, prints collapsed blocks in full, and a closed `<Details>` prints its contents rather than losing them with the gesture.
- A bordered block is kept off a fold: `stash-panel` is the hook the MDX panels carry for `break-inside: avoid` (tabs, props table, file tree, downloads, steps, the entry's file list), alongside code panels, callouts, previews, figures and table rows; `thead` repeats on a table that does run over.
- `@page` margin boxes carry the citation: the source and date on the first sheet, the entry title with its address and `Page N of M` on every one. The strings cannot come from CSS, so `components/print/print-citation.tsx` declares them as custom properties on the root element for the entry being printed, with fallbacks for every other page. Chrome draws these boxes; browsers that do not simply print without them. The column also keeps a little padding of its own, so a reader who sets "Margins: None" does not get text on the trim.
- Verification: printed to PDF from a production build in headless Chrome. An entry prints paginated with no sidebar and nothing clipped; a 27-line code block, a tab set, a props table, a download list and a wide table each print whole; a dark-theme print (`preferredColorScheme=0`, confirmed dark on screen) is identical to the light one; the category index and the landing page print clean. `bun run lint`, `bun x tsc --noEmit` and `bun run build` are clean, and the 20 failures the suite already had are unchanged.

### 13. Visualising a type (Completed)

- `<TypeMatrix />` (`components/mdx/type-matrix.tsx`) shows what a type accepts and what it turns away: rows are candidate values, columns are the types under test, and each cell says whether the compiler took it. Declaring two types puts a naive definition beside the one that fixes it, so the same value visibly lands differently in each column — the comparison a type-level note otherwise asks the reader to run in their head.
- A real `<table>`, so the header association a screen reader needs comes from the markup rather than from ARIA, and each verdict glyph carries a text alternative rather than meaning only in colour. Nothing about it is interactive, so it stays a Server Component and costs the client bundle nothing.
- `verdicts` is positional, one per declared type. `typeMatrixPropsSchema` refines the count and renders an actionable diagnostic when it disagrees, so a column added later cannot silently shift every row. A verdict is `"ok"` or `"error"`, or the object form carrying the compiler's own complaint, which renders beneath the value prefixed by the column it came from.
- First use: `typescript/patterns/one-of`, a condensed note on making union members mutually exclusive, with the implementation in the entry's own `one-of.ts`. Documented in `docs/development/content-authoring.md` and demonstrated at `authoring/components/type-matrix`.
- Verification: `bun run lint`, `bun x tsc --noEmit` and `bun test` are clean (48 MDX tests, four of them new). `bun run validate:content` reports no error for either new entry; the 10 broken-internal-link errors it already had are unchanged.

## Confirmed architecture

- Stash is a personal engineering archive, not a project portfolio.
- The filesystem is the content source of truth; a database or CMS is out of scope unless a concrete need changes that decision.
- Content entries use a directory with `README.mdx` and optional neighboring assets.
