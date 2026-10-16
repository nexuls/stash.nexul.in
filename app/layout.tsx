/**
 * Root application layout for Stash.
 *
 * Configures the HTML shell, global typography fonts (Inter, Geist Sans, Geist Mono),
 * global CSS stylesheets, theme provider, Vercel Web Analytics, and default
 * site-wide metadata.
 *
 * Notable: Renders as a Server Component. Default title and OpenGraph metadata are
 * established here and inherited/templated across nested route segments.
 */

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import "./globals.css";
import { ViewTransition } from "react";
import { DevHotReload } from "@/components/dev-hot-reload";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { font_variables } from "./fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", ...font_variables)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ViewTransition>
            <TooltipProvider>{children}</TooltipProvider>
          </ViewTransition>
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && <DevHotReload />}
        <Toaster />
        {/* Vercel Web Analytics. The `next` entry point reports the matched
            route (`/stash/[...slug]`) rather than every resolved URL, so the
            dashboard groups notes instead of listing each one. It carries its
            own `"use client"` and Suspense boundary, so importing it here
            leaves the layout a Server Component. */}
        <Analytics />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.author.name,
  },
  robots: {
    index: true,
    follow: true,
  },
};
