/**
 * Centralized site configuration for Stash.
 * Do not scatter site name, description, author, or canonical URL.
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
