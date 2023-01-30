import { PropsWithChildren } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore, withAuth } from 'hooks'
import BaseLayout from '..'
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
    <BaseLayout
      title={title}
      product="Reports"
      productMenu={<ProductMenu page={page} menu={generateReportsMenu(project)} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </BaseLayout>
  )
}

export default withAuth(observer(ReportsLayout))
