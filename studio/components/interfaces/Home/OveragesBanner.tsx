import Link from 'next/link'
import { FC } from 'react'
import { Alert } from '@supabase/ui'

import { useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

interface Props {
  tier: string
  usageStatus: any
}

const OveragesBanner: FC<Props> = ({ tier, usageStatus }) => {
  const { ui } = useStore()
  const ref = ui.selectedProject?.ref

  // [Joshen TODO] After API is ready, to do up proper logic here
  // Left off here - to do the banner on the billing page etc as well
  const isApproachingUsageLimits = false
  const isOverUsageLimits = false

  if (tier === PRICING_TIER_PRODUCT_IDS.ENTERPRISE) return <></>

  const tierName =
    tier === PRICING_TIER_PRODUCT_IDS.FREE
      ? 'free'
      : tier === PRICING_TIER_PRODUCT_IDS.PRO
      ? 'pro'
      : tier === PRICING_TIER_PRODUCT_IDS.PAYG
      ? 'pro'
      : ''

  // [Joshen TODO] Rors mentioned to keep the language here positive if possible
  const description =
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

  return (
    <div className="max-w-7xl mx-6">
      <Alert
        withIcon
        variant={tier === PRICING_TIER_PRODUCT_IDS.PAYG ? 'neutral' : 'warning'}
        title={`Your project is approaching it's usage limits for the ${tierName} tier.`}
      >
        {description}
      </Alert>
    </div>
  )
}

export default OveragesBanner
