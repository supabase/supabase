import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProject, withAuth } from 'hooks'
import { ProjectLayout } from '../'
import { generateAdvisorsMenu } from './AdvisorsMenu.utils'

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
      productMenu={<ProductMenu page={page} menu={generateAdvisorsMenu(project)} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
