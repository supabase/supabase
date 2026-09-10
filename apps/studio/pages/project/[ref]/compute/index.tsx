import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
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

import {
  isComputeForbidden,
  isComputeUnavailable,
} from '@/components/interfaces/Compute/Compute.utils'
import { ComputeEmptyState } from '@/components/interfaces/Compute/ComputeEmptyState'
import { ComputeList } from '@/components/interfaces/Compute/ComputeList'
import { DeployComputeInstanceDialog } from '@/components/interfaces/Compute/DeployComputeInstanceDialog'
import { ComputeLayout } from '@/components/layouts/ComputeLayout/ComputeLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { AlertError } from '@/components/ui/AlertError'
import { AlphaNotice } from '@/components/ui/AlphaNotice'
import { NoPermission } from '@/components/ui/NoPermission'
import { computeQueryOptions } from '@/data/compute/compute-query'
import { PRODUCT_NAME } from '@/lib/constants/compute'
import type { NextPageWithLayout } from '@/types'

const ComputePage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [isDeployInstructionsOpen, setIsDeployInstructionsOpen] = useState(false)
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false)
  const {
    data: instances,
    error,
    isPending,
    isError,
    isSuccess,
    refetch,
  } = useQuery(computeQueryOptions({ projectRef: ref }))

  // Separate from the query's own isFetching so background polling doesn't flash the button
  const handleManualRefresh = () => {
    setIsManuallyRefreshing(true)
    refetch().finally(() => setIsManuallyRefreshing(false))
  }

  const isNotEnrolled = isError && isComputeUnavailable(error)
  const isMissingPermission = isError && isComputeForbidden(error)
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
              entity="Compute"
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
            {isMissingPermission && (
              <NoPermission resourceText="view this project's compute instances" />
            )}
            {isUnexpectedError && (
              <AlertError
                error={error}
                subject="Failed to retrieve compute instances"
                additionalActions={
                  <Button
                    variant="default"
                    icon={<RefreshCw />}
                    loading={isManuallyRefreshing}
                    onClick={handleManualRefresh}
                  >
                    Refresh
                  </Button>
                }
              />
            )}
            {isSuccess && instances.length === 0 && (
              <ComputeEmptyState onDeploy={() => setIsDeployInstructionsOpen(true)} />
            )}
            {isSuccess && instances.length > 0 && ref && (
              <ComputeList
                projectRef={ref}
                instances={instances}
                onDeploy={() => setIsDeployInstructionsOpen(true)}
                onRefresh={handleManualRefresh}
                isRefreshing={isManuallyRefreshing}
              />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <DeployComputeInstanceDialog
        open={isDeployInstructionsOpen}
        onOpenChange={setIsDeployInstructionsOpen}
      />
    </div>
  )
}

ComputePage.getLayout = (page) => (
  <DefaultLayout>
    <ComputeLayout title={PRODUCT_NAME}>{page}</ComputeLayout>
  </DefaultLayout>
)

export default ComputePage
