import { useEffect, useState } from "react";

/** Hover-intent delay: skips list rows the pointer only passes over. */
export const DEFAULT_ACTIVE_DELAY = 300;

/**
 * Returns `value` once it has been unchanged for `delay` ms. `null`, the
 * initial value and `delay <= 0` apply immediately.
 */
export function useSettledValue<T>(value: T | null, delay: number): T | null {
  const [settled, setSettled] = useState(value);

  // Clear during render so the next value waits the full delay.
  if (value === null && settled !== null) setSettled(null);

  useEffect(() => {
    if (value === null) return;
    const timer = setTimeout(() => setSettled(value), Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [value, delay]);

  return value === null || delay <= 0 ? value : settled;
}
