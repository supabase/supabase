import { Project } from 'types'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useFlag } from 'hooks'

export const generateReportsMenu = (project?: Project): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const productReports = useFlag('productReports')

  return [
    {
      title: 'Reports',
      items: [
        {
          name: 'Custom reports',
          key: '',
          url: `/project/${ref}/reports`,
          items: [],
        },
        ...(productReports
          ? [
              {
                name: 'API',
                key: 'api-overview',
                url: `/project/${ref}/reports/api-overview`,
                items: []
              },
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
