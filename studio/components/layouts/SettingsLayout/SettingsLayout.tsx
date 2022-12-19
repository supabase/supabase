import { FC, ReactNode, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useStore, withAuth } from 'hooks'
import { generateSettingsMenu } from './SettingsMenu.utils'

import BaseLayout from '../'
import ProductMenu from 'components/ui/ProductMenu'

interface Props {
  title?: string
  children: ReactNode
}

const SettingsLayout: FC<Props> = ({ title, children }) => {
  const { ui, meta } = useStore()
  const projectRef = ui.selectedProjectRef as string
  const projectBaseInfo = ui.selectedProjectBaseInfo

  const router = useRouter()
  // billing pages live under /billing/invoices and /billing/subscription, etc
  // so we need to pass the [5]th part of the url to the menu
  const page = router.pathname.includes('billing')
    ? router.pathname.split('/')[5]
    : router.pathname.split('/')[4]

  const menuRoutes = generateSettingsMenu(projectRef, projectBaseInfo)

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      meta.extensions.load()
    }
  }, [ui.selectedProject?.ref])

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

export default withAuth(observer(SettingsLayout))
