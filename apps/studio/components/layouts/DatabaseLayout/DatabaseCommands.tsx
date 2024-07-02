import { useParams } from 'common'
import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const useDatabaseGoto = () => {
  const { ref } = useParams()

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-database',
        name: 'Go to Database',
        route: `/project/${ref || '_'}/database/tables`,
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
        route: `/project/${ref || '_'}/database/tables`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-triggers',
        name: 'Triggers',
        value: 'Database: Triggers',
        route: `/project/${ref || '_'}/database/triggers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-functions',
        name: 'Functions',
        value: 'Database: Functions',
        route: `/project/${ref || '_'}/database/functions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-extensions',
        name: 'Extensions',
        value: 'Database: Extensions',
        route: `/project/${ref || '_'}/database/extensions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-roles',
        name: 'Roles',
        value: 'Database: Roles',
        route: `/project/${ref || '_'}/database/roles`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-replication',
        name: 'Replication',
        value: 'Database: Replication',
        route: `/project/${ref || '_'}/database/replication`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-hooks',
        name: 'Webhooks',
        value: 'Database: Webhooks',
        route: `/project/${ref || '_'}/database/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-backups',
        name: 'Backups',
        value: 'Database: Backups',
        route: `/project/${ref || '_'}/database/backups/scheduled`,
        defaultHidden: true,
      },
    ],
    { deps: [ref] }
  )
}

export { useDatabaseGoto }
