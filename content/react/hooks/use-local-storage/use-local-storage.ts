import { useCallback, useEffect, useState } from "react";

/**
 * Persists state into localStorage with SSR-safe hydration.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Ignore unavailable or corrupt storage
    }
  }, [key]);

  const write = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Quota exceeded or private mode
      }
    },
    [key],
  );

  return [value, write] as const;
}
