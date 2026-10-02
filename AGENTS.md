<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Stash agent guide

Stash is Arif Sardar’s personal, searchable archive of reusable engineering work. It is documentation and a long-lived knowledge base, not a portfolio or a SaaS application.

## Start here

Before changing code, read [the current project state](docs/PROJECT_STATE.md), then the relevant documents under `docs/architecture/` and `docs/development/`. Inspect the existing implementation and `git status`; preserve unrelated work. The repository is authoritative over assumptions in this file.

## Current stack

- Next.js 16 with the App Router, React 19, TypeScript, Tailwind CSS 4, and shadcn/ui.
- Bun is the package manager and Biome is the formatter/linter.
- The content foundation and discovery system are implemented under `content/` and `lib/content/`; see [the backlog](docs/TODO.md).

## Intended architecture

- `content/` is the source of truth. An entry is a directory containing `README.mdx` and optional adjacent assets.
- `app/` composes routes; `components/` contains reusable presentation; `components/mdx/` will contain MDX components; `lib/content/` and `lib/search/` keep domain logic out of UI.
- Search will be a build-time BM25 index with a small client-side interface. Do not introduce a database or CMS without a documented requirement and ADR.
- Site-wide constants belong in `lib/site-config.ts`; do not scatter the site name, URL, or author.

## Content conventions

Do not hand-maintain routes, navigation registries, or database rows for ordinary entries. Content hierarchy comes from directory paths. Keep frontmatter optional and minimal; the loader derives sensible defaults from the path, headings, and document.

## UI principles

Favor readable documentation, clear hierarchy, keyboard access, small client bundles, and responsive code examples. Use shadcn primitives where helpful, but do not turn pages into a default component gallery. Avoid dashboard styling, decorative animation, and large marketing heroes.

## Commands

Current commands:

```bash
bun run dev
bun run lint
bun run format
bun run test
bun run validate:content
bun run check
bun run build
```

## Change and Git conventions

- Read the relevant Next.js guide before changing Next.js code.
- Keep client components narrow; prefer static generation and Server Components.
- Make content errors actionable and fail builds/CI once the content system exists.
- Record meaningful architectural decisions in `docs/architecture/decisions/` and update `docs/PROJECT_STATE.md` after meaningful architecture changes.
- Work directly on `main`. Do not create branches, rewrite history, force-push, reset, or discard unrelated changes.
- Review `git status` and `git diff` before committing. Make focused conventional commits and never include secrets, `.env` files, generated build output, or unrelated user changes.

## Documentation map

- [Current state and constraints](docs/PROJECT_STATE.md)
- [Prioritized implementation backlog](docs/TODO.md)
- [Architecture overview](docs/architecture/overview.md)
- [Content-system target](docs/architecture/content-system.md)
- [Search target](docs/architecture/search.md)
- [Architecture decisions](docs/architecture/decisions/)
- [Development and authoring guides](docs/development/)
- [Deployment notes](docs/operations/deployment.md)
