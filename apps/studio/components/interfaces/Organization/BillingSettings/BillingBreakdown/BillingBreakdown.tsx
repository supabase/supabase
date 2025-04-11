import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import Link from 'next/link'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import UpcomingInvoice from './UpcomingInvoice'
import SparkBar from 'components/ui/SparkBar'

const BillingBreakdown = () => {
  const { slug: orgSlug } = useParams()

  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isLoadingSubscription,
    isError: isErrorSubscription,
  } = useOrgSubscriptionQuery({ orgSlug }, { enabled: canReadSubscriptions })

  const invoiceFeatureEnabled = useIsFeatureEnabled('billing:invoices')

  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()

  const daysToCycleEnd = billingCycleEnd.diff(dayjs(), 'days')
  const daysWithinCycle = billingCycleEnd.diff(billingCycleStart, 'days')

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12 pr-3">
          <p className="text-foreground text-base m-0">Upcoming Invoice</p>
          <div className="py-2">
            <SparkBar
              type="horizontal"
              value={daysWithinCycle - daysToCycleEnd}
              max={daysWithinCycle}
              barClass="bg-foreground"
              labelBottom={`${billingCycleStart.format('MMMM DD')} - ${billingCycleEnd.format('MMMM DD')}`}
              bgClass="bg-surface-300"
              labelBottomClass="!text-foreground-light p-1 m-0"
              labelTop={
                subscription
                  ? `${daysToCycleEnd} ${daysToCycleEnd === 1 ? 'day' : 'days'} left`
                  : ''
              }
              labelTopClass="p-1 m-0"
            />
          </div>
          <p className="prose text-sm">
            Your upcoming invoice (excluding credits) will continue to update until the end of your
            billing cycle on {billingCycleEnd.format('MMMM DD')}. For a more detailed breakdown,
            visit the <Link href={`/org/${orgSlug}/usage`}>usage page.</Link>
          </p>
          <br />
          <p className="text-sm text-foreground-light mt-4">
            Add-on changes or new projects may take up to an hour to appear.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadSubscriptions ? (
          <NoPermission resourceText="view this organization's upcoming invoice" />
        ) : (
          <>
            {isLoadingSubscription && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {isErrorSubscription && (
              <AlertError subject="Failed to retrieve subscription" error={subscriptionError} />
            )}

            {invoiceFeatureEnabled && <UpcomingInvoice slug={orgSlug} />}
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingBreakdown
