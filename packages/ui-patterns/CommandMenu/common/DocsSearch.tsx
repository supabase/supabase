import type { UseCommandOptions } from '../api/types'
import { useAddCommandPage, useSetCommandPage } from '../api/useCommandPages'
import { useCommands } from '../api/useCommands'

const DOCS_SEARCH_PAGE_NAME = 'docs-search'

const DocsSearchInterface = () => <></>

const useDocsSearchCommands = (options?: UseCommandOptions) => {
  const setCommandPage = useSetCommandPage()
  useAddCommandPage(DOCS_SEARCH_PAGE_NAME, DocsSearchInterface)

  useCommands(
    [
      {
        id: 'search-docs',
        name: 'Search docs',
        action: () => setCommandPage(DOCS_SEARCH_PAGE_NAME),
      },
    ],
    'Docs',
    options
  )
}

export { useDocsSearchCommands }
