/**
 * Development filesystem watcher for Stash content and MDX components.
 *
 * Recursively watches the content/, components/mdx/, lib/mdx/, and lib/content/
 * directories to notify connected development clients via Server-Sent Events (SSE).
 *
 * Notable: Active only in development (process.env.NODE_ENV !== "production").
 * Debounces rapid saves and maintains a singleton instance on globalThis to survive HMR.
 */

import { existsSync, type FSWatcher, watch } from "node:fs";
import { join } from "node:path";

export interface ContentChangeEvent {
  file: string;
  event: string;
}

export type ContentChangeListener = (event: ContentChangeEvent) => void;

export interface WatcherState {
  watchers: FSWatcher[];
  listeners: Set<ContentChangeListener>;
  initialized: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __stashContentWatcher: WatcherState | undefined;
}

/**
 * Initializes the content directory filesystem watchers.
 */
export function initContentWatcher(force = false): WatcherState | null {
  if (!force && process.env.NODE_ENV === "production") {
    return null;
  }

  if (globalThis.__stashContentWatcher?.initialized) {
    return globalThis.__stashContentWatcher;
  }

  const state: WatcherState = {
    watchers: [],
    listeners: new Set(),
    initialized: true,
  };
  globalThis.__stashContentWatcher = state;

  const targetDirs = [
    join(process.cwd(), "content"),
    join(process.cwd(), "components", "mdx"),
    join(process.cwd(), "lib", "mdx"),
    join(process.cwd(), "lib", "content"),
  ];

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const pendingFiles = new Set<string>();

  for (const dir of targetDirs) {
    if (!existsSync(dir)) {
      continue;
    }

    try {
      const watcher = watch(
        dir,
        { recursive: true },
        (_eventType, filename) => {
          if (!filename) {
            return;
          }

          const normalizedName = filename.replace(/\\/g, "/");

          // Ignore editor temp files, git internals, and dotfiles
          if (
            normalizedName.startsWith(".") ||
            normalizedName.includes("/.") ||
            normalizedName.endsWith("~") ||
            normalizedName.endsWith(".swp") ||
            normalizedName.endsWith(".tmp") ||
            normalizedName.endsWith(".lock")
          ) {
            return;
          }

          pendingFiles.add(normalizedName);

          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(() => {
            const filesSummary = Array.from(pendingFiles).join(", ");
            pendingFiles.clear();

            const changeEvent: ContentChangeEvent = {
              file: filesSummary,
              event: "change",
            };

            for (const listener of state.listeners) {
              try {
                listener(changeEvent);
              } catch {
                // Ignore failing listeners
              }
            }
          }, 80);
        },
      );

      state.watchers.push(watcher);
    } catch (err) {
      console.warn(`[ContentWatcher] Could not watch directory ${dir}:`, err);
    }
  }

  return state;
}

/**
 * Subscribes a listener to filesystem change events in content and MDX component directories.
 * Returns an unsubscribe function.
 */
export function subscribeToContentChanges(
  listener: ContentChangeListener,
): () => void {
  const state = initContentWatcher();
  if (!state) {
    return () => {};
  }

  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}
