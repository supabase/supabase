import { PricingInformation } from 'shared-data'
import { Button } from 'ui'

import { PlanColumn } from './PlanColumn'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrack } from '@/lib/telemetry/track'

export interface EnterpriseCardProps {
  plan: PricingInformation
  isCurrentPlan: boolean
  liftedSide?: 'left' | 'right'
  isPlanUpdateRedesignEnabled: boolean
  origin?: string
}

export const EnterpriseCard = ({
  plan,
  isCurrentPlan,
  liftedSide,
  isPlanUpdateRedesignEnabled,
  origin,
}: EnterpriseCardProps) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const track = useTrack()

  const handleContactClick = () =>
    track('studio_pricing_plan_cta_clicked', {
      selectedPlan: 'Enterprise',
      currentPlan: selectedOrganization?.plan.name,
      planUpdateRedesignEnabled: isPlanUpdateRedesignEnabled,
      origin,
    })

  return (
    <PlanColumn
      plan={plan}
      isCurrentPlan={isCurrentPlan}
      liftedSide={liftedSide}
      price={
        <p className="text-foreground text-5xl font-mono" translate="no">
          <span className="text-4xl">{plan.priceMonthly}</span>
        </p>
      }
      cta={
        <Button block size="large" asChild onClick={handleContactClick}>
          <a href={plan.href} target="_blank" rel="noreferrer">
            {plan.cta}
          </a>
        </Button>
      }
    />
  )
}
