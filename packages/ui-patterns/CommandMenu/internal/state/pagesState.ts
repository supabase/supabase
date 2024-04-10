import { type ReactNode } from 'react'
import { proxy } from 'valtio'

type ICommandPageName = string

type PageComponent = () => ReactNode

type IPagesState = {
  commandPages: Record<ICommandPageName, PageComponent>
  pageStack: Array<ICommandPageName>
  registerNewPage: (name: ICommandPageName, component: PageComponent) => () => void
  appendPageStack: (name: ICommandPageName) => void
  popPageStack: () => void
}

const initPagesState = () => {
  const state: IPagesState = proxy({
    commandPages: {},
    pageStack: [],
    registerNewPage: (name, component) => {
      state.commandPages[name] = component
      return () => {
        state.pageStack = state.pageStack.filter((page) => page !== name)
        delete state.commandPages[name]
      }
    },
    appendPageStack: (name) => state.pageStack.at(-1) !== name && state.pageStack.push(name),
    popPageStack: () => state.pageStack.pop(),
  })

  return state
}

export { initPagesState }
export type { ICommandPageName, IPagesState, PageComponent }
