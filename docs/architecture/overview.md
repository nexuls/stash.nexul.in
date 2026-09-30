# Architecture overview

## Status

Target architecture. Only the framework foundation exists today; see [Project state](../PROJECT_STATE.md).

## Direction

Stash will remain a Git repository plus a content filesystem, a Next.js renderer, and a generated search index. Content must be easy to add by creating a directory and writing `README.mdx`.

```text
content/  →  lib/content/  →  Next.js routes and metadata
                  ↓
             lib/search/  →  generated BM25 index  →  search UI
```

`app/` owns routing and page composition. `components/` owns reusable UI. `components/mdx/` owns author-facing MDX components. `lib/content/` and `lib/search/` own data processing and must not depend on page components.

## Rendering strategy

Prefer static generation and Server Components. Client components should be limited to interactions such as search, copy controls, and tabs. Content parsing and index construction should happen outside client rendering.

## Configuration

When implementation begins, site name, canonical URL, description, and author should be centralized in one site-config module. Environment variables are reserved for genuinely environment-specific values.

## Related documents

- [Content-system target](content-system.md)
- [Search target](search.md)
- [Filesystem content ADR](decisions/0001-filesystem-content-source.md)
