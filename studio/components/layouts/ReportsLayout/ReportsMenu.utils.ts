import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateReportsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: '',
      items: [
        {
          name: 'Custom reports',
          key: '',
          url: `/project/${ref}/reports`,
          items: [],
        },
      ],
    },
    {
      items: [
        {
          name: 'API',
          key: 'api-overview',
          url: `/project/${ref}/reports/api-overview`,
          items: [],
          label: 'NEW',
        },
        {
          name: 'Database',
          key: 'database',
          url: `/project/${ref}/reports/database`,
          items: [],
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/project/${ref}/reports/query-performance`,
          items: [],
          label: 'NEW',
        },
      ],
    },
  ]
}
