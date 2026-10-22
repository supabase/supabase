import { useQueryState, type UseQueryStateOptions, type UseQueryStateReturn } from 'nuqs'
import { useCallback, useRef } from 'react'

import { armPanelPush, dismissPanelUrl, readNavigation, replacePanelUrl } from '@/lib/panel-history'
import { panelHistoryAction } from '@/lib/panel-history.utils'

type PanelCallOptions = { history?: 'push' | 'replace' }

function readHistoryMode(history: unknown): 'push' | 'replace' | undefined {
  if (history === 'push' || history === 'replace') return history
  return undefined
}

function isPanelValueUpdater(next: unknown): next is (current: unknown) => unknown {
  return typeof next === 'function'
}

/**
 * Going back resolves after `currententrychange`. Until that event, `location`
 * is still the open panel, so this must not resolve with the search read immediately.
 * Subscribe before `back()` — that event can fire before `back()` returns.
 */
function listenForEntryChange() {
  const navigation = readNavigation()
  let settled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let resolvePromise: (search: URLSearchParams) => void = () => {}

  const promise = new Promise<URLSearchParams>((resolve) => {
    resolvePromise = resolve
  })

  const finish = () => {
    if (settled) return
    settled = true
    navigation?.removeEventListener('currententrychange', finish)
    if (timer !== undefined) clearTimeout(timer)
    resolvePromise(new URLSearchParams(window.location.search))
  }

  if (navigation) navigation.addEventListener('currententrychange', finish)
  timer = setTimeout(finish, 1000)

  return {
    promise,
    cancel: () => {
      if (settled) return
      settled = true
      navigation?.removeEventListener('currententrychange', finish)
      if (timer !== undefined) clearTimeout(timer)
    },
  }
}

/**
 * `useQueryState` for a panel param.
 * Push only on closed to open. A new value while open replaces, even when the
 * caller passes `{ history: 'push' }`.
 * Clearing goes back when this session still owns the entry, and replaces otherwise.
 * Clearing a key that is already clear does nothing.
 */
export function usePanelQueryState<T>(
  key: string,
  options: UseQueryStateOptions<T> & { defaultValue: T }
): UseQueryStateReturn<NonNullable<ReturnType<typeof options.parse>>, typeof options.defaultValue>
export function usePanelQueryState<T>(
  key: string,
  options: UseQueryStateOptions<T>
): UseQueryStateReturn<NonNullable<ReturnType<typeof options.parse>>, undefined>
export function usePanelQueryState<T>(key: string, options: UseQueryStateOptions<T>) {
  const [value, setValue] = useQueryState(key, options)
  const parserHistory = readHistoryMode(options.history)
  const valueRef = useRef(value)
  valueRef.current = value

  const setPanelValue = useCallback(
    (next: Parameters<typeof setValue>[0], callOptions?: PanelCallOptions) => {
      const currentValue = valueRef.current
      const resolved = isPanelValueUpdater(next) ? next(currentValue) : next
      const action = panelHistoryAction({
        currentValue,
        nextValue: resolved,
        requestedHistory: callOptions?.history,
        parserHistory,
      })
      const write = (history: 'push' | 'replace') =>
        setValue(resolved as Parameters<typeof setValue>[0], { ...callOptions, history })

      if (action === 'noop') {
        return Promise.resolve(new URLSearchParams(window.location.search))
      }

      if (action === 'push') {
        armPanelPush(key)
        return write('push')
      }

      if (action === 'replace-clear') {
        return replacePanelUrl(key, () => write('replace'))
      }

      if (action === 'dismiss') {
        const pending = listenForEntryChange()
        let replaced: Promise<URLSearchParams> | undefined
        dismissPanelUrl(key, () => {
          replaced = write('replace')
        })
        if (replaced) {
          pending.cancel()
          return replaced
        }
        return pending.promise
      }

      return write('replace')
    },
    [key, parserHistory, setValue]
  )

  return [value, setPanelValue]
}
