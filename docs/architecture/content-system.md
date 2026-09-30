# Content system

## Status

Proposed design; not implemented.

## Authoring shape

Each entry will be a directory beneath `content/` with one primary `README.mdx` document and any supporting files beside it.

```text
content/react/components/command-menu/
├── README.mdx
├── command-menu.tsx
└── screenshot.png
```

Directory segments become category segments and the directory path becomes the URL after `/stash/`. The document title can be supplied by minimal frontmatter or derived from its first heading/path according to documented loader rules. Metadata must remain optional unless it is required for an unambiguous page.

## Target loader responsibilities

- Discover only valid entry directories.
- Derive stable slugs, categories, titles, descriptions, timestamps, tags, assets, headings, and searchable text.
- Keep the source path available for validation errors.
- Make adjacent code and media available to the document page without a separate registry.
- Validate duplicate routes, malformed metadata, local asset references, and internal Stash links before release.

The exact TypeScript types and parsing library are deliberately undecided until the implementation task starts. The public behavior and authoring experience matter more than a particular package.

## MDX extension point

MDX components will be registered in `components/mdx/` through a single explicit registry. Start with a small set that improves technical writing; add components only when a content need proves recurring. Components must work as part of the documentation system rather than as isolated demo widgets.

See [content authoring](../development/content-authoring.md) for the intended short workflow and [the backlog](../TODO.md) for implementation tasks.
