import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { AiSreSidebarMenu } from './AiSreSidebarMenu'
import { withAuth } from '@/hooks/misc/withAuth'

export interface AiSreLayoutProps {
  title?: string
}

const AiSreLayout = ({ children }: PropsWithChildren<AiSreLayoutProps>) => {
  const router = useRouter()
  // `/project/[ref]/ai-sre` has no 4th segment — treat it as the Overview page.
  const page = router.pathname.split('/')[4] || 'overview'

  return (
    <ProjectLayout isLoading={false} product="AI SRE" productMenu={<AiSreSidebarMenu page={page} />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AiSreLayout)
