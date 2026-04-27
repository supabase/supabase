import { useCallback, useMemo, useSyncExternalStore } from 'react'

import { Lint } from '@/data/lint/lint-query'

const DISMISSIBLE_GRAPHQL_LINT_NAMES = [
  'pg_graphql_anon_table_exposed',
  'pg_graphql_authenticated_table_exposed',
] as const

export type DismissibleGraphqlLintName = (typeof DISMISSIBLE_GRAPHQL_LINT_NAMES)[number]

export type DismissedGraphqlLintEntry = {
  lintName: DismissibleGraphqlLintName
  schema: string
  name: string
}

export const isDismissibleGraphqlLint = (name: string | undefined | null): boolean =>
  !!name && (DISMISSIBLE_GRAPHQL_LINT_NAMES as readonly string[]).includes(name)

export const asDismissibleGraphqlLint = (
  name: string | undefined | null
): DismissibleGraphqlLintName | null =>
  isDismissibleGraphqlLint(name) ? (name as DismissibleGraphqlLintName) : null

const storageKey = (projectRef: string | undefined) =>
  `supabase.advisor.dismissed-graphql-lints.${projectRef ?? 'unknown'}`

const isSameEntry = (a: DismissedGraphqlLintEntry, b: DismissedGraphqlLintEntry) =>
  a.lintName === b.lintName && a.schema === b.schema && a.name === b.name

// Module-level cache + subscriber set, keyed by storage key. This makes the
// store observable across components in the same tab without depending on
// react-query/localStorage propagation timing.
const cache = new Map<string, DismissedGraphqlLintEntry[]>()
const subscribers = new Map<string, Set<() => void>>()
const EMPTY: DismissedGraphqlLintEntry[] = []

const readFromStorage = (key: string): DismissedGraphqlLintEntry[] => {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DismissedGraphqlLintEntry[]) : EMPTY
  } catch {
    return EMPTY
  }
}

const getSnapshot = (key: string): DismissedGraphqlLintEntry[] => {
  if (!cache.has(key)) cache.set(key, readFromStorage(key))
  return cache.get(key) ?? EMPTY
}

const notify = (key: string) => {
  subscribers.get(key)?.forEach((cb) => cb())
}

const subscribe = (key: string, cb: () => void) => {
  let set = subscribers.get(key)
  if (!set) {
    set = new Set()
    subscribers.set(key, set)
  }
  set.add(cb)
  return () => {
    set?.delete(cb)
  }
}

const writeToStore = (
  key: string,
  updater: (current: DismissedGraphqlLintEntry[]) => DismissedGraphqlLintEntry[]
) => {
  const current = getSnapshot(key)
  const next = updater(current)
  if (next === current) return
  cache.set(key, next)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // ignore storage failures (quota, private mode, etc.)
    }
  }
  notify(key)
}

export const useDismissedGraphqlLints = (projectRef: string | undefined) => {
  const key = storageKey(projectRef)

  const dismissed = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    useCallback(() => getSnapshot(key), [key]),
    () => EMPTY
  )

  const dismiss = useCallback(
    (entry: DismissedGraphqlLintEntry) => {
      writeToStore(key, (current) => {
        if (current.some((e) => isSameEntry(e, entry))) return current
        return [...current, entry]
      })
    },
    [key]
  )

  const isDismissed = useCallback(
    (lint: Lint) => {
      const lintName = asDismissibleGraphqlLint(lint.name)
      if (!lintName) return false
      const schema = lint.metadata?.schema
      const name = lint.metadata?.name
      if (!schema || !name) return false
      return dismissed.some(
        (e) => e.lintName === lintName && e.schema === schema && e.name === name
      )
    },
    [dismissed]
  )

  const filterDismissed = useCallback(
    (lints: Lint[]) => lints.filter((lint) => !isDismissed(lint)),
    [isDismissed]
  )

  return useMemo(
    () => ({ dismissed, dismiss, isDismissed, filterDismissed }),
    [dismissed, dismiss, isDismissed, filterDismissed]
  )
}
