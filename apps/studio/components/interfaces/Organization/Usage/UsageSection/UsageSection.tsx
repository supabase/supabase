import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { DataPoint } from 'data/analytics/constants'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import SectionHeader from '../SectionHeader'
import { CategoryMetaKey, USAGE_CATEGORIES } from '../Usage.constants'
import AttributeUsage from './AttributeUsage'
import DatabaseSizeUsage from './DatabaseSizeUsage'
import { DiskUsage } from './DiskUsage'

export interface ChartMeta {
  [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
}

export interface UsageSectionProps {
  orgSlug: string
  projectRef?: string | null
  categoryKey: CategoryMetaKey
  subscription?: OrgSubscription
  chartMeta: ChartMeta
  currentBillingCycleSelected: boolean
  startDate?: string
  endDate?: string
}

const UsageSection = ({
  orgSlug,
  projectRef,
  categoryKey,
  chartMeta,
  subscription,
  currentBillingCycleSelected,
  startDate,
  endDate,
}: UsageSectionProps) => {
  const {
    data: usage,
    error: usageError,
    isPending: isLoadingUsage,
    isError: isErrorUsage,
    isSuccess: isSuccessUsage,
  } = useOrgUsageQuery({
    orgSlug,
    projectRef,
    start: !currentBillingCycleSelected && startDate ? new Date(startDate) : undefined,
    end: !currentBillingCycleSelected && endDate ? new Date(endDate) : undefined,
  })

  const categoryMeta = USAGE_CATEGORIES(subscription).find(
    (category) => category.key === categoryKey
  )
  if (!categoryMeta) return null

  return (
    <>
      <ScaffoldContainer>
        <SectionHeader
          title={categoryMeta.name}
          description={categoryMeta.description}
          className="pb-0"
        />
      </ScaffoldContainer>

      {categoryMeta.attributes.map((attribute) =>
        attribute.key === 'diskSize' ? (
          <DiskUsage
            key={attribute.name}
            slug={orgSlug}
            projectRef={projectRef}
            attribute={attribute}
            subscription={subscription}
            currentBillingCycleSelected={currentBillingCycleSelected}
            usage={usage}
          />
        ) : attribute.key === PricingMetric.DATABASE_SIZE ? (
          <DatabaseSizeUsage
            key={attribute.name}
            slug={orgSlug}
            projectRef={projectRef}
            attribute={attribute}
            subscription={subscription}
            currentBillingCycleSelected={currentBillingCycleSelected}
            usage={usage}
          />
        ) : (
          <AttributeUsage
            key={attribute.name}
            slug={orgSlug}
            projectRef={projectRef}
            attribute={attribute}
            usage={usage}
            usageMeta={usage?.usages.find((x) => x.metric === attribute.key)}
            chartMeta={chartMeta}
            subscription={subscription}
            error={usageError}
            isLoading={isLoadingUsage}
            isError={isErrorUsage}
            isSuccess={isSuccessUsage}
            currentBillingCycleSelected={currentBillingCycleSelected}
          />
        )
      )}
    </>
  )
}

export default UsageSection
