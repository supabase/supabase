import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { Admonition } from 'ui-patterns/Admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { DeployWorkerDialog } from '@/components/interfaces/Workers/DeployWorkerDialog'
import {
  isWorkersForbidden,
  isWorkersUnavailable,
} from '@/components/interfaces/Workers/Workers.utils'
import { WorkersEmptyState } from '@/components/interfaces/Workers/WorkersEmptyState'
import { WorkersList } from '@/components/interfaces/Workers/WorkersList'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { WorkersLayout } from '@/components/layouts/WorkersLayout/WorkersLayout'
import { AlertError } from '@/components/ui/AlertError'
import { AlphaNotice } from '@/components/ui/AlphaNotice'
import { NoPermission } from '@/components/ui/NoPermission'
import { workersQueryOptions } from '@/data/workers/workers-query'
import { PRODUCT_NAME } from '@/lib/constants/workers'
import type { NextPageWithLayout } from '@/types'

const WorkersPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [isDeployInstructionsOpen, setIsDeployInstructionsOpen] = useState(false)
  const {
    data: workers,
    error,
    isPending,
    isError,
    isSuccess,
  } = useQuery(workersQueryOptions({ projectRef: ref }))

  const isNotEnrolled = isError && isWorkersUnavailable(error)
  const isMissingPermission = isError && isWorkersForbidden(error)
  const isUnexpectedError = isError && !isNotEnrolled && !isMissingPermission

  return (
    <div className="w-full min-h-full flex flex-col items-stretch">
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{PRODUCT_NAME}</PageHeaderTitle>
            <PageHeaderDescription>
              Run fully managed compute in isolation next to your database
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-8">
            <AlphaNotice
              entity="Workers"
              feedbackUrl="https://github.com/orgs/supabase/discussions"
            />

            {isPending && <GenericSkeletonLoader />}
            {isNotEnrolled && (
              <Admonition
                type="default"
                title={`${PRODUCT_NAME} is not enabled for this project`}
                description={`${PRODUCT_NAME} is in Private Alpha. Contact support to have this project added to the alpha.`}
              />
            )}
            {isMissingPermission && <NoPermission resourceText="view this project's workers" />}
            {isUnexpectedError && <AlertError error={error} subject="Failed to retrieve workers" />}
            {/* {isSuccess && workers.length === 0 && ( */}
            <WorkersEmptyState onDeploy={() => setIsDeployInstructionsOpen(true)} />
            {/* )} */}
            {isSuccess && workers.length > 0 && ref && (
              <WorkersList
                projectRef={ref}
                workers={workers}
                onDeploy={() => setIsDeployInstructionsOpen(true)}
              />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <DeployWorkerDialog
        open={isDeployInstructionsOpen}
        onOpenChange={setIsDeployInstructionsOpen}
      />
    </div>
  )
}

WorkersPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title={PRODUCT_NAME}>{page}</WorkersLayout>
  </DefaultLayout>
)

export default WorkersPage
