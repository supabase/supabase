import { Code } from 'lucide-react'

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { useParams } from 'common'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'

export function useDatabaseGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'

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
      {
        id: 'nav-database-wrappers',
        name: 'Wrappers',
        value: 'Database: Wrappers',
        route: `/project/${ref}/integrations/wrappers`,
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
    { ...options, deps: [ref] }
  )
}
