# Content authoring

## Status

Implemented (Stage 1: Content foundation).

## Entry convention

Every content entry in Stash is a directory under `content/` with a primary `README.mdx` document and optional adjacent code and media files:

```text
content/react/hooks/use-debounce/
├── README.mdx
├── debounce-diagram.svg
└── use-debounce.ts
```

### Hierarchy and slugs

- **Directory path**: Defines the route slug after `/stash/`.
- **Kebab-case requirement**: All directory segments must be lowercase kebab-case (e.g. `use-debounce`, `command-menu`).
- **Category hierarchy**: Parent directories become category segments (e.g. `react/hooks/use-debounce` -> categories `["react", "hooks"]`, primary category `"react"`).
- **Auto-discovery**: No manual route, navigation, or search registry updates are required.

## Frontmatter specification

Frontmatter is optional and minimal. Surrounding `---` YAML delimiters are parsed at build time:

```yaml
---
title: useDebounce Hook
description: A production-ready custom hook to debounce rapidly updating values.
date: 2026-10-02
tags:
  - react
  - hooks
  - performance
draft: false
deprecated: false
category: react
order: 1
---
```

### Supported fields

| Field | Type | Required | Description / Default Behavior |
| --- | --- | --- | --- |
| `title` | `string` | Optional | If omitted, defaults to the document's first `# Heading`. If no `# Heading`, uses any heading, or formats the directory slug (`use-debounce` -> `Use Debounce`). |
| `description` | `string` | Optional | If omitted, defaults to the first readable body paragraph (markdown stripped, truncated at word boundary ~180 chars). |
| `date` | `string` | Optional | Publication or creation date in ISO format (`YYYY-MM-DD`). |
| `updated` | `string` | Optional | Last updated date in ISO format (`YYYY-MM-DD`). |
| `tags` | `string[]` | Optional | Array of topic tags used for search indexing and categorization. |
| `draft` | `boolean` | Optional | Defaults to `false`. When `true`, excluded from default entry listings. |
| `deprecated` | `boolean \| string` | Optional | Defaults to `false`. Can be boolean or a deprecation notice string. |
| `category` | `string` | Optional | Explicit category override if different from primary parent directory. |
| `order` | `number` | Optional | Optional manual ordering weight for navigation. |

## Adjacent assets

Place code examples, schemas, and diagrams directly in the entry directory beside `README.mdx`:

- **Code files**: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.py`, `.sh`, `.css`, etc.
- **Image assets**: `.svg`, `.png`, `.jpg`, `.webp`, `.avif`, etc.
- **Reference syntax**: Use relative paths from `README.mdx` (e.g., `![Diagram](./debounce-diagram.svg)` or `[`use-debounce.ts`](./use-debounce.ts)`).
- **Asset discovery**: Discovered automatically by `lib/content/assets.ts` and typed in entry metadata.

## Links and cross-references

The content validation system checks all internal references at build time:

- **Internal entry links**: Use canonical `/stash/...` routes (e.g., `[Command Menu](/stash/react/components/command-menu)`).
- **Heading anchors**: Link to specific sections (e.g., `[Keyboard Navigation](/stash/react/components/command-menu#keyboard-navigation)` or local anchor `[Overview](#overview)`). Target anchors are verified against target heading slugs.
- **Relative links**: Relative markdown paths (e.g. `../command-menu`) are resolved and validated.
- **Asset references**: Checked against physical existence on disk.

## Validation commands

Validate the content filesystem and verify all paths, frontmatter, assets, and internal links:

```bash
# Run content validation alone
bun run validate:content

# Run full project checks (linting, type checking, content validation)
bun run check

# Run unit tests
bun run test
```
