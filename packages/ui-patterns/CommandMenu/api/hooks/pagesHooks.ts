import { type ComponentType, useEffect } from 'react'
import { useSnapshot } from 'valtio'

import { useCommandContext } from '../../internal/Context'
import { type ICommandPageName, type PageComponent } from '../../internal/state/pagesState'

const useCurrentPage = () => {
  const { pagesState } = useCommandContext()
  const { pageStack } = useSnapshot(pagesState)

  return pageStack.at(-1)
}

const usePageComponent = () => {
  const { pagesState } = useCommandContext()
  const { commandPages } = useSnapshot(pagesState)
  const currentPage = useCurrentPage()

  return currentPage && commandPages[currentPage]
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

const useRegisterPage = (name: ICommandPageName, component: PageComponent) => {
  const { pagesState } = useCommandContext()
  const { registerNewPage } = useSnapshot(pagesState)

  useEffect(() => registerNewPage(name, component), [registerNewPage])
}

export { useCurrentPage, useRegisterPage, useSetPage, usePopPage, usePageComponent }
