/**
 * Centralized site configuration for Stash.
 *
 * Stores immutable site metadata including application name, title, description,
 * canonical URL, author details, and social links.
 *
 * Notable: Strictly validated via Zod (`siteConfigSchema.parse`) to prevent configuration drift.
 */

import { z } from "zod";

export const siteConfigSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url(),
  author: z.object({
    name: z.string().min(1),
    alias: z.string().min(1),
    url: z.string().url(),
    email: z.string().email(),
    github: z.string().url(),
  }),
  links: z.object({
    github: z.string().url(),
  }),
  locale: z.string().min(2),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const siteConfig = siteConfigSchema.parse({
  name: "Stash",
  title: "Stash, a personal engineering archive",
  description:
    "Arif Sardar's searchable archive of reusable engineering work: code patterns, architecture notes and problems already solved once.",
  url: "https://stash.nexul.in",
  author: {
    name: "Arif Sardar",
    alias: "Nexul",
    url: "https://nexul.in",
    email: "arifsardar.private@gmail.com",
    github: "https://github.com/nexuls",
  },
  links: {
    github: "https://github.com/nexuls/stash.nexul.in",
  },
  locale: "en_US",
});
