"use client";

/**
 * Recursive navigation tree for the active knowledge domain.
 *
 * Renders the directory-derived contents of one domain at arbitrary nesting
 * depth: groups are collapsible directories, leaves are entries. Top-level
 * rows read as full-width menu items; nested rows hang off the group rail.
 */

import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import Link from "next/link";
import { NavHoverHighlight } from "@/components/navigation/nav-hover-highlight";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type {
  NavEntryNode,
  NavGroupNode,
  NavNode,
} from "@/lib/content/nav-tree";
import { cn } from "@/lib/utils";

interface NavTreeContext {
  /** Directories are expanded by default; these are the ones collapsed by hand */
  closedGroups: ReadonlySet<string>;
  onToggleGroup: (id: string, open: boolean) => void;
  /** Permalink of the entry being viewed, if any */
  activePermalink: string;
  /** Forces every group open while a filter is applied */
  forceOpen: boolean;
}

/**
 * Rows sit above the shared hover background and leave the painting to it;
 * the active row keeps its own background so it reads while hovering elsewhere.
 */
const ROW_CLASSES =
  "relative z-10 text-muted-foreground transition-colors hover:bg-transparent active:bg-transparent data-open:hover:bg-transparent data-active:bg-linear-to-r data-active:from-primary/40 data-active:to-transparent bg-transparent! data-active:text-primary-foreground!";

function DraftMarker() {
  return (
    <>
      <span
        aria-hidden="true"
        className="ml-auto size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
      />
      <span className="sr-only">Draft</span>
    </>
  );
}

function EntryRow({
  node,
  context,
  nested,
}: {
  node: NavEntryNode;
  context: NavTreeContext;
  nested: boolean;
}) {
  const { entry } = node;
  const isActive = entry.permalink === context.activePermalink;
  const { isMobile, setOpenMobile } = useSidebar();

  const link = (
    <Link
      href={entry.permalink}
      data-nav-row
      aria-current={isActive ? "page" : undefined}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
    />
  );

  if (!nested) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          render={link}
          isActive={isActive}
          className={cn(ROW_CLASSES, "h-8 rounded-lg text-xs font-medium")}
        >
          <FileText className="size-4 shrink-0" />
          <span className="truncate">{entry.title}</span>
          {entry.draft && <DraftMarker />}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        render={link}
        isActive={isActive}
        className={cn(
          "relative h-8 rounded-md text-xs font-normal text-muted-foreground transition-colors",
          "data-active:bg-linear-to-r data-active:from-primary/40 data-active:to-transparent bg-transparent! data-active:text-primary-foreground!",
        )}
      >
        <span className="truncate">{entry.title}</span>
        {entry.draft && <DraftMarker />}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function GroupRow({
  node,
  context,
  nested,
}: {
  node: NavGroupNode;
  context: NavTreeContext;
  nested: boolean;
}) {
  const isOpen = context.forceOpen || !context.closedGroups.has(node.id);

  const rowContent = (
    <>
      <div className="flex items-center gap-2 truncate text-foreground/75">
        <FolderOpen className="size-4 shrink-0 transition-colors group-hover/collapsible:text-foreground" />
        <span className="truncate">{node.label}</span>
      </div>
      <ChevronRight
        aria-hidden="true"
        className={cn(
          "ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
          isOpen && "rotate-90",
        )}
      />
    </>
  );

  const children = (
    <CollapsibleContent className="stash-collapsible-panel">
      <SidebarMenuSub className="mr-0 pr-0 my-0.5 border-l border-border/50 py-0.5 pl-2.5 gap-0">
        <NavTreeNodes nodes={node.children} context={context} nested />
      </SidebarMenuSub>
    </CollapsibleContent>
  );

  // The collapsible root renders as the list item so the tree stays valid markup.
  if (!nested) {
    return (
      <Collapsible
        render={<SidebarMenuItem />}
        open={isOpen}
        onOpenChange={(open) => context.onToggleGroup(node.id, open)}
        className="group/collapsible"
      >
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              data-nav-row
              data-nav-group={node.id}
              className={cn(
                ROW_CLASSES,
                "w-full justify-between gap-2 rounded-lg font-medium",
              )}
            />
          }
        >
          {rowContent}
        </CollapsibleTrigger>
        {children}
      </Collapsible>
    );
  }

  return (
    <Collapsible
      render={<SidebarMenuSubItem />}
      open={isOpen}
      onOpenChange={(open) => context.onToggleGroup(node.id, open)}
      className="group/collapsible"
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuSubButton
            render={<button type="button" />}
            data-nav-row
            data-nav-group={node.id}
            className={cn(
              ROW_CLASSES,
              "w-full justify-between gap-2 rounded-md text-xs font-medium",
            )}
          />
        }
      >
        {rowContent}
      </CollapsibleTrigger>
      {children}
    </Collapsible>
  );
}

function NavTreeNodes({
  nodes,
  context,
  nested = false,
}: {
  nodes: NavNode[];
  context: NavTreeContext;
  nested?: boolean;
}) {
  return nodes.map((node) =>
    node.kind === "group" ? (
      <GroupRow key={node.id} node={node} context={context} nested={nested} />
    ) : (
      <EntryRow key={node.id} node={node} context={context} nested={nested} />
    ),
  );
}

export function SidebarNavTree({
  nodes,
  ...context
}: { nodes: NavNode[] } & NavTreeContext) {
  return (
    <NavHoverHighlight>
      <SidebarMenu>
        <NavTreeNodes nodes={nodes} context={context} />
      </SidebarMenu>
    </NavHoverHighlight>
  );
}
