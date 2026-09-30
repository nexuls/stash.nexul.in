# Search

## Status

Proposed design; not implemented.

## Goal

Help the author find an entry from incomplete recollection months or years later. Search will be full text and BM25-based, not a title substring filter.

## Target pipeline

```text
discovered entries → normalized fields → BM25 index → ranked results → snippets/highlights → search dialog
```

The index should include title, description, headings, body text, tags, categories, and useful code. Field weights should favor titles and headings, be documented beside the scorer, and be protected by ranking tests. Tokenization and normalization should be predictable; stemming and fuzzy matching remain optional enhancements to justify with real missed searches.

## Boundaries

`lib/search/` will expose a small search domain API. The UI owns dialog behavior, keyboard interactions, and rendering; it must not calculate ranking. Index generation belongs with build-time content processing whenever practical, and no database is required.

The initial dialog should open via `⌘K`/`Ctrl+K`, support arrow-key selection, Enter to open, Escape to close, accessible focus management, result context, and highlighted matches.

Implementation tasks and acceptance criteria are in [the backlog](../TODO.md).
