import { useParams } from 'common'
import { AnalyticsBucket as AnalyticsBucketIcon, VectorBucket as VectorBucketIcon } from 'icons'
import { EmptyStatePresentational } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { BUCKET_TYPES } from './Storage.constants'
import { AlphaNotice } from '@/components/ui/AlphaNotice'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const BucketsUpgradePlan = ({ type }: { type: 'analytics' | 'vector' }) => {
  const { ref: projectRef } = useParams()
  const { isLoading: isLoadingStorageConfig } = useProjectStorageConfigQuery({ projectRef })
  const { data: organization, isLoading: isLoadingOrganization } = useSelectedOrganizationQuery()
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()

  const isLoading =
    isLoadingStorageConfig || isLoadingOrganization || isLoadingProject || !organization || !project

  if (isLoading) {
    return (
      <PageContainer>
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-8">
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  const isFreePlan = organization.plan?.id === 'free'
  const isNanoCompute = project.infra_compute_size === 'nano'
  const requiresComputeUpgrade = !isFreePlan && isNanoCompute

  return (
    <PageContainer>
      <PageSection>
        <PageSectionContent className="flex flex-col gap-y-8">
          <AlphaNotice
            entity={type === 'analytics' ? 'Analytics buckets' : 'Vector buckets'}
            feedbackUrl={
              type === 'analytics'
                ? 'https://github.com/orgs/supabase/discussions/40116'
                : 'https://github.com/orgs/supabase/discussions/40815'
            }
          />
          <EmptyStatePresentational
            icon={type === 'analytics' ? AnalyticsBucketIcon : VectorBucketIcon}
            title={
              type === 'analytics'
                ? BUCKET_TYPES.analytics.valueProp
                : BUCKET_TYPES.vectors.valueProp
            }
            description={
              requiresComputeUpgrade
                ? `Upgrade your project's compute size to Micro or larger to use ${type} buckets`
                : `Upgrade to Pro to use ${type} buckets for your project`
            }
          >
            <UpgradePlanButton
              source={`${type}Buckets`}
              featureProposition={`use ${type} buckets`}
              addon={requiresComputeUpgrade ? 'computeSize' : undefined}
            />
          </EmptyStatePresentational>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
