# Project state: stash.nexul.in

This document records what has been decided, built, and verified. Update it whenever an architectural decision is approved or a milestone is reached.

## Current milestone: Stage 3.5 (Document surface) — Completed

### 1. Stage 1: Content foundation (Completed)
- Filesystem content system implemented under `content/` and `lib/content/` (`types.ts`, `parser.ts`, `assets.ts`, `discovery.ts`, `validator.ts`) with strict Zod validation.
- Site configuration in `lib/site-config.ts` strictly validated at load time via `siteConfigSchema` .
- Example entries added under `content/react/hooks/use-debounce/`, `content/react/components/command-menu/`, and `content/typescript/patterns/result-type/`.
- Build-time content validation script `scripts/validate-content.ts` and command `bun run validate:content`.

### 2. Stage 2: MDX and code presentation (Completed)
- MDX engine integration:
  - Selected and installed `next-mdx-remote-client` (v2.1+) as the modern drop-in successor to deprecated `next-mdx-remote`, fully compatible with Next.js 16 (React 19) and React Server Components (RSC).
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
  - Archive index: the landing page at `/` carries the hero, domain cards, note directory, and indexed topics/tags. Note that `app/stash/page.tsx` does not exist, so `/stash` currently 404s while `docs-header.tsx`, `docs-mobile-header.tsx`, and both `not-found.tsx` pages still link to it.
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

### Known failing test

`components/navigation/__tests__/navigation.test.tsx` → "scopes the tree to the active domain and counts its notes" asserts a note count that commit `bba74cb` removed from the sidebar. Pre-existing and unrelated to the document surface.

## Confirmed architecture

- Stash is a personal engineering archive, not a project portfolio.
- The filesystem is the content source of truth; a database or CMS is out of scope unless a concrete need changes that decision.
- Content entries use a directory with `README.mdx` and optional neighboring assets.
