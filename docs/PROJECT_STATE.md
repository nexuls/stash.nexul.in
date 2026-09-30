# Project state

Last reviewed: 2026-09-30

## Current implementation

The repository contains a clean Next.js 16.3.7 starter with React 19.2.8, TypeScript, Tailwind CSS 4, shadcn/ui, Bun 1.3.14, and Biome 2.4.2. One shadcn `Button` component and the generated Tailwind theme are present.

There is no Stash content, content loader, MDX integration, search index, site configuration, documentation UI, tests, CI workflow, deployment configuration, or production metadata yet. `app/page.tsx` and `app/layout.tsx` retain starter-era implementation.

## Confirmed architecture

- Stash is a personal engineering archive, not a project portfolio.
- The filesystem is the future content source of truth; a database or CMS is out of scope unless a concrete need changes that decision.
- Content entries will use a directory with `README.mdx` and optional neighboring assets.
- Ordinary content additions must be auto-discovered and must not require route, navigation, or search registry edits.
- Search must be BM25-based, generated at build time where practical, and isolated from presentation.
- The site should favor static rendering, Server Components, accessibility, and minimal client JavaScript.

See [ADR-0001](architecture/decisions/0001-filesystem-content-source.md) for the recorded filesystem decision. The content, MDX, and search documents describe target designs, not existing behavior.

## Known limitations

- The visible site is the default Next.js starter page and metadata.
- No content authoring workflow exists yet.
- No validation, test runner, `bun run check`, or CI workflow exists.
- No deployment provider has been confirmed in repository configuration.
- `bun run lint` currently reports pre-existing formatting drift in `app/globals.css`, `app/layout.tsx`, `components/ui/button.tsx`, and `lib/utils.ts`.
- The production build needs access to Google Fonts because the starter layout uses `next/font/google`; it cannot complete in a network-restricted environment.

## Pending work

The complete, selectable work list is [docs/TODO.md](TODO.md). Begin each new implementation effort with the smallest unblocked milestone from that list, unless the owner selects a different item.

## Guardrails

- Preserve the owner’s established package versions and shadcn setup unless there is a concrete reason to change them.
- Do not add a CMS, database, authentication, admin UI, or runtime API without an owner-approved requirement and an ADR.
- Do not treat proposed architecture documents as permission to implement their contents wholesale.
