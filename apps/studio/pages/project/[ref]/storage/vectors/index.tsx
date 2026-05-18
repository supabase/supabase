import { useParams } from 'common'
import { VectorBucket } from 'icons'
import { AWS_REGIONS } from 'shared-data'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import {
  EmptyStatePresentational,
  PageContainer,
  PageSection,
  PageSectionContent,
} from 'ui-patterns'

import { AVAILABLE_REPLICA_REGIONS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { BucketsUpgradePlan } from '@/components/interfaces/Storage/BucketsUpgradePlan'
import { VectorsBuckets } from '@/components/interfaces/Storage/VectorBuckets'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import { AlphaNotice } from '@/components/ui/AlphaNotice'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useIsVectorBucketsEnabled } from '@/data/config/project-storage-config-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const AVAILABLE_REGIONS = ['us-east-1', 'us-east-2', 'us-west-2', 'eu-central-1', 'ap-southeast-2']

const getRegionNameFromCode = (code: string) =>
  Object.values(AWS_REGIONS).find((x) => x.code === code)?.displayName

const StorageVectorsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef })

  // [Joshen] We're actively looking into lifting this restriction so can remove once done
  const isAvailableInProjectRegion = AVAILABLE_REGIONS.includes(project?.region ?? '')
  const regionLabel = AVAILABLE_REPLICA_REGIONS.find((region) =>
    project?.region?.includes(region.region)
  )

  if (!isAvailableInProjectRegion) {
    return (
      <PageContainer>
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-8">
            <AlphaNotice
              entity="Vector buckets"
              feedbackUrl="https://github.com/orgs/supabase/discussions/40815"
            />
            <EmptyStatePresentational
              icon={VectorBucket}
              className="[&>div>div>h3]:flex [&>div>div>h3]:items-center [&>div>div>h3]:gap-x-2"
              title="Coming soon to your project's region"
              description={
                <p>
                  Your project is in{' '}
                  <Tooltip>
                    <TooltipTrigger className={InlineLinkClassName}>
                      {regionLabel?.name}
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{regionLabel?.region}</TooltipContent>
                  </Tooltip>
                  , but Vector buckets are only available for{' '}
                  <Tooltip>
                    <TooltipTrigger className={InlineLinkClassName}>certain regions</TooltipTrigger>
                    <TooltipContent side="bottom">
                      <ul>
                        {AVAILABLE_REGIONS.map((x) => (
                          <li key={x}>
                            <span>{getRegionNameFromCode(x)}</span>
                            <span className="text-foreground-light ml-2">{x}</span>
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                  . We're actively looking to expand that soon.
                </p>
              }
            />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  } else if (!isVectorBucketsEnabled) {
    return <BucketsUpgradePlan type="vector" />
  } else {
    return <VectorsBuckets />
  }
}

StorageVectorsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Vectors">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageVectorsPage
