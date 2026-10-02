"use client";

/**
 * Accessible Tabs and Tab components for MDX code and multi-language snippets.
 *
 * Implements WAI-ARIA tab pattern with keyboard navigation (ArrowLeft, ArrowRight,
 * Home, End), automatic tab panel association, and mobile-safe overflow.
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
  setActiveTab: (val: string) => void;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tab({ value, label, className, children, ...props }: TabProps) {
  const context = React.useContext(TabsContext);
  const validation = tabPropsSchema.safeParse({ value, label, className });

  if (!context) {
    return (
      <div className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs text-destructive">
        ⚠️ &lt;Tab /&gt; must be used inside a &lt;Tabs&gt; container.
      </div>
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
      className={cn(
        "rounded-b-lg border border-t-0 border-border bg-card p-4 text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !isSelected && "hidden",
        className,
      )}
      {...props}
    >
      {!validation.success && (
        <div className="mb-2 rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs text-destructive">
          ⚠️ Malformed Tab: {validation.error.issues[0]?.message}
        </div>
      )}
      {children}
    </div>
  );
}

export function Tabs({
  items,
  defaultValue,
  className,
  children,
  ...props
}: TabsProps) {
  const baseId = React.useId();
  const validation = tabsPropsSchema.safeParse({
    items,
    defaultValue,
    className,
  });

  // Extract tab items from either explicit `items` prop or inspect React children
  const tabItems = React.useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item) => ({ value: item, label: item }));
    }

    const discovered: Array<{ value: string; label: string }> = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps = child.props as TabProps;
        const val =
          childProps?.value ||
          childProps?.label ||
          `tab-${discovered.length + 1}`;
        const lbl =
          childProps?.label ||
          childProps?.value ||
          `Tab ${discovered.length + 1}`;
        discovered.push({ value: val, label: lbl });
      }
    });

    return discovered;
  }, [items, children]);

  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (defaultValue && tabItems.some((t) => t.value === defaultValue)) {
      return defaultValue;
    }
    return tabItems[0]?.value || "";
  });

  const tabListRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabItems.findIndex((t) => t.value === activeTab);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      targetIndex = (currentIndex + 1) % tabItems.length;
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      targetIndex = (currentIndex - 1 + tabItems.length) % tabItems.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      targetIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      targetIndex = tabItems.length - 1;
    } else {
      return;
    }

    const nextTab = tabItems[targetIndex];
    if (nextTab) {
      setActiveTab(nextTab.value);
      const buttons =
        tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[targetIndex]?.focus();
    }
  };

  const contextValue = React.useMemo(
    () => ({
      activeTab,
      setActiveTab,
      baseId,
    }),
    [activeTab, baseId],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("my-6 w-full", className)} {...props}>
        {!validation.success && (
          <div className="mb-2 rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs text-destructive">
            ⚠️ Malformed Tabs: {validation.error.issues[0]?.message}
          </div>
        )}

        {/* Tab Header Bar */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-orientation="horizontal"
          className="flex w-full items-center gap-1 overflow-x-auto rounded-t-lg border border-border bg-muted/50 p-1 text-muted-foreground"
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
                onClick={() => setActiveTab(tab.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-md px-3 font-medium text-xs whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                  isSelected
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "hover:bg-background/50 hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        {children}
      </div>
    </TabsContext.Provider>
  );
}
