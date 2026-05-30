import { type ReactNode } from 'react'
import { proxy } from 'valtio'

import { type ICommandSection } from '../types'

type PageComponent = () => ReactNode

enum PageType {
  Commands,
  Component,
}

interface CommandsPage {
  type: PageType.Commands
  sections: ICommandSection[]
}

interface ComponentPage {
  type: PageType.Component
  component: PageComponent
}

type PageDefinition = CommandsPage | ComponentPage

const isCommandsPage = (page: PageDefinition): page is CommandsPage =>
  page.type === PageType.Commands
const isComponentPage = (page: PageDefinition): page is ComponentPage =>
  page.type === PageType.Component

type IPagesState = {
  commandPages: Record<string, PageDefinition>
  pageStack: Array<string>
  registerNewPage: (name: string, page: PageDefinition) => () => void
  appendPageStack: (name: string) => void
  popPageStack: () => void
}

const initPagesState = () => {
  const state: IPagesState = proxy({
    commandPages: {},
    pageStack: [],
    registerNewPage: (name, definition) => {
      state.commandPages[name] = definition
      return () => {
        state.pageStack = state.pageStack.filter((page) => page !== name)
        delete state.commandPages[name]
      }
    },
    appendPageStack: (name) =>
      name in state.commandPages && state.pageStack.at(-1) !== name && state.pageStack.push(name),
    popPageStack: () => state.pageStack.pop(),
  })

  return state
}

export { PageType, initPagesState, isCommandsPage, isComponentPage }
export type { IPagesState, PageDefinition }
