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

There is no Stash content, content loader, MDX integration, search index, documentation UI, tests, or CI workflow yet. `app/page.tsx` retains starter-era implementation until Stage 4.

## Confirmed architecture

- Stash is a personal engineering archive, not a project portfolio.
- The filesystem is the future content source of truth; a database or CMS is out of scope unless a concrete need changes that decision.
- Content entries will use a directory with `README.mdx` and optional neighboring assets.
- Ordinary content additions must be auto-discovered and must not require route, navigation, or search registry edits.
- Search must be BM25-based, generated at build time where practical, and isolated from presentation.
- The site should favor static rendering, Server Components, accessibility, and minimal client JavaScript.

See [ADR-0001](architecture/decisions/0001-filesystem-content-source.md) for the filesystem decision and [ADR-0002](architecture/decisions/0002-theme-support.md) for theme support. The content, MDX, and search documents describe target designs, not existing behavior.

## Known limitations

- The visible home page is the default Next.js starter page (to be replaced in Stage 4).
- No content authoring workflow or loader exists yet (Stage 1).
- No validation, test runner, `bun run check`, or CI workflow exists yet (Stage 1, 6, 7).
- Google Fonts are used in root layout; local/offline builds require network or cached font files.

## Pending work

The complete, selectable work list is [docs/TODO.md](TODO.md). Stage 0 is completed. Proceed with Stage 1 (Content foundation) as the next milestone unless directed otherwise.

## Guardrails

- Preserve the owner’s established package versions and shadcn setup unless there is a concrete reason to change them.
- Do not add a CMS, database, authentication, admin UI, or runtime API without an owner-approved requirement and an ADR.
- Do not treat proposed architecture documents as permission to implement their contents wholesale.
