import { VectorBucket } from 'icons'
import { AWS_REGIONS } from 'shared-data'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { AVAILABLE_REPLICA_REGIONS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { AlphaNotice } from '@/components/ui/AlphaNotice'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const VECTOR_BUCKETS_AVAILABLE_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-central-1',
  'ap-southeast-2',
]

const getRegionNameFromCode = (code: string) =>
  Object.values(AWS_REGIONS).find((x) => x.code === code)?.displayName

export const RegionLimitation = () => {
  const { data: project } = useSelectedProjectQuery()

  const regionLabel = AVAILABLE_REPLICA_REGIONS.find((region) =>
    project?.region?.includes(region.region)
  )

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
              <>
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
                      {VECTOR_BUCKETS_AVAILABLE_REGIONS.map((x) => (
                        <li key={x}>
                          <span>{getRegionNameFromCode(x)}</span>
                          <span className="text-foreground-light ml-2">{x}</span>
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
                . We're actively looking to expand that soon.
              </>
            }
          />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
