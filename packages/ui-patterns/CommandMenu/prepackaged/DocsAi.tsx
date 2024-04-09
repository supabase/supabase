import { useRegisterCommands } from '../api/hooks/commandsHooks'
import { useRegisterPage, useSetPage } from '../api/hooks/pagesHooks'
import type { ICommand, UseCommandOptions } from '../api/types'

import { AiIconAnimation } from 'ui'

const DOCS_AI_COMMANDS = {
  PAGE_NAME: 'docs-ai',
  SECTION_NAME: 'Docs',
}

const DocsAiInterface = () => <h1>Docs AI</h1>

const identity = <T,>(x: T) => x

const useDocsAiCommands = ({
  modify = identity,
  options,
}: { modify?: (command: ICommand) => ICommand; options?: UseCommandOptions } = {}) => {
  const setCommandPage = useSetPage()

  useRegisterPage(DOCS_AI_COMMANDS.PAGE_NAME, DocsAiInterface)

  useRegisterCommands(
    DOCS_AI_COMMANDS.SECTION_NAME,
    [
      {
        id: 'ai-docs',
        name: 'Ask Supabase AI',
        action: () => {
          setCommandPage(DOCS_AI_COMMANDS.PAGE_NAME)
        },
        icon: () => <AiIconAnimation />,
        className: 'text-brand',
      },
    ].map(modify),
    options
  )
}

export { useDocsAiCommands }
