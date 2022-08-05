import Link from 'next/link'
import { FC } from 'react'
import { Alert, Button } from '@supabase/ui'

import { useStore, useProjectUsageStatus } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { getResourcesApproachingLimits, getResourcesExceededLimits } from './OveragesBanner.utils'

interface Props {
  tier: string
  minimal?: boolean
}

const OveragesBanner: FC<Props> = ({ tier, minimal }) => {
  const { ui } = useStore()
  const ref = ui.selectedProject?.ref

  // [Joshen TODO] After API is ready, to do up proper logic here
  // const { usageStatus } = useProjectUsageStatus(ui.selectedProject?.ref)
  const usage: any = {
    dbSize: { value: 10773283, limit: 524288000 },
    dbEgress: { value: 400000000, limit: 524288000 },
    storageSize: { value: 624288000, limit: 524288000 },
    storageEgress: { value: 0, limit: 524288000 },
  }

  const resourcesApproachingLimits = getResourcesApproachingLimits(usage)
  const isApproachingUsageLimits = resourcesApproachingLimits.length > 0

  const resourcesExceededLimits = getResourcesExceededLimits(usage)
  const isOverUsageLimits = resourcesExceededLimits.length > 0

  if (
    (!isApproachingUsageLimits && !isOverUsageLimits) ||
    tier === PRICING_TIER_PRODUCT_IDS.ENTERPRISE
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
    tier === PRICING_TIER_PRODUCT_IDS.FREE ? (
      <>
        You can check your project's usage details or upgrade to the pro tier{' '}
        <Link href={`/project/${ref}/settings/billing`}>
          <a>
            <span className="cursor-pointer underline">here</span>
          </a>
        </Link>{' '}
        to support the growth of your project.
      </>
    ) : tier === PRICING_TIER_PRODUCT_IDS.PRO ? (
      <>
        You can check your project's usage details or consider disabling spend cap{' '}
        <Link href={`/project/${ref}/settings/billing`}>
          <a>
            <span className="cursor-pointer underline">here</span>
          </a>
        </Link>{' '}
        to support the growth of your project.
      </>
    ) : tier === PRICING_TIER_PRODUCT_IDS.PAYG ? (
      <>
        As you have disabled spend cap, additional resources will be charged on a per-usage basis.
        You can check your project's usage details{' '}
        <Link href={`/project/${ref}/settings/billing`}>
          <a>
            <span className="cursor-pointer underline">here</span>
          </a>
        </Link>{' '}
        for more information.
      </>
    ) : (
      ''
    )

  const description =
    tier === PRICING_TIER_PRODUCT_IDS.FREE
      ? 'Upgrade to the pro tier to support the growth of your project.'
      : tier === PRICING_TIER_PRODUCT_IDS.PRO
      ? ''
      : tier === PRICING_TIER_PRODUCT_IDS.PAYG
      ? ''
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
            <div className="h-full flex items-center">
              <Button type="default">Explore usage details</Button>
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
