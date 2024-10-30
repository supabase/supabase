import { useParams } from 'common'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from '../App/CommandMenu/CommandMenu.utils'

export function useApiDocsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-api',
        name: 'Project API Docs',
        route: `/project/${ref}/api`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-auth',
        name: 'Auth Docs',
        route: `/project/${ref}/api?page=auth`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-user-management',
        name: 'User Management Docs',
        route: `/project/${ref}/api?page=users`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-graphql',
        name: 'GraphQL Docs',
        route: `/project/${ref}/api/graphiql`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
