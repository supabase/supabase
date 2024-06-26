import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useFlag, useSelectedProject, withAuth } from 'hooks'
import { ProjectLayout } from '../'
import { generateRealtimeMenu } from './RealtimeMenu.utils'

export interface RealtimeLayoutProps {
  title: string
}

const RealtimeLayout = ({ title, children }: PropsWithChildren<RealtimeLayoutProps>) => {
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const authzEnabled = useFlag('authzRealtime')

  return (
    <ProjectLayout
      title={title}
      product="Realtime"
      productMenu={
        <ProductMenu page={page} menu={generateRealtimeMenu(project!, { authzEnabled })} />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
