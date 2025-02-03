import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateAdvisorsMenu } from './AdvisorsMenu.utils'
import { ProjectPageNavigation } from '../AuthLayout/ProjectPageNavigation'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      isLoading={false}
      product="Advisors"
      // productMenu={<ProductMenu page={page} menu={generateAdvisorsMenu(project)} />}
    >
      <ProjectPageNavigation navKey="advisors">{children}</ProjectPageNavigation>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
