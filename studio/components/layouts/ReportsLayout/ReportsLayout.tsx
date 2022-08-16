import { FC, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore, withAuth } from 'hooks'
import { generateSettingsMenu } from './SettingsMenu.utils'

import BaseLayout from '..'
import ProductMenu from 'components/ui/ProductMenu'

interface Props {
  title: string
  children: ReactNode
}

const ReportsLayout: FC<Props> = ({ title, children }) => {
  const { ui } = useStore()
  const projectRef = ui.selectedProjectRef as string

  const router = useRouter()
  const page = router.pathname.split('/')[4] || ''
  const menuRoutes = [
    {
      items: [
        {
          name: 'Overview',
          key: '',
          url: `/project/${projectRef}/reports`,
          items: [],
        },
      ],
    },
    {
      items: [
        {
          name: 'Dashboard',
          key: 'dashboard',
          url: `/project/${projectRef}/reports/dashboard`,
          items: [],
        },
      ],
    },
  ]
  return (
    <BaseLayout
      title={title}
      product="Reports"
      productMenu={<ProductMenu page={page} menu={menuRoutes} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </BaseLayout>
  )
}

export default withAuth(observer(ReportsLayout))
