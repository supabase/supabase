import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { useParams } from 'common'

const useReportsGoto = () => {
  let { ref } = useParams()
  ref ||= '_'

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

export { useReportsGoto }
