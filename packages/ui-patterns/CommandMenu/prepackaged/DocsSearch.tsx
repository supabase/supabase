import { useRegisterCommands } from '../api/hooks/commandsHooks'
import { useRegisterPage, useSetPage } from '../api/hooks/pagesHooks'
import type { ICommand, UseCommandOptions } from '../api/types'

const DOCS_SEARCH_COMMANDS = {
  PAGE_NAME: 'docs-search',
  SECTION_NAME: 'Docs',
}

const DocsSearchInterface = () => <h1>Docs search</h1>

const identity = <T,>(x: T) => x

const useDocsSearchCommands = ({
  modify = identity,
  options,
}: { modify?: (command: ICommand) => ICommand; options?: UseCommandOptions } = {}) => {
  const setCommandPage = useSetPage()
  useRegisterPage(DOCS_SEARCH_COMMANDS.PAGE_NAME, DocsSearchInterface)

  useRegisterCommands(
    DOCS_SEARCH_COMMANDS.SECTION_NAME,
    [
      {
        id: 'search-docs',
        name: 'Search docs',
        action: () => {
          setCommandPage(DOCS_SEARCH_COMMANDS.PAGE_NAME)
        },
      },
    ].map(modify),
    options
  )
}

export { useDocsSearchCommands }
