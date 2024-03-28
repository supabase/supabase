import { useRegisterCommands } from '../api/hooks/commandsHooks'
import { useRegisterNewPage, useSetPage } from '../api/hooks/pagesHooks'
import type { ICommand, UseCommandOptions } from '../api/types'

const DOCS_SEARCH_COMMANDS = {
  PAGE_NAME: 'docs-search',
  SECTION_NAME: 'Docs',
}

const DocsSearchInterface = () => <></>

const identity = <T,>(x: T) => x

const useDocsSearchCommands = ({
  modify = identity,
  orderingOptions,
}: { modify?: (command: ICommand) => ICommand; orderingOptions?: UseCommandOptions } = {}) => {
  const setCommandPage = useSetPage()
  useRegisterNewPage(DOCS_SEARCH_COMMANDS.PAGE_NAME, DocsSearchInterface)

  useRegisterCommands(
    DOCS_SEARCH_COMMANDS.SECTION_NAME,
    [
      {
        id: 'search-docs',
        name: 'Search docs',
        action: () => {
          console.log('你都是给点反应啊')
          setCommandPage(DOCS_SEARCH_COMMANDS.PAGE_NAME)
        },
      },
    ].map(modify),
    orderingOptions
  )
}

export { useDocsSearchCommands }
