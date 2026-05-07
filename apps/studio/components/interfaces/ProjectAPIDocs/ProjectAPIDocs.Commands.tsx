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
        route: `/project/${ref}/integrations/data_api/docs`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-auth',
        name: 'Auth Docs',
        route: `/project/${ref}/integrations/data_api/docs?page=auth`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-user-management',
        name: 'User Management Docs',
        route: `/project/${ref}/integrations/data_api/docs?page=users-management`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-graphql',
        name: 'GraphQL Docs',
        route: `/project/${ref}/integrations/graphiql`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
