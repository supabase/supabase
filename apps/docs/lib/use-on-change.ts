import { useState } from 'react';

function isDifferent(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return b.length !== a.length || a.some((v, i) => isDifferent(v, b[i]));
  }

  return a !== b;
}

/**
 * @param value - state to watch
 * @param onChange - when the state changed
 * @param isUpdated - a function that determines if the state is updated
 */
export function useOnChange<T>(
  value: T,
  onChange: (current: T, previous: T) => void,
  isUpdated: (prev: T, current: T) => boolean = isDifferent,
): void {
  const [prev, setPrev] = useState<T>(value);

  if (isUpdated(prev, value)) {
    onChange(value, prev);
    setPrev(value);
  }
}
