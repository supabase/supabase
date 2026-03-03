import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { generateRealtimeMenu } from './RealtimeMenu.utils'

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

  return (
    <ProjectLayout
      title={title}
      product="Realtime"
      productMenu={<ProductMenu page={page} menu={generateRealtimeMenu(project)} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
