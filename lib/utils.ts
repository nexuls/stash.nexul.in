/**
 * Shared utility functions for Stash.
 *
 * Re-exports the classnames helper (`cn`) used across shadcn and custom UI components
 * for conditional and merged Tailwind CSS classes.
 *
 * Notable: Centralized helper to avoid scattering styling utility imports.
 */

export { cn } from "cn";

/**
 * Human-readable file size.
 *
 * Both the entry page's file list and `<FileDownloads>` label the same files,
 * so they round them the same way: bytes under a kilobyte, whole kilobytes up
 * to a megabyte, one decimal beyond it.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
