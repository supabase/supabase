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
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert, Button } from 'ui'
import { BILLING_BREAKDOWN_METRICS } from './BillingBreakdown.constants'
import BillingMetric from './BillingMetric'
import UpcomingInvoice from './UpcomingInvoice'
import { useIsFeatureEnabled } from 'hooks'

const BillingBreakdown = () => {
  const snap = useOrgSettingsPageStateSnapshot()
  const { slug: orgSlug } = useParams()
  const {
    data: usage,
    error: usageError,
    isLoading: isLoadingUsage,
    isError: isErrorUsage,
    isSuccess: isSuccessUsage,
  } = useOrgUsageQuery({ orgSlug })
  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isLoadingSubscription,
    isError: isErrorSubscription,
    isSuccess: isSuccessSubscription,
  } = useOrgSubscriptionQuery({ orgSlug })

  const invoiceFeatureEnabled = useIsFeatureEnabled('billing:invoices')

  const currentPlan = subscription?.plan
  const isUsageBillingEnabled = subscription?.usage_billing_enabled
  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()

  const hasExceededAnyLimits =
    !isUsageBillingEnabled &&
    Boolean(
      usage?.usages.find(
        (metric) =>
          !metric.unlimited && metric.capped && metric.usage > (metric?.pricing_free_units ?? 0)
      )
    )

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

        {isSuccessSubscription && (
          <>
            <p className="text-sm">Included usage summary</p>
            {isUsageBillingEnabled ? (
              <p className="text-sm text-foreground-light">
                Your plan includes a limited amount of usage. If the usage on your organization
                exceeds these quotas, your subscription will be charged for the overages. It may
                take up to 24 hours for usage stats to update.
              </p>
            ) : (
              <p className="text-sm text-foreground-light">
                Your plan includes a limited amount of usage. If the usage on your organization
                exceeds these quotas, you may experience restrictions, as you are currently not
                billed for overages. It may take up to 24 hours for usage stats to update.
              </p>
            )}

            {hasExceededAnyLimits && (
              <Alert
                withIcon
                variant="danger"
                title="Your organization's usage has exceeded its included quota"
                actions={[
                  <Button
                    key="upgrade-button"
                    type="default"
                    className="ml-8"
                    onClick={() =>
                      snap.setPanelKey(
                        currentPlan?.id === 'free' ? 'subscriptionPlan' : 'costControl'
                      )
                    }
                  >
                    {currentPlan?.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
                  </Button>,
                ]}
              >
                Your projects can become unresponsive or enter read only mode.{' '}
                {currentPlan?.id === 'free'
                  ? 'Please upgrade to the Pro plan to ensure that your projects remain available.'
                  : 'Please disable spend cap to ensure that your projects remain available.'}
              </Alert>
            )}

            {isLoadingUsage && (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            )}

            {isErrorUsage && (
              <AlertError subject="Failed to retrieve usage data" error={usageError} />
            )}

            {isSuccessUsage && (
              <div className="grid grid-cols-12">
                {BILLING_BREAKDOWN_METRICS.map((metric, i) => {
                  return (
                    <BillingMetric
                      idx={i}
                      key={metric.key}
                      slug={orgSlug}
                      metric={metric}
                      usage={usage}
                      subscription={subscription}
                    />
                  )
                })}
              </div>
            )}

            {invoiceFeatureEnabled && (
              <>
                <p className="!mt-10 text-sm">Upcoming cost for next invoice</p>
                <p className="text-sm text-foreground-light">
                  The following table shows your upcoming costs. Depending on your usage, the final
                  amount may vary. Next invoice on{' '}
                  <span className="text-foreground-light whitespace-nowrap">
                    {billingCycleEnd.format('MMM DD, YYYY')}
                  </span>
                  .
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
