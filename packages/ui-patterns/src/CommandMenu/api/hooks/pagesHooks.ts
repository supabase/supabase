'use client'

import { useLayoutEffect, useMemo } from 'react'
import { useLatest } from 'react-use'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import { isComponentPage, type PageDefinition } from '../../internal/state/pagesState'
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

  const definitionRef = useLatest(definition)

  // useLayoutEffect runs synchronously after DOM mutations but before paint.
  // This ensures the page is registered before any subsequent code (e.g. in
  // child components) tries to access it, avoiding a timing gap that would
  // exist with useEffect.
  useLayoutEffect(() => {
    if (!enabled) return

    const unsubscribe = registerNewPage(name, definitionRef.current)
    return unsubscribe
  }, [registerNewPage, name, enabled, ...deps])
}

export { useCurrentPage, usePageComponent, usePopPage, useRegisterPage, useSetPage }
