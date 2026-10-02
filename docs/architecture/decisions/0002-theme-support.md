# ADR-0002: Theme support (light and dark themes)

## Status

Accepted

## Context

Stash is Arif Sardar's personal engineering archive. As technical documentation and reference material, it is read and authored across varied environments — from dark IDEs and terminals to well-lit reading situations. A single static color mode would compromise readability in one of these settings.

## Decision

Support both light and dark themes in the initial product release:
- Default to the user's operating system or browser preference (`prefers-color-scheme`).
- Provide an accessible, explicit theme toggle in the primary navigation layout allowing users to toggle between light, dark, and system modes.
- Implement theme styles via CSS custom properties and the `.dark` class configured in `app/globals.css`, adhering to the Tailwind CSS 4 `@custom-variant dark (&:is(.dark *))` pattern.
- Avoid heavy runtime UI libraries or layout-shifting client scripts until the navigation layout is implemented.

## Consequences

- All UI components, documentation typography, code syntax highlighting blocks, and badges must be verified for visual contrast and clarity in both light and dark modes.
- Theme switching state will be encapsulated in a focused client component when the navigation layout (Stage 3 & 4) is introduced, keeping the core documentation routes primarily server-rendered.
