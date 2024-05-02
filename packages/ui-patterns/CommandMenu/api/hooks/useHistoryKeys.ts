import { useCallback, useEffect, useState } from 'react'

import { useSetQuery } from './queryHooks'

interface UseHistoryKeysOptions {
  stack: string[]
  enable?: boolean
}

/**
 * Enables shell-style message history when hitting up/down on the keyboard
 */
const useHistoryKeys = ({ stack, enable = true }: UseHistoryKeysOptions) => {
  const [idx, setIdx] = useState(0)
  const setQuery = useSetQuery()

  const navigateIdx = useCallback((newIdx: number) => {
    if (!enable) return

    setQuery(stack[newIdx] ?? '')
    setIdx(newIdx)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowUp':
          return navigateIdx(Math.max(idx - 1, 0))
        case 'ArrowDown':
          return navigateIdx(Math.min(idx + 1, stack.length))
        default:
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [navigateIdx, stack])
}

export { useHistoryKeys }
