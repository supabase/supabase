import { Book } from 'lucide-react'

import {
  PageType,
  useRegisterCommands,
  useRegisterPage,
  useSetPage,
  type CommandOptions,
  type ICommand,
} from '../..'
import { DocsSearchPage } from './DocsSearchLocal.Page'

const DOCS_SEARCH_COMMANDS = {
  PAGE_NAME: 'Docs search',
  SECTION_NAME: 'Docs',
}

const identity = <T,>(x: T) => x

const useDocsSearchCommands = ({
  modify = identity,
  options,
}: { modify?: (command: ICommand) => ICommand; options?: CommandOptions } = {}) => {
  const setCommandPage = useSetPage()
  useRegisterPage(DOCS_SEARCH_COMMANDS.PAGE_NAME, {
    type: PageType.Component,
    component: DocsSearchPage,
  })

  useRegisterCommands(
    DOCS_SEARCH_COMMANDS.SECTION_NAME,
    [
      {
        id: 'search-docs',
        name: 'Search the docs',
        action: () => {
          setCommandPage(DOCS_SEARCH_COMMANDS.PAGE_NAME, true)
        },
        icon: () => <Book />,
      },
    ].map(modify),
    options
  )
}

export { useDocsSearchCommands }
export { SearchWorkerProvider } from './DocsSearchLocal.client'
