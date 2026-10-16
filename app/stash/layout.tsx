/**
 * Documentation root layout for Stash.
 *
 * Configures the shadcn SidebarProvider with the standard Sidebar + SidebarInset
 * layout, server-side content taxonomy discovery, and accessible skip-links.
 */

import type { Metadata } from "next";
import { DocsSidebar } from "@/components/navigation/docs-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getAllEntries, getCategoryIndexes } from "@/lib/content/discovery";
import {
  buildNavTree,
  getNavDomains,
  toNavCategoryIndexes,
} from "@/lib/content/nav-tree";
import { resolveDomainIcons } from "@/lib/icons/domain-icon-svg";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "Documentation archive",
    template: "%s | Stash",
  },
  description:
    "Technical reference, architecture notes and reusable code, kept as plain files on disk.",
};

export default async function StashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entries, categoryIndexes] = await Promise.all([
    getAllEntries(),
    getCategoryIndexes(),
  ]);

  // The glyphs are read from disk here, so the sidebar can stay a Client
  // Component without the icon theme reaching the browser.
  const navCategoryIndexes = toNavCategoryIndexes(categoryIndexes);
  const domainIcons = resolveDomainIcons(
    getNavDomains(buildNavTree(entries, navCategoryIndexes)).map(
      (domain) => domain.slug,
    ),
  );

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-md"
      >
        Skip to main content
      </a>

      <DocsSidebar
        entries={entries}
        categoryIndexes={navCategoryIndexes}
        domainIcons={domainIcons}
      />

      <SidebarInset
        className={cn(
          "relative bg-sidebar h-svh md:p-2 peer-data-[state=expanded]:pl-0 transition-[padding] duration-200",
          "opacity-100 peer-data-[state=expanded]:[&_.sidebar-toggle]:opacity-0 peer-data-[state=expanded]:[&_.sidebar-toggle]:pointer-events-none",
        )}
      >
        <div className="sidebar-toggle max-md:hidden absolute z-50 top-4 left-4 transition-opacity duration-200">
          <SidebarTrigger size="icon-lg" />
        </div>

        <ScrollArea className="bg-background h-full overflow-clip md:rounded-2xl border">
          {children}
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
