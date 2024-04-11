import { useEffect, useReducer, useRef } from 'react'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import {
  type ICommandPageName,
  type PageDefinition,
  isComponentPage,
} from '../../internal/state/pagesState'
import { isEqual } from 'lodash'

const useCurrentPage = () => {
  const { pagesState } = useCommandContext()
  const { commandPages, pageStack } = useSnapshot(pagesState)

  const topOfStack = pageStack.at(-1)

  return topOfStack ? commandPages[topOfStack] : undefined
}

const usePageComponent = () => {
  const _currentPage = useCurrentPage()

  const currentPage = _currentPage as PageDefinition
  if (!currentPage || !isComponentPage(currentPage)) return undefined

  return currentPage.component
}

const useSetPage = () => {
  const { pagesState } = useCommandContext()
  return pagesState.appendPageStack
}

const usePopPage = () => {
  const { pagesState } = useCommandContext()
  const { popPageStack } = useSnapshot(pagesState)

  return popPageStack
}

const useRegisterPage = (name: ICommandPageName, definition: PageDefinition, deps: any[] = []) => {
  const { pagesState } = useCommandContext()
  const { registerNewPage } = useSnapshot(pagesState)

  const [rerenderFlag, toggleRerenderFlag] = useReducer((flag) => (flag === 0 ? 1 : 0), 0)
  const prevDeps = useRef(deps)

  if (!isEqual(prevDeps.current, deps)) {
    prevDeps.current = deps
    toggleRerenderFlag()
  }

  useEffect(() => registerNewPage(name, definition), [registerNewPage, rerenderFlag])
}

export { useCurrentPage, useRegisterPage, useSetPage, usePopPage, usePageComponent }
