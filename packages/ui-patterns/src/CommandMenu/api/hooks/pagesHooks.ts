'use client'

import { isEqual } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import { type PageDefinition, isComponentPage } from '../../internal/state/pagesState'
import { useSetQuery } from './queryHooks'

const useCurrentPage = () => {
  const { pagesState } = useCommandContext()
  const { commandPages, pageStack } = useSnapshot(pagesState)

  const topOfStack = pageStack.at(-1)
  const result = useMemo(
    () =>
      topOfStack && commandPages[topOfStack]
        ? { ...commandPages[topOfStack], name: topOfStack }
        : undefined,
    [commandPages, topOfStack]
  )

  return result
}

const usePageComponent = () => {
  const _currentPage = useCurrentPage()

  const currentPage = _currentPage as PageDefinition
  if (!currentPage || !isComponentPage(currentPage)) return undefined

  return currentPage.component
}

const useSetPage = () => {
  const { pagesState } = useCommandContext()
  const setQuery = useSetQuery()

  return (name: string, preserveQuery: boolean = false) => {
    pagesState.appendPageStack(name)
    if (!preserveQuery) setQuery('')
  }
}

const usePopPage = () => {
  const { pagesState } = useCommandContext()
  const { popPageStack } = useSnapshot(pagesState)

  return popPageStack
}

const EMPTY_ARRAY = [] as any[]

const useRegisterPage = (
  name: string,
  definition: PageDefinition,
  { deps = EMPTY_ARRAY, enabled = true }: { deps?: any[]; enabled?: boolean } = {}
) => {
  const { pagesState } = useCommandContext()
  const { registerNewPage } = useSnapshot(pagesState)

  const prevDeps = useRef(deps)
  const prevEnabled = useRef(enabled)

  const unsubscribe = useRef<() => void>()

  /**
   * useEffect handles the registration on first render, since React runs the
   * first render twice in development. (Otherwise the first render would leave
   * a dangling subscription.)
   *
   * It also handles final cleanup, since useMemo can't do this.
   *
   * useMemo handles the registration on subsequent renders, to ensure it
   * happens synchronously.
   */
  useMemo(() => {
    if (!isEqual(prevDeps.current, deps) || prevEnabled.current !== enabled) {
      unsubscribe.current?.()

      unsubscribe.current = enabled ? registerNewPage(name, definition) : undefined

      prevDeps.current = deps
      prevEnabled.current = enabled
    }
  }, [registerNewPage, name, definition, deps, enabled])

  useEffect(() => {
    unsubscribe.current = enabled ? registerNewPage(name, definition) : undefined

    return () => unsubscribe.current?.()
  }, [])
}

export { useCurrentPage, useRegisterPage, useSetPage, usePopPage, usePageComponent }
