# Project state: stash.nexul.in

This document records what has been decided, built, and verified. Update it whenever an architectural decision is approved or a milestone is reached.

## Current milestone: Stage 2 (MDX and code presentation) — Completed

### 1. Stage 1: Content foundation (Completed)
- Filesystem content system implemented under `content/` and `lib/content/` (`types.ts`, `parser.ts`, `assets.ts`, `discovery.ts`, `validator.ts`) with strict Zod validation.
- Site configuration in `lib/site-config.ts` strictly validated at load time via `siteConfigSchema`.
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

## Confirmed architecture

- Stash is a personal engineering archive, not a project portfolio.
- The filesystem is the content source of truth; a database or CMS is out of scope unless a concrete need changes that decision.
- Content entries use a directory with `README.mdx` and optional neighboring assets.
- Ordinary content additions are auto-discovered and do not require route, navigation, or search registry edits.
- Zod is strictly used across the codebase for schema definitions, type inference, and runtime validation.
- Search will be BM25-based, generated at build time where practical, and isolated from presentation.
- The site favors static rendering, Server Components, accessibility, and minimal client JavaScript.

See [ADR-0001](architecture/decisions/0001-filesystem-content-source.md) for the filesystem decision, [ADR-0002](architecture/decisions/0002-theme-support.md) for theme support, and [ADR-0003](architecture/decisions/0003-mdx-and-code-presentation.md) for MDX and code presentation.

## Known limitations

- The visible home page is the default Next.js starter page (to be replaced in Stage 4).
- Route rendering for `/stash/[...slug]` is not yet wired up to the content loader (Stage 3).
- Google Fonts are used in root layout; local/offline builds require network or cached font files.

## Pending work

The complete, selectable work list is [docs/TODO.md](TODO.md). Stage 0, Stage 1, and Stage 2 are completed. Proceed with Stage 3 (Documentation routes and navigation) as the next milestone unless directed otherwise.

## Guardrails

- Preserve the owner’s established package versions and shadcn setup unless there is a concrete reason to change them.
- Do not add a CMS, database, authentication, admin UI, or runtime API without an owner-approved requirement and an ADR.
- Do not treat proposed architecture documents as permission to implement their contents wholesale.
