import { type PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { withAuth } from '@/hooks/misc/withAuth'

interface SitesLayoutProps {
  title?: string
}

const SitesLayout = ({ children }: PropsWithChildren<SitesLayoutProps>) => {
  return (
    <ProjectLayout product="Sites" isBlocking={false}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SitesLayout)
