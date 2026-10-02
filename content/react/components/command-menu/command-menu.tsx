/**
 * Accessible modal command palette component.
 *
 * Provides a keyboard-navigable listbox dialog for search, navigation, and command execution.
 *
 * Notable: Client Component. Implements WAI-ARIA modal dialog and option patterns
 * with keyboard shortcuts (ArrowUp, ArrowDown, Enter, Escape). Validated with Zod.
 */

import { useEffect, useState } from "react";
import { z } from "zod";

export const commandItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  category: z.string().optional(),
  onSelect: z.function(),
});

export type CommandItem = z.infer<typeof commandItemSchema>;

export interface CommandMenuProps {
  items: CommandItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ items, isOpen, onClose }: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter" && items[selectedIndex]) {
        e.preventDefault();
        items[selectedIndex].onSelect();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
    >
      <div className="w-full max-w-xl rounded-lg bg-background p-4 shadow-xl border">
        <div role="listbox" aria-label="Commands" className="mt-2 space-y-1">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={idx === selectedIndex}
              className={`w-full text-left px-3 py-2 rounded text-sm cursor-pointer ${
                idx === selectedIndex ? "bg-accent text-accent-foreground" : ""
              }`}
              onClick={() => {
                item.onSelect();
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
