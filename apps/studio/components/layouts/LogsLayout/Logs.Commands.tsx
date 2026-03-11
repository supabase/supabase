import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useLogsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const { logsCollections } = useIsFeatureEnabled(['logs:collections'])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-logs-explorer',
        name: 'Logs Explorer',
        route: `/project/${ref}/logs/explorer`,
        defaultHidden: true,
      },
      ...(logsCollections
        ? ([
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
          ] as IRouteCommand[])
        : []),
    ],
    { ...options, deps: [ref] }
  )
}
