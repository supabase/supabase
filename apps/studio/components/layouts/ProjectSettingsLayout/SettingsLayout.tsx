import { useLocation } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateSettingsMenu } from './SettingsMenu.utils'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { withAuth } from '@/hooks/misc/withAuth'

/**
 * Menu-only component for the settings section. Used by the desktop sidebar and by the
 * mobile sheet submenu. Must not wrap ProjectLayout so that opening the settings submenu
 * in the mobile sheet does not overwrite registerOpenMenu and break the menu button.
 */
export const SettingsProductMenu = () => {
  const pathname = useLocation({ select: (location) => location.pathname })

  const page = pathname.includes('billing') ? pathname.split('/')[5] : pathname.split('/')[4]

  const menu = useGenerateSettingsMenu()

  return (
    <>
      <ProductMenuShortcuts menu={menu} />
      <ProductMenu page={page} menu={menu} />
    </>
  )
}

interface SettingsLayoutProps {
  title: string
}

export const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
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
