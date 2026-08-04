import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateAdvisorsMenu } from './AdvisorsMenu.utils'
import { AdvisorsSidebarMenu } from './AdvisorsSidebarMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { withAuth } from '@/hooks/misc/withAuth'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateAdvisorsMenu()

  return (
    <ProjectLayout
      isLoading={false}
      product="Advisors"
      productMenu={<AdvisorsSidebarMenu page={page} />}
    >
      <ProductMenuShortcuts menu={menu} />
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
