import { AlphaNotice } from '@/components/ui/AlphaNotice'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useParams } from 'common'
import { BucketsUpgradePlan } from 'components/interfaces/Storage/BucketsUpgradePlan'
import { VectorsBuckets } from 'components/interfaces/Storage/VectorBuckets'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { StorageBucketsLayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { useIsVectorBucketsEnabled } from 'data/config/project-storage-config-query'
import { VectorBucket } from 'icons'
import { AWS_REGIONS } from 'shared-data'
import type { NextPageWithLayout } from 'types'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import {
  EmptyStatePresentational,
  PageContainer,
  PageSection,
  PageSectionContent,
} from 'ui-patterns'

const AVAILABLE_REGIONS = ['us-east-1', 'us-east-2', 'us-west-2', 'eu-central-1', 'ap-southeast-2']

const getRegionNameFromCode = (code: string) =>
  Object.values(AWS_REGIONS).find((x) => x.code === code)?.displayName

const StorageVectorsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef })

  // [Joshen] We're actively looking into lifting this restriction so can remove once done
  const isAvailableInProjectRegion = AVAILABLE_REGIONS.includes(project?.region ?? '')

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
              title="Coming soon to your project's region"
              description={
                <p>
                  Vector buckets are currently only available for projects created in{' '}
                  <Tooltip>
                    <TooltipTrigger className={InlineLinkClassName}>some regions</TooltipTrigger>
                    <TooltipContent side="bottom">
                      <ul>
                        {AVAILABLE_REGIONS.map((x) => (
                          <li key={x}>
                            <span>{getRegionNameFromCode(x)}</span>
                            <span className="text-foreground-lighter ml-2">{x}</span>
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>{' '}
                  and we're actively looking to expand that soon.
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
    <StorageLayout title="Storage">
      <StorageBucketsLayout>{page}</StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default StorageVectorsPage
