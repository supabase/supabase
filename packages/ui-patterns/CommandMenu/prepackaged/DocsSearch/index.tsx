import { Book } from 'lucide-react'

import { useRegisterCommands } from '../../api/hooks/commandsHooks'
import { useRegisterPage, useSetPage } from '../../api/hooks/pagesHooks'
import type { ICommand, UseCommandOptions } from '../../api/types'
import { PageType } from '../../api/utils'
import { DocsSearchPage } from './DocsSearchPage'

const DOCS_SEARCH_COMMANDS = {
  PAGE_NAME: 'Docs search',
  SECTION_NAME: 'Docs',
}

const identity = <T,>(x: T) => x

const useDocsSearchCommands = ({
  modify = identity,
  options,
}: { modify?: (command: ICommand) => ICommand; options?: UseCommandOptions } = {}) => {
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
