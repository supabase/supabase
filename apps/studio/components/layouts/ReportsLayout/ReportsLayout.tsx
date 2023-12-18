import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import ProductMenu from 'components/ui/ProductMenu'
import { useIsFeatureEnabled, useSelectedProject, withAuth } from 'hooks'
import ProjectLayout from '../'

interface ReportsLayoutProps {
  title?: string
}

const ReportsLayout = ({ title, children }: PropsWithChildren<ReportsLayoutProps>) => {
  const router = useRouter()

  const project = useSelectedProject()
  const page = router.pathname.split('/')[4] || ''
  const ref = project?.ref ?? 'default'

  const storageEnabled = useIsFeatureEnabled('project_storage:all')

  const menuItems = [
    {
      title: '',
      items: [
        {
          name: 'Custom reports',
          key: '[id]',
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

        {
          name: 'Storage',
          key: 'storage',
          url: `/project/${ref}/reports/storage`,
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
        },
      ],
    },
  ]

  return (
    <ProjectLayout
      title={title}
      product="Reports"
      productMenu={<ProductMenu page={page} menu={menuItems} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(ReportsLayout)
