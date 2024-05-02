import { useEffect, useMemo, useReducer, useRef } from 'react'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import {
  type ICommandPageName,
  type PageDefinition,
  isComponentPage,
} from '../../internal/state/pagesState'
import { isEqual } from 'lodash'
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
  name: ICommandPageName,
  definition: PageDefinition,
  { deps = EMPTY_ARRAY, enabled = true }: { deps?: any[]; enabled?: boolean } = {}
) => {
  const { pagesState } = useCommandContext()
  const { registerNewPage } = useSnapshot(pagesState)

  const prevDeps = useRef(deps)
  const prevEnabled = useRef(enabled)

  const unsubscribe = useRef<() => void>()

  /**
   * The double useMemo / useEffect subscription is to handle a pair of
   * intersecting side effects:
   *
   * 1. useMemo ensures that the updates to state happen synchronously
   * 2. useEffect ensures that the first render (which sometimes happens as a
   *    pair of renders, with the second ignoring the refs set by the first)
   *    doesn't leave dangling subscriptions.
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
