/**
 * Centralized site configuration for Stash.
 *
 * Stores immutable site metadata including application name, title, description,
 * canonical URL, author details, and social links.
 *
 * Notable: Consumed across root layouts, OpenGraph generators, and metadata builders to prevent drift.
 */

export const siteConfig = {
  name: "Stash",
  title: "Stash — Personal Engineering Archive",
  description:
    "Arif Sardar's personal, searchable archive of reusable engineering work, code patterns, architecture notes, and solutions.",
  url: "https://stash.nexul.in",
  author: {
    name: "Arif Sardar",
    url: "https://nexul.in",
    email: "arifsardar.private@gmail.com",
    github: "https://github.com/nexul",
  },
  links: {
    github: "https://github.com/nexul",
  },
  locale: "en_US",
} as const;

export type SiteConfig = typeof siteConfig;
