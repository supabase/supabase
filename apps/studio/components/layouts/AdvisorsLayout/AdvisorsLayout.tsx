import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'
import { AdvisorsSidebarMenu } from './AdvisorsSidebarMenu'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      isLoading={false}
      product="Advisors"
      productMenu={<AdvisorsSidebarMenu page={page} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
