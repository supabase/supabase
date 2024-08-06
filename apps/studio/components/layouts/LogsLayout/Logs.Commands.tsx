import { ArrowRight } from 'lucide-react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useLogsGotoCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-logs',
        name: 'Go to Logs',
        route: `/project/${ref}/logs/explorer`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )

  useRegisterCommands(
    'Find',
    [
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
        route: `/project/${ref}/loge/realtime-logs`,
        defaultHidden: true,
      },
    ],
    { deps: [ref] }
  )
}
