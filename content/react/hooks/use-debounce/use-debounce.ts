import { useEffect, useState } from "react";

/**
 * Custom hook to debounce rapidly updating state values.
 *
 * @param value The value to debounce.
 * @param delayMs Delay duration in milliseconds.
 * @returns The debounced value.
 */
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
