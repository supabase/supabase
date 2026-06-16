import { Realtime } from 'icons'
import { ExternalLink } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'
import { Button } from 'ui'

import { ProjectLayout } from '../ProjectLayout'
import { generateRealtimeMenu } from './RealtimeMenu.utils'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
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
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = generateRealtimeMenu(project)

  if (!!project?.high_availability) {
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
          <div className="flex max-w-md flex-col items-center gap-y-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-strong bg-surface-100 text-foreground-light">
              <Realtime size={22} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-y-2">
              <h3 className="text-base text-foreground">
                Realtime is not available for High Availability projects
              </h3>
              <p className="text-sm text-foreground-light">
                Realtime is not currently available for projects with High Availability. Reach out
                to our support team if you're interested in using this feature with your High
                Availability project.
              </p>
            </div>
            <Button asChild type="default" icon={<ExternalLink />}>
              <a href="https://supabase.com/support" target="_blank" rel="noopener noreferrer">
                Contact support
              </a>
            </Button>
          </div>
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
