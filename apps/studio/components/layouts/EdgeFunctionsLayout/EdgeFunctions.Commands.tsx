import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useFunctionsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-functions',
        name: 'Edge Functions',
        route: `/project/${ref}/functions`,
        defaultHidden: true,
      },
      {
        id: 'nav-functions-secrets',
        name: 'Edge Functions Secrets',
        route: `/project/${ref}/functions/secrets`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
