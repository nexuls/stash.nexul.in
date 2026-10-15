# ADR-0006: The landing page opens the archive by category

## Status

Accepted.

## Context

The landing page carried four stacked sections: a hero with a count pill and two
buttons, a grid of domain cards, a flat list of every entry, and a cloud of every
tag. Three of those four showed the same twenty-one notes in three different
shapes, so the page grew taller as the archive grew without ever becoming easier
to search. The styling followed the same pattern — translucent cards, soft
shadows, a badge beside every heading — which read as a product landing page for
something that is not a product.

Stash is a personal archive of reusable work. Someone arriving here is either
its author looking for a note he half remembers, or an engineer who followed a
search result. Both are trying to find one note. Nothing on the page helped with
that: the search button dispatched `stash:open-search`, which nothing listens for
until Stage 5, and the tag cloud linked nowhere at all.

## Decision

**The categories are the page.** The landing page lists the categories, each
with the title and summary written in its own `home` entry
([ADR-0007](0007-category-entry-points.md)), its note count, and the directories
inside it. A reader chooses where to look before being shown anything. The notes
themselves live on the category pages, so the landing page stops growing as the
archive does — an earlier version listed every note at once, which worked at
twenty-one notes and would not have worked at two hundred.

**Search is the other way in, and it works.** A field above the categories
replaces them with matching notes as you type, and restates the count against the
whole archive. `/` focuses it, Escape clears it, and an empty result offers
directory names to try. It reads the metadata the server already prepared; it is
not the BM25 search of [ADR-0001](0001-filesystem-content-source.md)'s roadmap,
and the ⌘K dialog remains free to arrive as a separate concern.

**The page is set out against a drawn frame.** Two dashed guides run the full
height of the content column, continuing past every section rather than stopping
at one, and the rules that divide sections are dashed to match. The device is
structural, not decorative: it says where the measure is, and the hero's field —
drawn wider than the guides — reads as the archive spilling past its own frame.
Content rows keep solid rules, so a dashed line always means structure and a
solid one always means content. Narrow screens leave the guides out, where they
would sit on the viewport edge and read as a border rather than a measurement.

**Nothing on the page states a fact that will go stale.** The copy names no
technology and quotes no quantity, because an archive's subject matter and size
are exactly what change without the copy being revisited. Every number shown —
counts, dates — is derived from the content at build time, and the words around
them stay true whatever the content becomes.

**The only motion on the page is the field behind the opening.** A canvas draws
the contour lines of a field made from a handful of invisible sources drifting
along slow elliptical paths, the way a survey map draws elevation. Nothing in it
represents data — it is the one piece of the page allowed to be atmosphere — and
it is deliberately ambient rather than an entrance: a page that animates its
sections in as you arrive announces itself, and this archive should not. Contour
heights are measured from the field's own range each frame rather than fixed,
because overlapping sources rarely use their whole nominal range and fixed
heights leave the canvas nearly empty.

The field draws at 30fps, stops entirely while off-screen or on a hidden tab,
caps its backing store at 2× and re-reads its colour when the theme changes.
Under `prefers-reduced-motion` it renders a single still frame and never starts
a loop.

It runs behind the header too. The page is pulled up by the header's height and
the hero adds the same height back as padding, so the hero's box begins at the
top of the document and the field carries all the way up. The header's backdrop
is transparent at rest and solidifies over the first 10rem of scroll.

The page scrolls inside a `ScrollArea` rather than the document, as the
documentation pages already do, so everything that reacts to scrolling reads
that container: the document itself never moves and `window.scrollY` would stay
at zero.

That ramp has two drivers. A CSS scroll timeline runs it where one exists, which
costs no script and no work on the scroll thread; it names `scroll(nearest)` so
it resolves to the scroll area's viewport. Firefox implements no scroll
timelines — `animation-timeline: scroll()` does not parse there, so the
`@supports` block is skipped entirely — and `components/landing/header-backdrop.tsx`
drives the same ramp from a scroll listener on that same container instead. It
decides which case it is in by asking the element whether any animation on it is attached to a timeline
other than the document's, rather than by asking `CSS.supports`: a browser can
parse the property and still not run the animation, and the timeline an
animation is actually attached to is the fact itself.

Transparent is the resting state in CSS, so whichever driver takes over has
nothing to undo and no solid first paint flashes past before hydration. With
scripting off neither driver runs, so a `noscript` rule pins the backdrop solid;
a header that stayed transparent would sit unreadable over the text scrolling
beneath it.

**Deriving the shape is not the component's job.** `lib/content/archive-index.ts`
turns loaded entries into categories, directories and notes, and `filterArchive`
narrows that model. Both are pure and tested. The client component receives
title, description, permalink, date and a prepared search string — never `body`
or `rawContent`, which the old domain cards passed wholesale into their props.
`components/archive/note-list.tsx` renders a group of notes for both the search
results and the category pages, so a note reads the same wherever it is listed.

**Reading time is not shown.** Eighteen of twenty-one notes round to one minute,
so the column repeated itself; the date of the last edit varies, sorts, and is
what an archive is actually asked about.

## Consequences

The landing page no longer has a search control that does nothing. The ⌘K
trigger stays on documentation pages, where it is wired for Stage 5, and the
landing page offers the filter instead. Tags no longer appear on the page: they
remain in frontmatter, they are matched by the filter, and they will earn a
visible place when search can act on them.

The page ships one client component beyond the index, and it is the field. That
is the cost of the only decoration on the page, and it buys a background that
keeps moving without anything else on the page having to.

`getDomainIcon` moved from `components/landing/domain-card.tsx` to
`lib/icons/domain-icons.ts`, beside the file-icon resolver, because the sidebar's
domain switcher was importing it from a landing page component.
`formatSegmentLabel` gained a small casing table, so `typescript` reads as
TypeScript in the sidebar as well as the index.

Each note's row shows title, description and date. As the archive grows it grows
in one place: a new directory appears on its category page and in that category's
summary without a route, a registry or a card being written. A new category
appears on the landing page as soon as it holds a note, and names itself as soon
as it has a `home` entry.
