import type { Dispatch, KeyboardEvent } from 'react'
import { useCallback } from 'react'

import type { KeyboardAction, ViewAction, VisibleRow } from '../types'
import { NAVIGATION_KEYS, resolveKeyboardAction } from '../utils'

export interface UseKeyboardOptions {
  rows: readonly VisibleRow[]
  rowIndexById: ReadonlyMap<string, number>
  selectedId: string | null
  dispatch: Dispatch<ViewAction>
  disabled?: boolean
}

export interface UseKeyboardResult {
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  press: (key: string) => KeyboardAction | null
}

export function useKeyboard(options: UseKeyboardOptions): UseKeyboardResult {
  const { rows, rowIndexById, selectedId, dispatch, disabled = false } = options

  const press = useCallback(
    (key: string): KeyboardAction | null => {
      if (disabled) return null
      const action = resolveKeyboardAction({ key, rows, selectedId, rowIndexById })
      if (action) dispatch(action)
      return action
    },
    [disabled, rows, selectedId, rowIndexById, dispatch]
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (disabled || !NAVIGATION_KEYS.has(event.key)) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      event.preventDefault()
      press(event.key)
    },
    [disabled, press]
  )

  return { onKeyDown, press }
}
