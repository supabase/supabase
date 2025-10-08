import { Blocks, Code, Database, History, Search } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useDatabaseGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

  const { databaseReplication, databaseRoles, integrationsWrappers } = useIsFeatureEnabled([
    'database:replication',
    'database:roles',
    'integrations:wrappers',
  ])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.QUERY,
    [
      {
        id: 'run-sql',
        name: 'Run SQL',
        route: `/project/${ref}/sql/new`,
        icon: () => <Code />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
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
      ...(databaseRoles
        ? [
            {
              id: 'nav-database-roles',
              name: 'Roles',
              value: 'Database: Roles',
              route: `/project/${ref}/database/roles`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(databaseReplication
        ? [
            {
              id: 'nav-database-replication',
              name: 'Replication',
              value: 'Database: Replication',
              route: `/project/${ref}/database/replication`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-database-hooks',
        name: 'Webhooks',
        value: 'Database: Webhooks',
        route: `/project/${ref}/integrations/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-backups',
        name: 'Backups',
        value: 'Database: Backups',
        route: `/project/${ref}/database/backups/scheduled`,
        defaultHidden: true,
      },
      ...(integrationsWrappers
        ? [
            {
              id: 'nav-database-wrappers',
              name: 'Wrappers',
              value: 'Database: Wrappers',
              route: `/project/${ref}/integrations?category=wrappers`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-database-migrations',
        name: 'Migrations',
        value: 'Database: Migrations',
        route: `/project/${ref}/database/migrations`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.DATABASE,
    [
      {
        id: 'run-schema-visualizer',
        name: 'View your schemas',
        route: `/project/${ref}/database/schemas`,
        icon: () => <Search />,
      },
      {
        id: 'run-view-database-functions',
        name: 'View and create functions',
        route: `/project/${ref}/database/functions`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-triggers',
        name: 'View and create triggers',
        route: `/project/${ref}/database/triggers`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-enumerated-types',
        name: 'View and create enumerated types',
        route: `/project/${ref}/database/types`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-extensions',
        name: 'View your extensions',
        route: `/project/${ref}/database/extensions`,
        icon: () => <Blocks />,
      },
      {
        id: 'run-view-database-indexes',
        name: 'View and create indexes',
        route: `/project/${ref}/database/indexes`,
        icon: () => <Database />,
      },
      ...(databaseRoles
        ? [
            {
              id: 'run-view-database-roles',
              name: 'View your roles',
              route: `/project/${ref}/database/roles`,
              icon: () => <Database />,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'run-view-database-backups',
        name: 'View your backups',
        route: `/project/${ref}/database/backups/scheduled`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-migrations',
        name: 'View your migrations',
        route: `/project/${ref}/database/migrations`,
        icon: () => <History />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}
