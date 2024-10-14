import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

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
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(ReplicationLayout)
