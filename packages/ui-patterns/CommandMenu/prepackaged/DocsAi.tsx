import { useRegisterCommands } from '../api/hooks/commandsHooks'
import { useRegisterNewPage, useSetPage } from '../api/hooks/pagesHooks'
import type { ICommand, UseCommandOptions } from '../api/types'

const DOCS_AI_COMMANDS = {
  PAGE_NAME: 'docs-ai',
  SECTION_NAME: 'Docs',
}

const DocsAiInterface = () => <></>

const identity = <T,>(x: T) => x

const useDocsAiCommands = ({
  modify = identity,
  orderingOptions,
}: { modify?: (command: ICommand) => ICommand; orderingOptions?: UseCommandOptions } = {}) => {
  const setCommandPage = useSetPage()
  useRegisterNewPage(DOCS_AI_COMMANDS.PAGE_NAME, DocsAiInterface)

  useRegisterCommands(
    DOCS_AI_COMMANDS.SECTION_NAME,
    [
      {
        id: 'ai-docs',
        name: 'Ask Supabase AI',
        action: () => {
          setCommandPage(DOCS_AI_COMMANDS.PAGE_NAME)
        },
      },
    ].map(modify),
    orderingOptions
  )
}

export { useDocsAiCommands }
