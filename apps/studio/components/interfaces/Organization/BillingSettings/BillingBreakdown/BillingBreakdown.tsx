import { useParams } from 'common'
import dayjs from 'dayjs'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { UpcomingInvoice } from './UpcomingInvoice'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
import { SparkBar } from '@/components/ui/SparkBar'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

const BillingBreakdown = () => {
  const { slug: orgSlug } = useParams()

  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const { isSuccess: isPermissionsLoaded, can: canReadSubscriptions } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.ORGANIZATION.BILLING_READ
  )

  const {
    data: subscription,
    error: subscriptionError,
    isPending: isLoadingSubscription,
    isError: isErrorSubscription,
  } = useOrgSubscriptionQuery({ orgSlug }, { enabled: canReadSubscriptions })

  const invoiceFeatureEnabled = useIsFeatureEnabled('billing:invoices')

  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()

  const daysToCycleEnd = billingCycleEnd.diff(dayjs(), 'days')
  const daysWithinCycle = billingCycleEnd.diff(billingCycleStart, 'days')

  return (
    <PageSection orientation="horizontal">
      <PageSectionMeta>
        <PageSectionSummary className="gap-4">
          <PageSectionTitle>Upcoming Invoice</PageSectionTitle>
          {selectedOrganization?.managed_by !== MANAGED_BY.AWS_MARKETPLACE && (
            <SparkBar
              type="horizontal"
              value={daysWithinCycle - daysToCycleEnd}
              max={daysWithinCycle}
              barClass="bg-foreground"
              labelBottom={`${billingCycleStart.format('MMMM DD')} - ${billingCycleEnd.format('MMMM DD')}`}
              bgClass="bg-surface-300"
              labelBottomClass="text-foreground-light! p-1 m-0"
              labelTop={
                subscription
                  ? `${daysToCycleEnd} ${daysToCycleEnd === 1 ? 'day' : 'days'} left`
                  : ''
              }
              labelTopClass="p-1 m-0"
            />
          )}
          <PageSectionDescription className="space-y-2">
            {selectedOrganization?.managed_by === MANAGED_BY.AWS_MARKETPLACE ? (
              <>
                <p>
                  AWS Marketplace sends two invoices each month: one for your fixed subscription
                  fee, billed on the day you subscribed, and one for your usage charges from the
                  previous month, billed by the 3rd.
                </p>
                <p>
                  For a more detailed breakdown, visit the{' '}
                  <InlineLink href={`/org/${orgSlug}/usage`}>usage page.</InlineLink>
                </p>
              </>
            ) : (
              <p>
                Your upcoming invoice will continue to update until the end of your billing cycle on{' '}
                {billingCycleEnd.format('MMMM DD')}. For a more detailed breakdown, visit the{' '}
                <InlineLink href={`/org/${orgSlug}/usage`}>usage page.</InlineLink>
              </p>
            )}
            <p>Add-on changes or new projects may take up to an hour to appear.</p>
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="flex flex-col gap-6">
        {isPermissionsLoaded && !canReadSubscriptions ? (
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
      </PageSectionContent>
    </PageSection>
  )
}

export default BillingBreakdown
