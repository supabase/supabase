import Link from 'next/link'

import { useParams, useTheme } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useFlag } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert, Button, IconExternalLink } from 'ui'
import ProjectUpdateDisabledTooltip from '../../BillingSettings/ProjectUpdateDisabledTooltip'
import SpendCapSidePanel from './SpendCapSidePanel'

export interface CostControlProps {}

const CostControl = ({}: CostControlProps) => {
  const { slug } = useParams()
  const { isDarkMode } = useTheme()

  const snap = useOrgSettingsPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const {
    data: subscription,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useOrgSubscriptionQuery({ orgSlug: slug })

  const currentPlan = subscription?.plan
  const isUsageBillingEnabled = subscription?.usage_billing_enabled ?? false

  const canChangeTier =
    !projectUpdateDisabled && !['team', 'enterprise'].includes(currentPlan?.id || '')

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail>
          <div className="sticky space-y-6 top-12">
            <div className="space-y-2">
              <p className="text-base m-0">Cost Control</p>
              <p className="text-sm text-scale-1000 m-0">
                Control whether to use beyond your plans included quota
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-scale-1100">More information</p>
              <div>
                <Link href="https://supabase.com/docs/guides/platform/spend-cap">
                  <a target="_blank" rel="noreferrer">
                    <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                      <p className="text-sm m-0">Spend cap</p>
                      <IconExternalLink size={16} strokeWidth={1.5} />
                    </div>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
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
                  {currentPlan?.name || ''} plan requires you to have spend cap off at all times.
                  Your projects will never become unresponsive. Only when your{' '}
                  <Link href="#breakdown">
                    <a className="text-green-900 transition hover:text-green-1000">
                      included usage
                    </a>
                  </Link>{' '}
                  is exceeded will you be charged for any additional usage.
                </Alert>
              ) : (
                <p className="text-sm text-scale-1000">
                  You can control whether your organization is charged for additional usage beyond
                  the{' '}
                  <Link href="#breakdown">
                    <a className="text-green-900 transition hover:text-green-1000">
                      included quota
                    </a>
                  </Link>{' '}
                  of your subscription plan. If you need to go beyond the included quota, simply
                  switch off your spend cap to pay for additional usage.
                </p>
              )}

              <div className="flex space-x-6">
                <div>
                  <div className="rounded-md bg-scale-100 dark:bg-scale-400 w-[160px] h-[96px] shadow">
                    <img
                      alt="Spend Cap"
                      width={160}
                      height={96}
                      src={
                        isUsageBillingEnabled
                          ? `${BASE_PATH}/img/spend-cap-off${isDarkMode ? '' : '--light'}.png?v=3`
                          : `${BASE_PATH}/img/spend-cap-on${isDarkMode ? '' : '--light'}.png?v=3`
                      }
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-1">
                    Spend cap is {isUsageBillingEnabled ? 'disabled' : 'enabled'}
                  </p>
                  <p className="text-sm text-scale-1000">
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
                    <p className="text-sm text-scale-1000 mt-1">
                      Your projects will never become unresponsive. Only when your usage reaches the
                      quota limit will you be charged for any excess usage.
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
        </ScaffoldSectionContent>
      </ScaffoldSection>
      <SpendCapSidePanel />
    </>
  )
}

export default CostControl
