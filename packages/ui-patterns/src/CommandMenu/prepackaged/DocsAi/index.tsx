import { AiIconAnimation } from 'ui'

import { useRegisterCommands } from '../../api/hooks/commandsHooks'
import { useRegisterPage, useSetPage } from '../../api/hooks/pagesHooks'
import type { CommandOptions, ICommand } from '../../api/types'
import { PageType } from '../../api/utils'
import { DocsAiPage } from './DocsAiPage'

const DOCS_AI_COMMANDS = {
  PAGE_NAME: 'Ask Supabase AI',
  SECTION_NAME: 'Docs',
}

const identity = <T,>(x: T) => x

const useDocsAiCommands = ({
  modify = identity,
  options,
}: { modify?: (command: ICommand) => ICommand; options?: CommandOptions } = {}) => {
  const setCommandPage = useSetPage()

  useRegisterPage(DOCS_AI_COMMANDS.PAGE_NAME, { type: PageType.Component, component: DocsAiPage })

  useRegisterCommands(
    DOCS_AI_COMMANDS.SECTION_NAME,
    [
      {
        id: 'ai-docs',
        name: 'Ask Supabase AI',
        action: () => {
          setCommandPage(DOCS_AI_COMMANDS.PAGE_NAME, true)
        },
        icon: () => <AiIconAnimation />,
      },
    ].map(modify),
    options
  )
}

export { useDocsAiCommands }
