import { useQueryState, type UseQueryStateOptions, type UseQueryStateReturn } from 'nuqs'
import { useCallback } from 'react'

import { armPanelPush, dismissPanelUrl, replacePanelUrl } from '@/lib/panel-history'
import { panelHistoryAction, resolvePanelUpdater } from '@/lib/panel-history.utils'

type PanelCallOptions = { history?: 'push' | 'replace' }

function readHistoryMode(history: unknown): 'push' | 'replace' | undefined {
  if (history === 'push' || history === 'replace') return history
  return undefined
}

function toParserValue(value: unknown): {} | null {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return value
  if (typeof value === 'object') return value
  return null
}

/**
 * `useQueryState` for a panel param.
 * Push only on closed to open. A new value while open replaces.
 * Clearing goes back when this session still owns the entry, and replaces otherwise.
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
  const [value, setValue] = useQueryState(key, options)
  const parserHistory = readHistoryMode(options.history)

  const setPanelValue = useCallback(
    (next: unknown, callOptions?: PanelCallOptions) => {
      const resolved = resolvePanelUpdater(value, next)
      const action = panelHistoryAction({
        currentValue: value,
        nextValue: resolved,
        requestedHistory: callOptions?.history,
        parserHistory,
      })
      const write = (history: 'push' | 'replace') =>
        setValue(toParserValue(resolved), { ...callOptions, history })

      if (action === 'push') {
        armPanelPush(key)
        return write('push')
      }

      if (action === 'replace-clear') {
        return replacePanelUrl(key, () => write('replace'))
      }

      if (action === 'dismiss') {
        const written: { promise?: Promise<URLSearchParams> } = {}
        dismissPanelUrl(key, () => {
          written.promise = write('replace')
        })
        return written.promise ?? Promise.resolve(new URLSearchParams(window.location.search))
      }

      return write('replace')
    },
    [key, parserHistory, setValue, value]
  )

  return [value, setPanelValue]
}
