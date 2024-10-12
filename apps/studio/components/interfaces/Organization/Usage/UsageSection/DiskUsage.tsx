import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import type { OrgSubscription } from 'data/subscriptions/types'
import SectionContent from '../SectionContent'
import { CategoryAttribute } from '../Usage.constants'
import { useOrgProjectsQuery } from 'data/projects/org-projects'

export interface DiskUsageProps {
  slug: string
  projectRef?: string
  attribute: CategoryAttribute
  subscription?: OrgSubscription

  currentBillingCycleSelected: boolean
}

const DiskUsage = ({
  slug,
  projectRef,
  attribute,
  subscription,

  currentBillingCycleSelected,
}: DiskUsageProps) => {
  const {
    data: diskUsage,
    isError,
    isLoading,
    isSuccess,
  } = useOrgProjectsQuery(
    {
      orgSlug: slug,
    },
    {
      enabled: currentBillingCycleSelected,
    }
  )

  console.log(diskUsage)

  return (
    <div id={attribute.anchor} className="scroll-my-12">
      <SectionContent section={attribute}>
        {isLoading && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {/* TODO error prop */}
        {isError && <AlertError subject="Failed to retrieve usage data" error={null} />}

        {isSuccess && (
          <>
            {currentBillingCycleSelected ? (
              <div>test</div>
            ) : (
              <div>select current billing cycle please</div>
            )}
          </>
        )}
      </SectionContent>
    </div>
  )
}

export default DiskUsage
