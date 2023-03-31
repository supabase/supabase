import { PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore, withAuth } from 'hooks'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import ProductMenu from 'components/ui/ProductMenu'
import { generateReportsMenu } from './ReportsMenu.utils'

interface ReportsLayoutProps {
  title?: string
}

const ReportsLayout = ({ title, children }: PropsWithChildren<ReportsLayoutProps>) => {
  const { ui } = useStore()
  const router = useRouter()

  const project = ui.selectedProject
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

export default withAuth(observer(ReportsLayout))
