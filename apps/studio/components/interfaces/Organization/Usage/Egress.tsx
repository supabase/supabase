import { ArrowRightIcon } from 'lucide-react'
import { Button } from 'ui'

import { EgressDebugButton } from './EgressDebugButton'
import { dailyUsageToDataPoints } from './Usage.utils'
import UsageSection from './UsageSection/UsageSection'
import { ScaffoldContainer } from '@/components/layouts/Scaffold'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DataPoint } from '@/data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from '@/data/analytics/org-daily-stats-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

export interface EgressProps {
  orgSlug: string
  projectRef: string | null
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
  startDate: string | undefined
  endDate: string | undefined
}

const Egress = ({
  orgSlug,
  projectRef,
  subscription,
  currentBillingCycleSelected,
  orgDailyStats,
  isLoadingOrgDailyStats,
  startDate,
  endDate,
}: EgressProps) => {
  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.EGRESS]: {
      data: dailyUsageToDataPoints(orgDailyStats, (metric) => metric === PricingMetric.EGRESS),
      margin: 16,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.CACHED_EGRESS]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.CACHED_EGRESS
      ),
      margin: 16,
      isLoading: isLoadingOrgDailyStats,
    },
  }

  return (
    <div className="flex flex-col gap-3">
      <ScaffoldContainer>
        <div className="flex items-center justify-end gap-2 pt-6">
          {projectRef !== null ? (
            <Button asChild iconRight={<ArrowRightIcon />}>
              <a href={`/project/${projectRef}/observability/egress`}>
                Investigate in Observability
              </a>
            </Button>
          ) : (
            <ButtonTooltip
              disabled
              iconRight={<ArrowRightIcon />}
              tooltip={{
                content: { side: 'bottom', text: 'Select a single project to investigate' },
              }}
            >
              Investigate in Observability
            </ButtonTooltip>
          )}
          <EgressDebugButton projectRef={projectRef} orgSlug={orgSlug} />
        </div>
      </ScaffoldContainer>
      <UsageSection
        orgSlug={orgSlug}
        projectRef={projectRef}
        categoryKey="egress"
        chartMeta={chartMeta}
        subscription={subscription}
        currentBillingCycleSelected={currentBillingCycleSelected}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  )
}

export default Egress
