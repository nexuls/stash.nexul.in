"use client";

/**
 * Tabs for alternative forms of the same instruction — package managers,
 * languages, runtimes.
 *
 * Implements the WAI-ARIA tab pattern with arrow, Home and End navigation.
 * Panels are not boxed: the strip itself carries the structure, which keeps a
 * code panel inside a tab from sitting inside a second border.
 *
 * Tabs sharing a `group` stay in sync, so a reader who picks Bun once sees Bun
 * for the rest of the document.
 */

import * as React from "react";
import {
  type TabProps,
  type TabsProps,
  tabPropsSchema,
  tabsPropsSchema,
} from "@/lib/mdx/types";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  activeTab: string;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

/**
 * Selections shared by `group`, with subscribers so every group member
 * re-renders together.
 */
const groupSelections = new Map<string, string>();
const groupListeners = new Map<string, Set<() => void>>();

function subscribeToGroup(group: string, listener: () => void) {
  const listeners = groupListeners.get(group) ?? new Set();
  listeners.add(listener);
  groupListeners.set(group, listeners);
  return () => {
    listeners.delete(listener);
  };
}

function selectInGroup(group: string, value: string) {
  groupSelections.set(group, value);
  for (const listener of groupListeners.get(group) ?? []) {
    listener();
  }
}

/**
 * Reads the shared selection for a group, falling back to local state when the
 * Tabs instance is ungrouped.
 */
function useGroupedSelection(group: string | undefined, initial: string) {
  const [local, setLocal] = React.useState(initial);

  const shared = React.useSyncExternalStore(
    React.useCallback(
      (listener: () => void) =>
        group ? subscribeToGroup(group, listener) : () => {},
      [group],
    ),
    () => (group ? groupSelections.get(group) : undefined),
    () => undefined,
  );

  const select = React.useCallback(
    (value: string) => {
      if (group) {
        selectInGroup(group, value);
        return;
      }
      setLocal(value);
    },
    [group],
  );

  return [shared ?? local, select] as const;
}

export function Tab({ value, label, className, children, ...props }: TabProps) {
  const context = React.useContext(TabsContext);
  const validation = tabPropsSchema.safeParse({ value, label, className });

  if (!context) {
    return (
      <p className="my-4 font-mono text-xs text-destructive">
        &lt;Tab /&gt; must be used inside a &lt;Tabs&gt; container.
      </p>
    );
  }

  const { activeTab, baseId } = context;
  const tabValue = value || label || "default";
  const isSelected = activeTab === tabValue;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${tabValue}`}
      aria-labelledby={`${baseId}-tab-${tabValue}`}
      hidden={!isSelected}
      // The ARIA tab pattern puts the panel in the tab sequence, so Tab from
      // the strip moves into the content rather than past it.
      // biome-ignore lint/a11y/noNoninteractiveTabindex: required by the tab pattern
      tabIndex={0}
      className={cn(
        "pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      {...props}
    >
      {!validation.success && (
        <p className="font-mono text-xs text-destructive">
          Malformed Tab: {validation.error.issues[0]?.message}
        </p>
      )}
      {children}
    </div>
  );
}

export function Tabs({
  items,
  defaultValue,
  group,
  className,
  children,
  ...props
}: TabsProps) {
  const baseId = React.useId();
  const validation = tabsPropsSchema.safeParse({
    items,
    defaultValue,
    group,
    className,
  });

  // Tab labels come from the `items` prop when given, otherwise from the
  // children, so authors can write either form.
  const tabItems = React.useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item) => ({ value: item, label: item }));
    }

    const discovered: Array<{ value: string; label: string }> = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const childProps = child.props as TabProps;
      const position = discovered.length + 1;
      discovered.push({
        value: childProps?.value || childProps?.label || `tab-${position}`,
        label: childProps?.label || childProps?.value || `Tab ${position}`,
      });
    });

    return discovered;
  }, [items, children]);

  const initial =
    defaultValue && tabItems.some((tab) => tab.value === defaultValue)
      ? defaultValue
      : (tabItems[0]?.value ?? "");

  const [selected, select] = useGroupedSelection(group, initial);

  // A shared group may hold a value this instance does not offer, for example
  // when one Tabs lists an extra package manager.
  const activeTab = tabItems.some((tab) => tab.value === selected)
    ? selected
    : initial;

  const tabListRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabItems.findIndex((tab) => tab.value === activeTab);
    if (currentIndex === -1) return;

    const lastIndex = tabItems.length - 1;
    let targetIndex: number;

    switch (event.key) {
      case "ArrowRight":
        targetIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        break;
      case "ArrowLeft":
        targetIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
        break;
      case "Home":
        targetIndex = 0;
        break;
      case "End":
        targetIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabItems[targetIndex];
    if (!nextTab) return;
    select(nextTab.value);
    tabListRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      ?.[targetIndex]?.focus();
  };

  const contextValue = React.useMemo(
    () => ({ activeTab, baseId }),
    [activeTab, baseId],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={cn("my-6 w-full [&_.stash-code]:my-0", className)}
        {...props}
      >
        {!validation.success && (
          <p className="mb-2 font-mono text-xs text-destructive">
            Malformed Tabs: {validation.error.issues[0]?.message}
          </p>
        )}

        <div
          ref={tabListRef}
          role="tablist"
          aria-orientation="horizontal"
          className="flex items-stretch gap-4 overflow-x-auto border-b border-border"
        >
          {tabItems.map((tab) => {
            const isSelected = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                id={`${baseId}-tab-${tab.value}`}
                aria-controls={`${baseId}-panel-${tab.value}`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => select(tab.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "-mb-px shrink-0 border-b-2 pb-2 text-sm whitespace-nowrap transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {children}
      </div>
    </TabsContext.Provider>
  );
}
