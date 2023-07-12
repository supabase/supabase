import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import ProductMenu from 'components/ui/ProductMenu'
import { useSelectedProject, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateReportsMenu } from './ReportsMenu.utils'

interface ReportsLayoutProps {
  title?: string
}

const ReportsLayout = ({ title, children }: PropsWithChildren<ReportsLayoutProps>) => {
  const router = useRouter()

  const project = useSelectedProject()
  const page = router.pathname.split('/')[4] || ''

  return (
    <ProjectLayout
      title={title}
      product="Reports"
      productMenu={<ProductMenu page={page} menu={generateReportsMenu(project)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(ReportsLayout)
