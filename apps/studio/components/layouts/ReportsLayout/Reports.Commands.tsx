import { ArrowRight } from 'lucide-react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useReportsGotoCommands() {
  const project = useSelectedProject()
  const ref = project?.ref || '_'

  useRegisterCommands(
    'Go to',
    [
      {
        id: 'nav-reports',
        name: 'Go to Reports',
        route: `/project/${ref}/reports`,
        icon: () => <ArrowRight />,
      },
    ],
    { deps: [ref] }
  )

  useRegisterCommands(
    'Find',
    [
      {
        id: 'nav-reports-api',
        name: 'API Reports',
        route: `/project/${ref}/reports/api-overview`,
        defaultHidden: true,
      },
      {
        id: 'nav-reports-storage',
        name: 'Storage Reports',
        route: `/project/${ref}/reports/storage`,
        defaultHidden: true,
      },
      {
        id: 'nav-reports-database',
        name: 'Database Reports',
        route: `/project/${ref}/reports/database`,
        defaultHidden: true,
      },
      {
        id: 'nav-reports-query-performance',
        name: 'Query Performance Reports',
        route: `/project/${ref}/reports/query-performance`,
        defaultHidden: true,
      },
    ],
    { deps: [ref] }
  )
}
