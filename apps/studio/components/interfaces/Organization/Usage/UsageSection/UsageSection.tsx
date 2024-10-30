import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { DataPoint } from 'data/analytics/constants'
import type { OrgSubscription } from 'data/subscriptions/types'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import SectionHeader from '../SectionHeader'
import { CategoryMetaKey, USAGE_CATEGORIES } from '../Usage.constants'
import AttributeUsage from './AttributeUsage'
import DiskUsage from './DiskUsage'

export interface ChartMeta {
  [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
}

export interface UsageSectionProps {
  orgSlug: string
  projectRef?: string
  categoryKey: CategoryMetaKey
  subscription?: OrgSubscription
  chartMeta: ChartMeta
  currentBillingCycleSelected: boolean
}

const UsageSection = ({
  orgSlug,
  projectRef,
  categoryKey,
  chartMeta,
  subscription,
  currentBillingCycleSelected,
}: UsageSectionProps) => {
  const {
    data: usage,
    error: usageError,
    isLoading: isLoadingUsage,
    isError: isErrorUsage,
    isSuccess: isSuccessUsage,
  } = useOrgUsageQuery({ orgSlug })

  const categoryMeta = USAGE_CATEGORIES(subscription).find(
    (category) => category.key === categoryKey
  )
  if (!categoryMeta) return null

  return (
    <>
      <ScaffoldContainer>
        <SectionHeader title={categoryMeta.name} description={categoryMeta.description} />
      </ScaffoldContainer>

      <ScaffoldDivider />

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
