import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useFunctionsGotoCommands(options?: CommandOptions) {
  let { slug, ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-functions',
        name: 'Edge Functions',
        route: `/org/${slug}/project/${ref}/functions`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref, slug] }
  )
}
