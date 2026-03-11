import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateSettingsMenu } from './SettingsMenu.utils'

interface SettingsLayoutProps {
  title?: string
}

const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const router = useRouter()

  // billing pages live under /billing/invoices and /billing/subscription, etc
  // so we need to pass the [5]th part of the url to the menu
  const page = router.pathname.includes('billing')
    ? router.pathname.split('/')[5]
    : router.pathname.split('/')[4]

  const menu = useGenerateSettingsMenu()

  return (
    <ProjectLayout
      isBlocking={false}
      title={title || 'Settings'}
      product="Settings"
      productMenu={<ProductMenu page={page} menu={menu} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SettingsLayout)
