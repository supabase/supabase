import { AnalyticsBucket as AnalyticsBucketIcon, VectorBucket as VectorBucketIcon } from 'icons'
import { EmptyStatePresentational } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { BUCKET_TYPES } from './Storage.constants'
import { AlphaNotice } from '@/components/ui/AlphaNotice'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const BucketsUpgradePlan = ({ type }: { type: 'analytics' | 'vector' }) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  const isFreePlan = organization?.plan?.id === 'free'
  const isNanoCompute = project?.infra_compute_size === 'nano'
  // On a paid plan with the smallest compute, the feature is gated by compute
  // size rather than plan tier, so we surface the compute upgrade path instead.
  const requiresComputeUpgrade = !!organization && !isFreePlan && isNanoCompute

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
            <div className="flex items-center gap-x-2">
              <UpgradePlanButton
                source={`${type}Buckets`}
                featureProposition={`use ${type} buckets`}
                addon={requiresComputeUpgrade ? 'computeSize' : undefined}
              />
            </div>
          </EmptyStatePresentational>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
