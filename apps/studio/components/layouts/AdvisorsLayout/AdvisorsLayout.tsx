import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useIsAdvisorRulesEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateAdvisorsMenu } from './AdvisorsMenu.utils'
import { FeaturePreviewSidebarPanel } from 'components/ui/FeaturePreviewSidebarPanel'
import { Badge, Button } from 'ui'
import { useParams } from 'common'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const { data: project } = useSelectedProjectQuery()
  const advisorRules = useIsAdvisorRulesEnabled()
  const { ref } = useParams()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <ProjectLayout
      isLoading={false}
      product="Advisors"
      productMenu={
        <>
          <ProductMenu page={page} menu={generateAdvisorsMenu(project, { advisorRules })} />
          <div className="px-4 py-5 pt-0">
            <FeaturePreviewSidebarPanel
              title="Looking for Query Performance?"
              description="Query Performance is now available via our Reports section"
              illustration={<Badge variant="brand">New!</Badge>}
              actions={
                <Button
                  size="tiny"
                  type="default"
                  onClick={() => router.push(`/project/${ref}/reports/query-performance`)}
                >
                  Go to Reports
                </Button>
              }
            />
          </div>
        </>
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
