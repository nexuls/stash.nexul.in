# ADR-0003: MDX Engine and Code Presentation

## Status

Accepted

## Context

Stash is Arif Sardar's personal engineering library. High-quality code presentation and expressive documentation markup are core requirements:
- Next.js 16 (React 19) and React Server Components (RSC) require modern MDX tooling.
- The previously specified `next-mdx-remote` package has been deprecated and archived by HashiCorp, making it unsuitable for React 19 / RSC.
- Code blocks must support dual themes (light and dark mode matching system/user preference), language labels, filename headers, line highlighting, line numbers, terminal blocks, diff blocks, mobile-safe horizontal scrolling, and accessible one-click copying.
- Content authoring errors (malformed props, unregistered component tags, unclosed JSX) should not crash the entire application; instead, they should deliver actionable author-facing diagnostics directly in the rendered page.

## Decision

1. **MDX Engine**: Adopt `next-mdx-remote-client` (v2.1+) as the maintained successor to `next-mdx-remote`. Use its RSC `evaluate` export in server components (`lib/mdx/renderer.tsx`).
2. **Syntax Highlighting**: Use `rehype-pretty-code` powered by `shiki` with dual themes (`github-light` and `github-dark`). Configure `keepBackground: false` and `grid: true` to enable clean token styling via CSS custom variables (`--shiki-light` / `--shiki-dark`) aligned with Stash's Tailwind CSS 4 theme.
3. **Core MDX Component Registry**:
   - `Callout`: Semantic callouts (`note`, `tip`, `warning`, `danger`, `important`, `info`, `caution`) with Lucide icons, accessible ARIA alert/status roles, and Zod prop validation.
   - `Tabs` and `Tab`: Accessible tabbed interfaces for multi-language or multi-environment code examples with WAI-ARIA tablist/tab/tabpanel markup and arrow-key navigation.
   - `Details`: Accessible disclosures using native `<details>`/`<summary>` with animated chevrons.
   - `CodeBlock` & `CodeFigure`: Code container with header bar, filename/title display, language badges, terminal indicators, copy button, and mobile-safe scrolling.
   - `CopyButton`: Accessible client component with feedback state, copying raw code directly or extracting clean text content from rehype-pretty-code figures without copying line numbers.
4. **Author-Facing Error Resilience**:
   - Unregistered MDX components are intercepted and rendered using `UnregisteredComponentFallback`, displaying component names, passed props, and a list of available registered components without fatal React crashes.
   - Evaluation/syntax failures are caught and rendered using `MdxError`, indicating file path, exact syntax errors, and recovery hints.
5. **Code Presentation Features**:
   - Filenames via `title="filename.ext"` meta.
   - Line highlighting via `{1,3-5}` meta, styled with theme primary tint and indicator bar.
   - Line numbers via `showLineNumbers` meta, rendered via CSS counters on pseudo-elements so numbers are never copied to the clipboard.
   - Word highlighting via `"word"` meta.
   - Terminal blocks formatted with terminal icon for `bash`, `sh`, `shell`, `zsh`.
   - Diff blocks formatted for `diff` language with addition and deletion line tints.

## Consequences

- Full React Server Component compatibility without client-side MDX evaluation overhead.
- Safe authoring experience: typos in component names or syntax errors display actionable warnings rather than breaking the application.
- Unified styling across all code snippets in light and dark modes without layout shift.
