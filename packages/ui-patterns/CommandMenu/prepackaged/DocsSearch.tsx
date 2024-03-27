import type { ICommand, UseCommandOptions } from '../api/types'
import { useAddCommandPage, useSetCommandPage } from '../api/useCommandPages'
import { useCommands } from '../api/useCommands'

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
  const setCommandPage = useSetCommandPage()
  useAddCommandPage(DOCS_SEARCH_COMMANDS.PAGE_NAME, DocsSearchInterface)

  useCommands(
    [
      {
        id: 'search-docs',
        name: 'Search docs',
        action: () => setCommandPage(DOCS_SEARCH_COMMANDS.PAGE_NAME),
      },
    ].map(modify),
    DOCS_SEARCH_COMMANDS.SECTION_NAME,
    orderingOptions
  )
}

export { useDocsSearchCommands }
