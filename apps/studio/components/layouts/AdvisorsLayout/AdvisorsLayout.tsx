import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayout'
import { ProjectLayout } from '../ProjectLayout'
import { AdvisorsSidebarMenu } from './AdvisorsSidebarMenu'
import { useIsNavigationV2Enabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { withAuth } from '@/hooks/misc/withAuth'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const isNavigationV2 = useIsNavigationV2Enabled()

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 isLoading={false} product="Advisors">
        {children}
      </ProjectLayoutV2>
    )
  }

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
