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
          <p className="text-foreground text-base m-0">Billing Breakdown</p>
          <div className="py-2">
            <SparkBar
              type="horizontal"
              value={daysWithinCycle - daysToCycleEnd}
              max={daysWithinCycle}
              barClass="bg-foreground"
              labelBottom={`${billingCycleStart.format('MMMM DD')} - ${billingCycleEnd.format('MMMM DD')}`}
              bgClass="bg-surface-300"
              labelBottomClass="!text-foreground-light p-1 m-0"
              labelTop={`${daysToCycleEnd} days left`}
              labelTopClass="p-1 m-0"
            />
          </div>
          <p className="text-sm text-foreground-light mt-4">
            It may take up to an hour for addon changes or new projects to show up.
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
        {!canReadSubscriptions ? (
          <NoPermission resourceText="view this organization's billing breakdown" />
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

            {invoiceFeatureEnabled && (
              <>
                <p className="prose text-sm">
                  The table shows your upcoming invoice, excluding credits. This invoice will
                  continue updating until the end of your billing period on{' '}
                  {billingCycleEnd.format('MMMM DD')}. See{' '}
                  <Link href={`/org/${orgSlug}/usage`}>usage page</Link> for a more detailed usage
                  breakdown.
                </p>

                <UpcomingInvoice slug={orgSlug} />
              </>
            )}
          </>
        )}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingBreakdown
