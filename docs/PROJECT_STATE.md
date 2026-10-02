# Project state: stash.nexul.in

This document records what has been decided, built, and verified. Update it whenever an architectural decision is approved or a milestone is reached.

## Current milestone: Stage 1 (Content foundation) — Completed

- Filesystem content system implemented under `content/` and `lib/content/`:
  - `lib/content/types.ts`: Strict Zod schemas (`contentEntrySchema`, `contentFrontmatterSchema`, `contentAssetSchema`, `contentHeadingSchema`, `contentLinkSchema`, `contentCategorySchema`, `validationResultSchema`, etc.) with inferred TypeScript types.
  - `lib/content/parser.ts`: Parses YAML frontmatter, heading extraction with anchor slugification, link & asset reference extraction with line numbers, and sensible defaults (title and description fallbacks). Frontmatter is strictly validated using Zod.
  - `lib/content/assets.ts`: Discovers adjacent code, image, and document assets in entry directories and validates them via `contentAssetSchema`.
  - `lib/content/discovery.ts`: Recursive directory discovery, entry loader validated via `contentEntrySchema`, and category hierarchy generator validated via `contentCategorySchema`.
  - `lib/content/validator.ts`: Build-time validator verifying kebab-case paths (via `kebabCaseSegmentSchema`), duplicate slugs, frontmatter fields (via `contentFrontmatterSchema`), missing documents, missing local assets, broken internal `/stash/...` links, and missing target heading anchors.
- Site configuration in `lib/site-config.ts` strictly validated at load time via `siteConfigSchema`.
- Example entries added:
  - `content/react/hooks/use-debounce/` (Markdown, adjacent code `use-debounce.ts`, adjacent asset `debounce-diagram.svg`, cross-links).
  - `content/react/components/command-menu/` (Markdown, adjacent code `command-menu.tsx`, adjacent asset `command-menu-preview.svg`, cross-links).
  - `content/typescript/patterns/result-type/` (Markdown, adjacent code `result.ts`, cross-links).
- Build-time content validator catches invalid kebab-case directory paths, duplicate slugs, malformed YAML frontmatter, missing documents, missing local assets, broken internal Stash links, and missing target heading anchors.
- Validation and quality scripts in `package.json`: `bun run validate:content`, `bun run check`, and `bun test`.
- Comprehensive unit test suite in `lib/content/__tests__/content.test.ts` (24 tests covering Zod schemas, discovery, parsing, assets, and validation rules).

`app/page.tsx` retains starter-era implementation until Stage 4.

## Confirmed architecture

- Stash is a personal engineering archive, not a project portfolio.
- The filesystem is the content source of truth; a database or CMS is out of scope unless a concrete need changes that decision.
- Content entries use a directory with `README.mdx` and optional neighboring assets.
- Ordinary content additions are auto-discovered and do not require route, navigation, or search registry edits.
- Zod is strictly used across the codebase for schema definitions, type inference, and runtime validation.
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
