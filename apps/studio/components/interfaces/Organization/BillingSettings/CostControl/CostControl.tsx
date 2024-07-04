import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Calendar, ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
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
import { useOrganizationBillingSubscriptionCancelSchedule } from 'data/subscriptions/org-subscription-cancel-schedule-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import { BASE_PATH } from 'lib/constants'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import ProjectUpdateDisabledTooltip from '../ProjectUpdateDisabledTooltip'
import SpendCapSidePanel from './SpendCapSidePanel'

export interface CostControlProps {}

const CostControl = ({}: CostControlProps) => {
  const { slug } = useParams()
  const { resolvedTheme } = useTheme()

  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const snap = useOrgSettingsPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const {
    data: subscription,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useOrgSubscriptionQuery({ orgSlug: slug }, { enabled: canReadSubscriptions })

  const currentPlan = subscription?.plan
  const isUsageBillingEnabled = subscription?.usage_billing_enabled ?? false

  const canChangeTier =
    !projectUpdateDisabled && !['team', 'enterprise'].includes(currentPlan?.id || '')

  const { mutate: cancelSubscriptionSchedule, isLoading: cancelSubscriptionScheduleLoading } =
    useOrganizationBillingSubscriptionCancelSchedule()

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <div className="sticky space-y-6 top-12">
            <div className="space-y-2">
              <p className="text-foreground text-base m-0">Cost Control</p>
              <p className="text-sm text-foreground-light m-0">
                Control whether to use beyond your plans included quota
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground-light m-0">More information</p>
              <div>
                <Link
                  href="https://supabase.com/docs/guides/platform/spend-cap"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                    <p className="text-sm m-0">Spend cap</p>
                    <ExternalLink size={16} strokeWidth={1.5} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {!canReadSubscriptions ? (
            <NoPermission resourceText="update this organization's cost control" />
          ) : (
            <>
              {isLoading && (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              )}

              {isError && <AlertError subject="Failed to retrieve subscription" error={error} />}

              {isSuccess && (
                <div className="space-y-6">
                  {['team', 'enterprise'].includes(currentPlan?.id || '') ? (
                    <Alert
                      withIcon
                      variant="info"
                      title={`You will be charged for any additional usage on the ${
                        currentPlan?.name || ''
                      } plan`}
                    >
                      {currentPlan?.name || ''} plan requires you to have spend cap off at all
                      times. Your projects will never become unresponsive. Only when your{' '}
                      <Link
                        href={`/org/${slug}/usage`}
                        className="text-green-900 transition hover:text-green-1000"
                      >
                        included usage
                      </Link>{' '}
                      is exceeded will you be charged for any additional usage.
                    </Alert>
                  ) : (
                    <p className="text-sm text-foreground-light">
                      You can control whether your organization is charged for additional usage
                      beyond the{' '}
                      <Link
                        href={`/org/${slug}/usage`}
                        className="text-green-900 transition hover:text-green-1000"
                      >
                        included quota
                      </Link>{' '}
                      of your subscription plan. If you need to go beyond the included quota, simply
                      switch off your spend cap to pay for additional usage.
                    </p>
                  )}

                  {/** Toggled on spend cap, scheduled change for end-of-cycle */}
                  {subscription?.scheduled_plan_change?.target_plan === 'pro' &&
                    subscription?.scheduled_plan_change?.usage_billing_enabled === false &&
                    subscription?.plan.id === 'pro' && (
                      <Alert_Shadcn_ className="mb-2" title="Scheduled downgrade">
                        <Calendar className="h-4 w-4" />
                        <AlertTitle_Shadcn_>Scheduled change</AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                          <div>
                            Your spend cap will be enabled on{' '}
                            {dayjs(subscription?.scheduled_plan_change?.at).format('MMMM D, YYYY')}.
                            You will not be charged for any over-usage moving on. If you would like
                            to keep the spend cap disabled and scale as you go, you may still cancel
                            the scheduled change.
                          </div>
                          <div>
                            <Button
                              type="default"
                              loading={cancelSubscriptionScheduleLoading}
                              onClick={() => {
                                return cancelSubscriptionSchedule({ slug: slug! })
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    )}

                  <div className="flex space-x-6">
                    <div>
                      <div className="rounded-md bg-surface-200 w-[160px] h-[96px] shadow">
                        <Image
                          alt="Spend Cap"
                          width={160}
                          height={96}
                          src={
                            isUsageBillingEnabled
                              ? `${BASE_PATH}/img/spend-cap-off${
                                  resolvedTheme?.includes('dark') ? '' : '--light'
                                }.png?v=3`
                              : `${BASE_PATH}/img/spend-cap-on${
                                  resolvedTheme?.includes('dark') ? '' : '--light'
                                }.png?v=3`
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-1">
                        Spend cap is {isUsageBillingEnabled ? 'disabled' : 'enabled'}
                      </p>
                      <p className="text-sm text-foreground-light">
                        {isUsageBillingEnabled ? (
                          <span>You will be charged for any usage above the included quota.</span>
                        ) : (
                          <span>
                            You won't be charged any extra for usage. However, your projects could
                            become unresponsive or enter read only mode if you exceed the included
                            quota.
                          </span>
                        )}
                      </p>
                      {isUsageBillingEnabled && (
                        <p className="text-sm text-foreground-light mt-1">
                          Your projects will never become unresponsive. Only when your usage reaches
                          the quota limit will you be charged for any excess usage.
                        </p>
                      )}
                      <ProjectUpdateDisabledTooltip projectUpdateDisabled={projectUpdateDisabled}>
                        <Button
                          type="default"
                          className="mt-4 pointer-events-auto"
                          disabled={!canChangeTier}
                          onClick={() => snap.setPanelKey('costControl')}
                        >
                          Change spend cap
                        </Button>
                      </ProjectUpdateDisabledTooltip>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
      <SpendCapSidePanel />
    </>
  )
}

export default CostControl
