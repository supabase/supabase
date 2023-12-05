import dayjs from 'dayjs'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import UpcomingInvoice from './UpcomingInvoice'
import { useIsFeatureEnabled } from 'hooks'
import Link from 'next/link'

const BillingBreakdown = () => {
  const { slug: orgSlug } = useParams()

  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isLoadingSubscription,
    isError: isErrorSubscription,
  } = useOrgSubscriptionQuery({ orgSlug })

  const invoiceFeatureEnabled = useIsFeatureEnabled('billing:invoices')

  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()

  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        <div className="sticky space-y-2 top-12">
          <p className="text-base m-0">Billing breakdown</p>
          <p className="text-sm text-foreground-light m-0">
            Current billing cycle: {billingCycleStart.format('MMM DD')} -{' '}
            {billingCycleEnd.format('MMM DD')}
          </p>
        </div>
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent>
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
            <p className="text-sm">Upcoming cost for next invoice</p>
            <p className="text-sm text-foreground-light">
              The following table shows your upcoming costs excluding credits. Depending on your
              usage, the final amount may vary. Next invoice on{' '}
              <span className="text-foreground-light whitespace-nowrap">
                {billingCycleEnd.format('MMM DD, YYYY')}
              </span>
              . See{' '}
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
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default BillingBreakdown
