# Project state

Last reviewed: 2026-10-02

## Current implementation

The repository contains Next.js 16.3.7 with React 19.2.8, TypeScript, Tailwind CSS 4, shadcn/ui, Bun 1.3.14, and Biome 2.4.2.

Stage 0 (Foundation and decisions) is complete:
- Centralized site configuration established in `lib/site-config.ts` and wired into `app/layout.tsx`.
- Deployment provider confirmed as Vercel (`stash.nexul.in`) with minimal configuration in `vercel.json` and documented in `docs/operations/deployment.md`.
- Theme strategy decided (both light and dark modes supported, system default with toggle) and documented in `docs/architecture/decisions/0002-theme-support.md`.
- shadcn primitives reviewed; existing `Button` component retained and no unnecessary components added until required by selected UI stages.
- No deviations from the filesystem, MDX, static-index, or BM25 direction.

Stage 1 (Content foundation) is complete:
- Content directory `content/` established with a filesystem-first convention (`README.mdx` plus adjacent code and assets).
- Typed content discovery and loader implemented in `lib/content/` (`discovery.ts`, `parser.ts`, `assets.ts`, `validator.ts`, `types.ts`).
- Sensible title and description fallbacks derived from frontmatter, document headings, and body text without requiring boilerplate metadata.
- Example entries added:
  - `content/react/hooks/use-debounce/` (Markdown, adjacent code `use-debounce.ts`, adjacent asset `debounce-diagram.svg`, cross-links).
  - `content/react/components/command-menu/` (Markdown, adjacent code `command-menu.tsx`, adjacent asset `command-menu-preview.svg`, cross-links).
  - `content/typescript/patterns/result-type/` (Markdown, adjacent code `result.ts`, cross-links).
- Build-time content validator catches invalid kebab-case directory paths, duplicate slugs, malformed YAML frontmatter, missing documents, missing local assets, broken internal Stash links, and missing target heading anchors.
- Validation and quality scripts added to `package.json`: `bun run validate:content`, `bun run check`, and `bun test`.
- Comprehensive unit test suite added in `lib/content/__tests__/content.test.ts` (20 tests covering discovery, parsing, assets, and validation rules).

`app/page.tsx` retains starter-era implementation until Stage 4.

## Confirmed architecture

- Stash is a personal engineering archive, not a project portfolio.
- The filesystem is the content source of truth; a database or CMS is out of scope unless a concrete need changes that decision.
- Content entries use a directory with `README.mdx` and optional neighboring assets.
- Ordinary content additions are auto-discovered and do not require route, navigation, or search registry edits.
- Search will be BM25-based, generated at build time where practical, and isolated from presentation.
- The site favors static rendering, Server Components, accessibility, and minimal client JavaScript.

See [ADR-0001](architecture/decisions/0001-filesystem-content-source.md) for the filesystem decision and [ADR-0002](architecture/decisions/0002-theme-support.md) for theme support.

## Known limitations

- The visible home page is the default Next.js starter page (to be replaced in Stage 4).
- MDX component registry and presentation (syntax highlighting, callouts, tabs) have not been implemented yet (Stage 2).
- Route rendering for `/stash/[...slug]` is not yet wired up to the content loader (Stage 3).
- Google Fonts are used in root layout; local/offline builds require network or cached font files.

## Pending work

The complete, selectable work list is [docs/TODO.md](TODO.md). Stage 0 and Stage 1 are completed. Proceed with Stage 2 (MDX and code presentation) as the next milestone unless directed otherwise.

## Guardrails

- Preserve the owner’s established package versions and shadcn setup unless there is a concrete reason to change them.
- Do not add a CMS, database, authentication, admin UI, or runtime API without an owner-approved requirement and an ADR.
- Do not treat proposed architecture documents as permission to implement their contents wholesale.
