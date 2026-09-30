# Development setup

## Requirements

- Bun 1.3.14, matching the `packageManager` field.
- A current checkout of `main`.

## Run locally

```bash
bun install
bun run dev
```

The current project validates with:

```bash
bun run lint
bun run build
```

Content validation, tests, and `bun run check` do not exist yet. They are planned in [the backlog](../TODO.md).

Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`, as required by the root agent guide.
