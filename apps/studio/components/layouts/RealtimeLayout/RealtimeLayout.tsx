import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import ProductMenu from 'components/ui/ProductMenu'
import { useSelectedProject, useStore, withAuth } from 'hooks'
import ProjectLayout from '../'
import { generateRealtimeMenu } from './RealtimeMenu.utils'

export interface RealtimeLayoutProps {
  title?: string
}

const RealtimeLayout = ({ children }: PropsWithChildren<RealtimeLayoutProps>) => {
  const { meta } = useStore()
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      isLoading={false}
      product="Realtime"
      productMenu={<ProductMenu page={page} menu={generateRealtimeMenu(project)} />}
    >
      <main className="h-screen">{children}</main>
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
