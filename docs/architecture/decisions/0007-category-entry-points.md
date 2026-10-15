# ADR-0007: Categories have an entry point of their own

## Status

Accepted.

## Context

Every note lived at `/stash/<category>/<directory>/<note>`, and nothing lived at
`/stash/<category>`. A category existed only as a path segment, derived from the
directories entries happened to sit in, so there was nowhere to say what a
category is for, and no page to send a reader to who knows they want React but
not which note.

That left the landing page carrying the whole archive at once: every note from
every category, in one list. It worked at twenty-one notes and would not work at
two hundred. Splitting the list by category is only possible if a category is
somewhere a reader can actually go.

A category could have been described in a config file or a frontmatter field on
one chosen entry, but [ADR-0001](0001-filesystem-content-source.md) made the
filesystem the source of truth, and a registry listing categories is exactly the
hand-maintained index this archive exists without.

## Decision

**A directory named `home` inside a category is that category's page.**
`content/react/home/README.mdx` is authored like any other entry and is served at
`/stash/react`. The convention costs nothing to adopt: a category without a
`home` directory keeps working, falling back to its directory name and showing
no summary.

**It answers at the category's path, not its own.** The entry's `permalink` is
rewritten to the category's route while its `slug` keeps naming the directory on
disk, which is what adjacent assets are served under. `/stash/react/home` returns
404, because an entry serving the same page under two URLs is a bug a reader will
eventually find, in a sitemap or a search result.

**It is not a note.** `getAllEntries` excludes category indexes by default, so
they never appear in listings, counts, related entries or previous/next
navigation: a category's heading is not one of the things inside it. The
exclusion is opt-out rather than opt-in — `includeCategoryIndexes: true` — so a
caller that forgets about them gets the right answer, and `getAllSlugs` opts in
deliberately because every route still has to be generated.

**Its title and description name the category everywhere.** The landing page
lists categories using them, so the words a reader sees before choosing are
written by the person who wrote the notes, not derived from a directory name.

**The page lists the category's notes under the authored document.** The MDX body
only has to say what the category is for; the inventory is generated beneath it,
grouped by directory. A category page cannot fall out of date with its contents.

## Consequences

The landing page can now lead with categories instead of the whole archive, which
is the change this ADR exists to allow. A reader picks a category and sees only
that category's notes; search remains the path for someone who already knows the
name of what they want.

`home` becomes a reserved directory name inside a category. It is a plain English
word that nobody is likely to want as a note slug, but it is reserved
nonetheless, and a note that needs that name has to pick another.

The sidebar's domain switcher still opens a category's first note rather than its
new page. That is worth revisiting, but it belongs with the navigation work
rather than here.

Routing is not specific to the top level: a `home` directory inside
`content/react/hooks` resolves and serves at `/stash/react/hooks` by the same
rule. The generated inventory beneath the document is built from the top-level
categories only, so a nested entry point would render its document and no list
until that lookup is widened. Nothing has needed one yet.
