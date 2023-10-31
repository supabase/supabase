import { useParams } from 'common'
import { useTheme } from 'next-themes'
import ProjectUpdateDisabledTooltip from 'components/interfaces/Organization/BillingSettings/ProjectUpdateDisabledTooltip'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useFlag } from 'hooks'
import { BASE_PATH } from 'lib/constants'
import Link from 'next/link'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconExternalLink } from 'ui'
import SpendCapSidePanel from './SpendCapSidePanel'
import Image from 'next/image'

export interface CostControlProps {}

const CostControl = ({}: CostControlProps) => {
  const { ref: projectRef } = useParams()
  const snap = useSubscriptionPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { resolvedTheme } = useTheme()

  const { data: subscription, isLoading } = useProjectSubscriptionV2Query({ projectRef })

  const currentPlan = subscription?.plan
  const isUsageBillingEnabled = subscription?.usage_billing_enabled ?? false

  const canChangeTier =
    !projectUpdateDisabled && !['team', 'enterprise'].includes(currentPlan?.id || '')

  return (
    <>
      <div className="grid grid-cols-12 gap-6" id="cost-control">
        <div className="col-span-12 lg:col-span-5">
          <div className="sticky top-16">
            <div className="space-y-6">
              <div>
                <p className="text-base">Cost Control</p>
                <p className="text-sm text-foreground-light">
                  Control whether to use beyond your plans included quota
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-foreground-light">More information</p>
                <div>
                  <Link
                    href="https://supabase.com/docs/guides/platform/spend-cap"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                      <p className="text-sm">Spend cap</p>
                      <IconExternalLink size={16} strokeWidth={1.5} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="col-span-12 lg:col-span-7 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : (
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {['team', 'enterprise'].includes(currentPlan?.id || '') ? (
              <Alert
                withIcon
                variant="info"
                title={`You will be charged for any additional usage on the ${
                  currentPlan?.name || ''
                } plan`}
              >
                {currentPlan?.name || ''} plan requires you to have spend cap off at all times. Your
                project will never become unresponsive. Only when your{' '}
                <Link
                  href="#breakdown"
                  className="text-sm text-green-900 transition hover:text-green-1000"
                >
                  included usage
                </Link>{' '}
                is exceeded will you be charged for any additional usage.
              </Alert>
            ) : (
              <p className="text-sm text-foreground-light">
                You can control whether your project is charged for additional usage beyond the{' '}
                <Link
                  href="#breakdown"
                  className="text-sm text-green-900 transition hover:text-green-1000"
                >
                  included quota
                </Link>{' '}
                of your subscription plan. If you need to go beyond the included quota, simply
                switch off your spend cap to pay for additional usage.
              </p>
            )}

            <div className="flex space-x-6">
              <div>
                <div className="rounded-md bg-scale-100 dark:bg-scale-400 w-[160px] h-[96px] shadow">
                  <Image
                    alt="Spend Cap"
                    width={160}
                    height={96}
                    src={
                      isUsageBillingEnabled
                        ? `${BASE_PATH}/img/spend-cap-off${
                            resolvedTheme === 'dark' ? '' : '--light'
                          }.png?v=3`
                        : `${BASE_PATH}/img/spend-cap-on${
                            resolvedTheme === 'dark' ? '' : '--light'
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
                      You won't be charged any extra for usage. However, your project could become
                      unresponsive or enter read only mode if you exceed the included quota.
                    </span>
                  )}
                </p>
                {isUsageBillingEnabled && (
                  <p className="text-sm text-foreground-light mt-1">
                    Your project will never become unresponsive. Only when your usage reaches the
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
      </div>
      <SpendCapSidePanel />
    </>
  )
}

export default CostControl
