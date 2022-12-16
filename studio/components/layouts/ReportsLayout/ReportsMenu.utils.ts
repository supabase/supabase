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
                name: 'API',
                key: 'api',
                url: `/project/${ref}/reports/api`,
                items: [],
              },
              {
                name: 'Auth',
                key: 'auth',
                url: `/project/${ref}/reports/auth`,
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
