import type { KeyboardEvent } from 'react'

type ClearableInputElement = HTMLInputElement | HTMLTextAreaElement

/**
 * Staged-Escape handler for search/filter inputs:
 *   - Escape while the input has a value → clear the value (keeps focus)
 *   - Escape while the input is empty → blur the input
 *
 * Stops propagation on Escape so the keystroke doesn't bubble to dialog/popover
 * close handlers when the consumer is nested inside one.
 *
 * @example
 * <Input
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 *   onKeyDown={onSearchInputEscape(query, setQuery)}
 * />
 */
export const onSearchInputEscape =
  <T extends ClearableInputElement>(value: string, onClear: (next: string) => void) =>
  (event: KeyboardEvent<T>) => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    if (value.length > 0) {
      onClear('')
    } else {
      event.currentTarget.blur()
    }
  }
