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

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-foreground text-base m-0">Billing Breakdown</p>
          <p className="text-sm text-foreground-light m-0">
            Current billing cycle: {billingCycleStart.format('MMM DD')} -{' '}
            {billingCycleEnd.format('MMM DD')}
          </p>
          <p className="text-sm text-foreground-light m-0">
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
                <p className="text-sm text-foreground-light">
                  The table shows your upcoming invoice, excluding credits. This invoice will
                  continue updating until the end of your billing period on{' '}
                  {billingCycleEnd.format('MMMM DD')}. See{' '}
                  <Link
                    className="text-green-900 transition hover:text-green-1000"
                    href={`/org/${orgSlug}/usage`}
                  >
                    usage page
                  </Link>{' '}
                  for a more detailed usage breakdown.
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
