import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateReplicationMenu } from './ReplicationMenu.utils'

export interface ReplicationLayoutProps {
  title: string
}

const ReplicationLayout = ({ title, children }: PropsWithChildren<ReplicationLayoutProps>) => {
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      title={title}
      product="Replication"
      productMenu={<ProductMenu page={page} menu={generateReplicationMenu(project!)} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(ReplicationLayout)
