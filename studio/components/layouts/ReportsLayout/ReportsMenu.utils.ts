import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useFlag } from 'hooks'

export const generateReportsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const productReports = useFlag('productReports')

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
        ...(productReports
          ? [
              {
                name: 'API Overview',
                key: 'api-overview',
                url: `/project/${ref}/reports/api-overview`,
                items: [],
              },
              {
                name: 'API Bots',
                key: 'api-bots',
                url: `/project/${ref}/reports/api-bots`,
                items: [],
              },
            ]
          : []),
        {
          name: 'Database',
          key: 'database',
          url: `/project/${ref}/reports/database`,
          items: [],
        },
      ],
    },
  ]
}
