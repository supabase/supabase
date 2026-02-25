import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { generateRealtimeMenu } from './RealtimeMenu.utils'

export interface RealtimeLayoutProps {
  title: string
}

export const RealtimeProductMenu = () => {
  const { data: project } = useSelectedProjectQuery()
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  return <ProductMenu page={page} menu={generateRealtimeMenu(project!)} />
}

const RealtimeLayout = ({ title, children }: PropsWithChildren<RealtimeLayoutProps>) => {
  return (
    <ProjectLayout title={title} product="Realtime" productMenu={<RealtimeProductMenu />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
