/**
 * Documentation root layout for Stash.
 *
 * Configures the shadcn SidebarProvider with the standard Sidebar + SidebarInset
 * layout, server-side content taxonomy discovery, and accessible skip-links.
 */

import type { Metadata } from "next";
import { DocsSidebar } from "@/components/navigation/docs-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAllCategories, getAllEntries } from "@/lib/content/discovery";

export const metadata: Metadata = {
  title: {
    default: "Documentation Archive",
    template: "%s | Stash",
  },
  description:
    "Curated technical reference, architectural patterns, and reusable code implementations.",
};

export default async function StashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entries, categories] = await Promise.all([
    getAllEntries(),
    getAllCategories(),
  ]);

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-md"
      >
        Skip to main content
      </a>

      <DocsSidebar entries={entries} categories={categories} />

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
