import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { ProductMenu } from 'components/ui/ProductMenu'
import { generateReplicationMenu } from './ReplicationMenu.utils'
import { useParams } from 'common'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'

export interface ReplicationLayoutProps {
  title: string
}

const ReplicationLayout = ({ title, children }: PropsWithChildren<ReplicationLayoutProps>) => {
  const project = useSelectedProject()
  const { ref } = useParams()
  const { data } = useReplicationSourcesQuery({
    projectRef: ref,
  })
  let showProductMenu = data?.sources.length !== 0

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      title={title}
      product="Replication"
      productMenu={
        showProductMenu ? (
          <ProductMenu page={page} menu={generateReplicationMenu(project!)} />
        ) : null
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(ReplicationLayout)
