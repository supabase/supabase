import Link from 'next/link'
import { FC } from 'react'
import { Alert, Button } from 'ui'

import { useStore, useProjectUsage } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { getResourcesApproachingLimits, getResourcesExceededLimits } from './OveragesBanner.utils'

interface Props {
  tier: string
  minimal?: boolean
}

// Banner will not be shown for PAYG or Enterprise projects

const OveragesBanner: FC<Props> = ({ tier, minimal }) => {
  const { ui } = useStore()
  const ref = ui.selectedProject?.ref

  const { usage, error, isLoading } = useProjectUsage(ref as string)

  const resourcesApproachingLimits = getResourcesApproachingLimits(usage)
  const isApproachingUsageLimits = resourcesApproachingLimits.length > 0

  const resourcesExceededLimits = getResourcesExceededLimits(usage)
  const isOverUsageLimits = resourcesExceededLimits.length > 0

  if (
    isLoading ||
    error ||
    (!isApproachingUsageLimits && !isOverUsageLimits) ||
    tier === PRICING_TIER_PRODUCT_IDS.PAYG ||
    tier === PRICING_TIER_PRODUCT_IDS.ENTERPRISE ||
    tier === PRICING_TIER_PRODUCT_IDS.TEAM
  ) {
    return <></>
  }

  const tierName =
    tier === PRICING_TIER_PRODUCT_IDS.FREE
      ? 'free'
      : tier === PRICING_TIER_PRODUCT_IDS.PRO
      ? 'pro'
      : tier === PRICING_TIER_PRODUCT_IDS.PAYG
      ? 'pro'
      : ''

  const minimalDescription =
    tier === PRICING_TIER_PRODUCT_IDS.FREE
      ? "You can check your project's usage details or upgrade to the pro tier to support the growth of your project."
      : tier === PRICING_TIER_PRODUCT_IDS.PRO
      ? "You can check your project's usage details or consider disabling spend cap to support the growth of your project."
      : tier === PRICING_TIER_PRODUCT_IDS.PAYG
      ? "As you have disabled spend cap, additional resources will be charged on a per-usage basis. You can check your project's usage details for more information."
      : ''

  const description =
    tier === PRICING_TIER_PRODUCT_IDS.FREE
      ? 'Upgrade to the pro tier to support the growth of your project.'
      : tier === PRICING_TIER_PRODUCT_IDS.PRO
      ? 'Consider disabling spend cap to support the growth of your project'
      : tier === PRICING_TIER_PRODUCT_IDS.PAYG
      ? "As you have disabled spend cap, additional resources will be charged on a per-usage basis. You can check your project's usage details for more information."
      : ''

  return (
    <div className="max-w-7xl">
      <Alert
        withIcon
        variant={
          tier === PRICING_TIER_PRODUCT_IDS.PAYG
            ? 'neutral'
            : isOverUsageLimits
            ? 'danger'
            : isApproachingUsageLimits
            ? 'warning'
            : 'neutral'
        }
        title={
          isOverUsageLimits
            ? `Your project has exceeded it's usage limits for the ${tierName} tier.`
            : isApproachingUsageLimits
            ? `Your project is approaching it's usage limits for the ${tierName} tier.`
            : ''
        }
        actions={
          minimal ? (
            <div className="flex h-full items-center">
              <Link href={`/project/${ref}/settings/billing/subscription`}>
                <a>
                  <Button type="default">Explore usage details</Button>
                </a>
              </Link>
            </div>
          ) : (
            <></>
          )
        }
      >
        {minimal ? minimalDescription : description}
      </Alert>
    </div>
  )
}

export default OveragesBanner
