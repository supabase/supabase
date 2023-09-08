import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useFlag } from 'hooks'

export const generateReportsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const storageReportFlag = useFlag('storageReport')
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
        },
        ...(storageReportFlag
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/project/${ref}/reports/storage`,
                items: [],
                label: 'NEW',
              },
            ]
          : []),
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
        },
      ],
    },
  ]
}
