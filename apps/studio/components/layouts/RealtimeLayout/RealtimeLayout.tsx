import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProject, withAuth } from 'hooks'
import { ProjectLayout } from '../'
import { generateRealtimeMenu } from './RealtimeMenu.utils'

export interface RealtimeLayoutProps {
  title?: string
}

const RealtimeLayout = ({ children }: PropsWithChildren<RealtimeLayoutProps>) => {
  const router = useRouter()
  const pathArr = router.pathname.split('/')
  const page = pathArr[pathArr.length - 1]
  const project = useSelectedProject()

  return (
    <ProjectLayout
      title="Realtime"
      product="Realtime"
      productMenu={<ProductMenu page={page} menu={generateRealtimeMenu(project)} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
