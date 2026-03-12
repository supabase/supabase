import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateSettingsMenu } from './SettingsMenu.utils'

/**
 * Menu-only component for the settings section. Used by the desktop sidebar and by the
 * mobile sheet submenu. Must not wrap ProjectLayout so that opening the settings submenu
 * in the mobile sheet does not overwrite registerOpenMenu and break the menu button.
 */
export const SettingsProductMenu = () => {
  const router = useRouter()

  const page = router.pathname.includes('billing')
    ? router.pathname.split('/')[5]
    : router.pathname.split('/')[4]

  const menu = useGenerateSettingsMenu()

  return <ProductMenu page={page} menu={menu} />
}

interface SettingsLayoutProps {
  title?: string
}

export const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  return (
    <ProjectLayout
      isBlocking={false}
      title={title || 'Settings'}
      product="Settings"
      productMenu={<SettingsProductMenu />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SettingsLayout)
