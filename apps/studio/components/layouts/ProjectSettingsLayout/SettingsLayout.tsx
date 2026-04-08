import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayout'
import { ProjectLayout } from '../ProjectLayout'
import { useGenerateSettingsMenu } from './SettingsMenu.utils'
import { useIsNavigationV2Enabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { withAuth } from '@/hooks/misc/withAuth'

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
  title: string
}

export const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const isNavigationV2 = useIsNavigationV2Enabled()

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 isBlocking={false} title={title || 'Settings'} product="Settings">
        {children}
      </ProjectLayoutV2>
    )
  }
  return (
    <ProjectLayout
      isBlocking={false}
      product="Settings"
      browserTitle={{ section: title }}
      productMenu={<SettingsProductMenu />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SettingsLayout)
