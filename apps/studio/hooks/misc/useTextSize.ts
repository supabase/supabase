import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { useCallback, useMemo } from 'react'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { parseTextSize, TextSize } from '@/lib/text-size'

function readStoredTextSize(): TextSize {
  const stored = safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.UI_TEXT_SIZE)
  if (stored === null) return 'default'

  try {
    return parseTextSize(JSON.parse(stored))
  } catch {
    return 'default'
  }
}

export function useTextSize() {
  const [storedTextSize, setStoredTextSize] = useLocalStorageQuery<unknown>(
    LOCAL_STORAGE_KEYS.UI_TEXT_SIZE,
    readStoredTextSize()
  )
  const textSize = useMemo(() => parseTextSize(storedTextSize), [storedTextSize])

  const setTextSize = useCallback(
    (value: TextSize) => setStoredTextSize(value),
    [setStoredTextSize]
  )

  return { textSize, setTextSize }
}
