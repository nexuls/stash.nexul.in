# ADR-0001: Filesystem content source

## Status

Accepted

## Context

Stash preserves small, reusable engineering knowledge over a long period. Adding a new entry needs to be fast, portable, reviewable in Git, and independent of a hosted service.

## Decision

Use directories under `content/` as the source of truth. Each entry will have a `README.mdx` primary document and may have supporting assets beside it. The application will discover entries and derive routes and categories from the filesystem.

## Consequences

Content is portable, works offline, and can be added without updating application registries or database records. The project must invest in clear build-time validation and authoring documentation. A database or CMS is not part of the initial architecture.
