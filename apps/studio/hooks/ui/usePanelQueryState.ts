import { useQueryState, type UseQueryStateOptions, type UseQueryStateReturn } from 'nuqs'
import { useCallback } from 'react'

import { armPanelPush, dismissPanelUrl, replacePanelUrl } from '@/lib/panel-history'
import { panelHistoryAction } from '@/lib/panel-history.utils'

function isValueUpdater(next: unknown): next is (current: unknown) => unknown {
  return typeof next === 'function'
}

function readPanelValue(current: unknown, next: unknown) {
  if (isValueUpdater(next)) return next(current)
  return next
}

type PanelCallOptions = { history?: 'push' | 'replace' }

function readHistoryMode(history: unknown): 'push' | 'replace' | undefined {
  if (history === 'push' || history === 'replace') return history
  return undefined
}

function readNavigationTarget(): EventTarget | null {
  if (typeof window === 'undefined') return null

  const candidate = Reflect.get(window, 'navigation')
  if (typeof candidate !== 'object' || candidate === null) return null
  if (typeof Reflect.get(candidate, 'addEventListener') !== 'function') return null

  return candidate as EventTarget
}

/**
 * Going back resolves after `currententrychange`. Until that event, `location`
 * is still the open panel, so this must not resolve with the search read immediately.
 * Subscribe before `back()` — the double emits `currententrychange` synchronously.
 */
function listenForEntryChange() {
  const navigation = readNavigationTarget()
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

  const setPanelValue = useCallback(
    (next: Parameters<typeof setValue>[0], callOptions?: PanelCallOptions) => {
      const resolved = readPanelValue(value, next)
      const action = panelHistoryAction({
        currentValue: value,
        nextValue: resolved,
        requestedHistory: callOptions?.history,
        parserHistory,
      })
      const write = (history: 'push' | 'replace') => setValue(next, { ...callOptions, history })

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
    [key, parserHistory, setValue, value]
  )

  return [value, setPanelValue]
}
