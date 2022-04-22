import { FC, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore } from 'hooks'
import { generateSettingsMenu } from './SettingsMenu.utils'

import BaseLayout from '../'
import ProductMenu from 'components/ui/ProductMenu'

interface Props {
  title?: string
  children: ReactNode
}

const SettingsLayout: FC<Props> = ({ title, children }) => {
  const { ui } = useStore()
  const projectRef = ui.selectedProjectRef as string
  const projectBaseInfo = ui.selectedProjectBaseInfo

  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menuRoutes = generateSettingsMenu(projectRef, projectBaseInfo)

  return (
    <BaseLayout
      title={title || 'Settings'}
      product="Settings"
      productMenu={<ProductMenu page={page} menu={menuRoutes} />}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </BaseLayout>
  )
}

export default observer(SettingsLayout)
