import { useQueryState, type UseQueryStateOptions, type UseQueryStateReturn } from 'nuqs'
import { useCallback } from 'react'

import {
  armPanelPush,
  dismissPanelUrl,
  isCommittingPanelUrl,
  replaceMissingPanelId,
} from '@/lib/panel-history'

function isClearedValue(value: unknown) {
  return value == null || value === false || value === ''
}

/**
 * `useQueryState` for a panel param that pushes on open.
 * Clearing without `history: 'replace'` goes back when this session pushed
 * the current entry, and replaces otherwise. An explicit replace clear
 * (save, delete, missing id) never calls `history.back()`.
 */
export function usePanelQueryState<T>(
  key: string,
  options: UseQueryStateOptions<T> & { defaultValue: T }
): UseQueryStateReturn<NonNullable<ReturnType<typeof options.parse>>, typeof options.defaultValue>
export function usePanelQueryState<T>(
  key: string,
  options: UseQueryStateOptions<T>
): UseQueryStateReturn<NonNullable<ReturnType<typeof options.parse>>, undefined>
export function usePanelQueryState(key: string, options: UseQueryStateOptions<unknown>) {
  const [value, setValue] = useQueryState(key, options as never)

  const setPanelValue = useCallback(
    (next: unknown, callOptions?: { history?: 'push' | 'replace' }) => {
      const write = (nextValue: unknown, options?: { history?: 'push' | 'replace' }) => {
        if (options) return setValue(nextValue as never, options as never)

        return setValue(nextValue as never)
      }

      if (typeof next === 'function') {
        return write(next, callOptions)
      }

      const isClear = isClearedValue(next)

      if (callOptions?.history === 'replace') {
        if (!isClear) return write(next, callOptions)

        if (isCommittingPanelUrl()) {
          return write(next, callOptions)
        }

        return replaceMissingPanelId(() => {
          write(next, callOptions)
        })
      }

      if (isClear) {
        return dismissPanelUrl(() => {
          write(next, { ...callOptions, history: 'replace' })
        })
      }

      if (!Object.is(next, value)) armPanelPush()

      return write(next, callOptions)
    },
    [setValue, value]
  )

  return [value, setPanelValue] as never
}
