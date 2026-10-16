# ADR-0008: Directory names carry their own order

## Status

Accepted.

## Context

Content hierarchy comes from directory paths, and order did not. Every listing
surface — the sidebar, the landing index, a category page — fell back to
alphabetical, which is the right default for looking something up and the wrong
one for anything written to be read in sequence. The authoring domain is the
clearest case: it introduces Markdown, then code, then components, then assets,
and alphabetical order presented them as assets, code, components, markdown.

A frontmatter `order` field already existed and was read by the sidebar alone.
It is also the wrong place for the information: ordering a directory of twelve
notes means opening twelve documents, a numbered directory cannot be seen as
numbered in a file listing, and a category directory has no document of its own
to carry the field at all.

A registry listing the intended order was rejected for the reason
[ADR-0001](0001-filesystem-content-source.md) gives: the filesystem is the source
of truth, and a hand-maintained index is the thing this archive exists without.

## Decision

**A directory name may open with a number, and the number orders it.**
`content/authoring/01 - markdown/02 - lists/` sorts first inside its parent and
second inside its own. Any level may use it: a domain, a category, or an entry.

**The number is sorting information and nothing else.** It is stripped before the
segment becomes a slug, a route, a category, a label or a derived title, so
`01 - markdown` is reached at `/stash/authoring/markdown` and reads as
"Markdown". Numbering or renumbering a directory therefore cannot break a link.

**Whitespace is what makes a prefix a prefix.** `01 - lists`, `01- lists` and
`01 lists` are all order 1; `2025-review` and `v2-migration` are names. Without
that rule the convention would silently rewrite legitimate slugs.

**Unnumbered siblings follow the numbered ones, alphabetically.** Adoption is
therefore incremental and partial: a directory may number three of its children
and leave the rest to sort themselves. Nothing has to be numbered, though
everything in the archive now is, apart from the `home` entry points, which are
not listed among notes and so have nothing to be ordered against.

**One order, read by every surface.** `getAllEntries` returns entries in content
order — level by level, numbered first, then directories by name and notes by
title — and the sidebar, the landing index, the category pages and
previous/next all derive their order from it. Previously `getAllEntries` sorted
by date and the sidebar sorted by title, so the archive disagreed with itself
about what followed what.

**Frontmatter `order` is kept for an entry whose directory is not numbered.** The
directory wins when both say something. It stays because it costs nothing and is
occasionally the more convenient place to say "this one first".

## Consequences

Order is visible in a file listing, in `git status` and in an editor's tree,
which is where someone rearranging content is actually working.

Directory names now contain spaces, which shells require quoting. That is the
real cost of the convention, accepted because the alternative formats either
read worse (`01_markdown`) or collide with ordinary slugs (`01-markdown` is
indistinguishable from a note legitimately named that way).

A slug no longer matches the path on disk, so a slug cannot be joined to the
content directory to find its entry. `resolveEntryDirectory` matches each
segment against stripped directory names instead, and the asset route resolves
an entry's directory the same way rather than trusting the URL as a path.

Two directories claiming the same number in the same place is a validation
warning, not an error: the pages still build, and their relative order is left
to the filesystem. Two directories whose stripped names collide — `hooks` and
`01 - hooks` — remain a duplicate-slug error, as they already were.
