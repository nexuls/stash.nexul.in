/**
 * Documentation root layout for Stash.
 *
 * Configures the shadcn SidebarProvider, server-side content taxonomy discovery,
 * accessible skip-links, and the centered Fumadocs-style layout container.
 */

import type { Metadata } from "next";
import { DocsSidebar } from "@/components/navigation/docs-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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

      {/* Centered layout wrapper: pushes sidebar near content with outer margins on wide screens */}
      <div className="min-h-screen w-full flex justify-center bg-background text-foreground overflow-x-clip">
        <div className="flex w-full max-w-[1400px] justify-center relative min-h-screen">
          <DocsSidebar entries={entries} categories={categories} />
          <div className="flex-1 min-w-0 flex flex-col items-center transition-all duration-300 ease-in-out">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
