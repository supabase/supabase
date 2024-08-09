import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useLogsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-logs-explorer',
        name: 'Logs Explorer',
        route: `/project/${ref}/logs/explorer`,
        defaultHidden: true,
      },
      {
        id: 'nav-logs-postgres',
        name: 'Postgres Logs',
        route: `/project/${ref}/logs/postgres-logs`,
        defaultHidden: true,
      },
      {
        id: 'nav-logs-postgrest',
        name: 'PostgREST Logs',
        route: `/project/${ref}/logs/postgrest-logs`,
        defaultHidden: true,
      },
      {
        id: 'nav-logs-pooler',
        name: 'Pooler Logs',
        route: `/project/${ref}/logs/pooler-logs`,
        defaultHidden: true,
      },
      {
        id: 'nav-logs-auth',
        name: 'Auth Logs',
        route: `/project/${ref}/logs/auth-logs`,
        defaultHidden: true,
      },
      {
        id: 'nav-logs-storage',
        name: 'Storage Logs',
        route: `/project/${ref}/logs/storage-logs`,
        defaultHidden: true,
      },
      {
        id: 'nav-logs-realtime',
        name: 'Realtime Logs',
        route: `/project/${ref}/logs/realtime-logs`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
