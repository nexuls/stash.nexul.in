# Content authoring

## Status

The content system has not been implemented. This is the intended workflow, recorded so implementation can preserve it.

1. Create an entry directory under `content/`.
2. Add `README.mdx`.
3. Write Markdown or MDX and place related code and media beside it.
4. Run `bun run check`.
5. Commit the entry.

Example:

```text
content/react/hooks/use-debounce/
├── README.mdx
└── use-debounce.ts
```

The loader will be responsible for route discovery, categories, navigation, assets, and search indexing. Authors should not need to edit application code, route definitions, navigation configuration, or search configuration for normal entries.

Frontmatter, supported MDX components, assets, and exact validation messages will be documented here when the content foundation is implemented.
