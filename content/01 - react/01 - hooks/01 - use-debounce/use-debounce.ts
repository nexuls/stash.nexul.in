/**
 * Custom React hook for debouncing frequently updating values.
 *
 * Delays updating internal state until a specified delay has elapsed since the last change.
 * Useful for search inputs, window resize handlers, and auto-save triggers.
 *
 * Notable: Uses setTimeout with cleanup on unmount or subsequent value updates.
 */

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
