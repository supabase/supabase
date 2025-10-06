import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'

import { useFlag, useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert, Button } from 'ui'
import { Admonition } from 'ui-patterns'
import ProjectUpdateDisabledTooltip from '../ProjectUpdateDisabledTooltip'
import { Restriction } from '../Restriction'
import PlanUpdateSidePanel from './PlanUpdateSidePanel'

const Subscription = () => {
  const { slug } = useParams()
  const snap = useOrgSettingsPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const { isSuccess: isPermissionsLoaded, can: canReadSubscriptions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const {
    data: subscription,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug }, { enabled: canReadSubscriptions })

  const currentPlan = subscription?.plan
  const planName = currentPlan?.name ?? 'Unknown'

  const canChangeTier = !projectUpdateDisabled && !['enterprise'].includes(currentPlan?.id ?? '')

  return (
    <>
      <ScaffoldSection>
        <div className="col-span-12 pb-2">
          <Restriction />
        </div>
        <ScaffoldSectionDetail>
          <div className="sticky space-y-6 top-12">
            <div className="space-y-2 mb-4">
              <p className="text-foreground text-base m-0">Subscription Plan</p>
              <p className="text-sm text-foreground-light m-0">
                Each organization has it's own subscription plan, billing cycle, payment methods and
                usage quotas.
              </p>
            </div>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {isPermissionsLoaded && !canReadSubscriptions ? (
            <NoPermission resourceText="view this organization's subscription" />
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
                  <div>
                    <p className="text-2xl text-brand">{currentPlan?.name ?? 'Unknown'} Plan</p>
                  </div>

                  <div>
                    <ProjectUpdateDisabledTooltip projectUpdateDisabled={projectUpdateDisabled}>
                      <Button
                        type="default"
                        className="pointer-events-auto"
                        disabled={!canChangeTier}
                        onClick={() => snap.setPanelKey('subscriptionPlan')}
                      >
                        Change subscription plan
                      </Button>
                    </ProjectUpdateDisabledTooltip>
                    {!canChangeTier &&
                      (projectUpdateDisabled ? (
                        <Alert
                          className="mt-2"
                          withIcon
                          variant="info"
                          title={`Unable to update plan from ${planName}`}
                        >
                          We have temporarily disabled project and subscription changes - our
                          engineers are working on a fix.
                        </Alert>
                      ) : (
                        <Alert
                          withIcon
                          className="mt-2"
                          variant="info"
                          title={`Unable to update plan from ${planName}`}
                          actions={[
                            <div key="contact-support">
                              <Button asChild type="default">
                                <Link
                                  href={`/support/new?category=sales&subject=Change%20plan%20away%20from%20${planName}`}
                                >
                                  Contact support
                                </Link>
                              </Button>
                            </div>,
                          ]}
                        >
                          Please contact us if you'd like to change your plan.
                        </Alert>
                      ))}
                  </div>

                  {!subscription?.usage_billing_enabled && (
                    <Admonition
                      type="default"
                      title="This organization is limited by the included usage"
                    >
                      <div className="[&>p]:!leading-normal prose text-sm">
                        Projects may become unresponsive when this organization exceeds its{' '}
                        <Link href={`/org/${slug}/usage`}>included usage quota</Link>. To scale
                        seamlessly,{' '}
                        {currentPlan?.id === 'free'
                          ? 'upgrade to a paid plan.'
                          : 'you can disable Spend Cap under the Cost Control settings.'}
                      </div>
                    </Admonition>
                  )}
                </div>
              )}
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
      <PlanUpdateSidePanel />
    </>
  )
}

export default Subscription
