import { ArrowRight } from 'lucide-react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useDatabaseGotoCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-database',
        name: 'Go to Database',
        route: `/project/${ref}/database/tables`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )

  useRegisterCommands(
    'Find',
    [
      {
        id: 'nav-database-tables',
        name: 'Tables',
        value: 'Database: Tables',
        route: `/project/${ref}/database/tables`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-triggers',
        name: 'Triggers',
        value: 'Database: Triggers',
        route: `/project/${ref}/database/triggers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-functions',
        name: 'Functions',
        value: 'Database: Functions',
        route: `/project/${ref}/database/functions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-extensions',
        name: 'Extensions',
        value: 'Database: Extensions',
        route: `/project/${ref}/database/extensions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-roles',
        name: 'Roles',
        value: 'Database: Roles',
        route: `/project/${ref}/database/roles`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-replication',
        name: 'Replication',
        value: 'Database: Replication',
        route: `/project/${ref}/database/replication`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-hooks',
        name: 'Webhooks',
        value: 'Database: Webhooks',
        route: `/project/${ref}/database/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-backups',
        name: 'Backups',
        value: 'Database: Backups',
        route: `/project/${ref}/database/backups/scheduled`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-wrappers',
        name: 'Wrappers',
        value: 'Database: Wrappers',
        route: `/project/${ref}/database/wrappers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-migrations',
        name: 'Migrations',
        value: 'Database: Migrations',
        route: `/project/${ref}/database/migrations`,
        defaultHidden: true,
      },
    ],
    { deps: [ref] }
  )
}
