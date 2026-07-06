import { Realtime } from 'icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { generateRealtimeMenu } from './RealtimeMenu.utils'
import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { withAuth } from '@/hooks/misc/withAuth'

/**
 * Menu-only component for the Realtime section. Used by the desktop sidebar and by the
 * mobile sheet submenu. Must not wrap ProjectLayout so that opening the realtime submenu
 * in the mobile sheet does not overwrite registerOpenMenu and break the menu button.
 */
export const RealtimeProductMenu = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const page = router.pathname.split('/')[4]

  return <ProductMenu page={page} menu={generateRealtimeMenu(project ?? undefined)} />
}

export interface RealtimeLayoutProps {
  title: string
}

export const RealtimeLayout = ({ title, children }: PropsWithChildren<RealtimeLayoutProps>) => {
  const { data: project } = useSelectedProjectQuery()
  const { isHighAvailability } = useHighAvailability()
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = generateRealtimeMenu(project)

  if (isHighAvailability) {
    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="description" content="Supabase Studio" />
        </Head>
        <main
          id="panel-project-content"
          className="h-full w-full xl:min-w-[600px] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-dash-sidebar p-6 @container"
        >
          <HighAvailabilityDisabledEmptyState
            icon={<Realtime size={22} strokeWidth={1.5} />}
            title="Realtime unavailable on High Availability projects"
            description="We're working to bring realtime to High Availability projects. Contact support if this is blocking your work."
          />
        </main>
      </>
    )
  }

  return (
    <ProjectLayout
      product="Realtime"
      browserTitle={{ section: title }}
      productMenu={<ProductMenu page={page} menu={menu} />}
      isBlocking={false}
    >
      <ProductMenuShortcuts menu={menu} />
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
