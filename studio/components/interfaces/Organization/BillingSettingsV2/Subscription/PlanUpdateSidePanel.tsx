import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgPlansQuery } from 'data/subscriptions/org-plans-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import Telemetry from 'lib/telemetry'
import { useRouter } from 'next/router'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Button, IconCheck, IconExternalLink, Modal, SidePanel } from 'ui'
import DowngradeModal from './DowngradeModal'
import EnterpriseCard from './EnterpriseCard'
import ExitSurveyModal from './ExitSurveyModal'
import MembersExceedLimitModal from './MembersExceedLimitModal'
import PaymentMethodSelection from './PaymentMethodSelection'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'

// [Joshen TODO] Need to remove all contexts of "projects"

const PlanUpdateSidePanel = () => {
  const { ui } = useStore()
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug

  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [showDowngradeError, setShowDowngradeError] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useOrgSettingsPageStateSnapshot()
  const visible = snap.panelKey === 'subscriptionPlan'
  const onClose = () => snap.setPanelKey(undefined)

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
  const { data: plans, isLoading: isLoadingPlans } = useOrgPlansQuery({ orgSlug: slug })
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery({ slug })
  const { mutate: updateOrgSubscription, isLoading: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: `Successfully updated subscription to ${subscriptionPlanMeta?.name}!`,
        })
        setSelectedTier(undefined)
        onClose()
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      },
      onError: (error) => {
        ui.setNotification({
          error,
          category: 'error',
          message: `Unable to update subscription: ${error.message}`,
        })
      },
    }
  )

  const availablePlans = plans ?? []
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const subscriptionPlanMeta = subscriptionsPlans.find((tier) => tier.id === selectedTier)
  const selectedPlanMeta = availablePlans.find(
    (plan) => plan.id === selectedTier?.split('tier_')[1]
  )

  useEffect(() => {
    if (visible) {
      setSelectedTier(undefined)
      Telemetry.sendActivity(
        {
          activity: 'Side Panel Viewed',
          source: 'Dashboard',
          data: {
            title: 'Change Subscription Plan',
            section: 'Subscription plan',
          },
          ...(slug && { orgSlug: slug }),
        },
        router
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const onConfirmDowngrade = () => {
    setSelectedTier(undefined)
    if (hasMembersExceedingFreeTierLimit) {
      setShowDowngradeError(true)
    } else {
      setShowExitSurvey(true)
    }
  }

  const onUpdateSubscription = async () => {
    if (!slug) return console.error('org slug is required')
    if (!selectedTier) return console.error('Selected plan is required')
    if (!selectedPaymentMethod) {
      return ui.setNotification({ category: 'error', message: 'Please select a payment method' })
    }

    updateOrgSubscription({ slug, tier: selectedTier, paymentMethod: selectedPaymentMethod })
  }

  return (
    <>
      <SidePanel
        hideFooter
        size="xxlarge"
        visible={visible}
        onCancel={() => onClose()}
        header={
          <div className="flex items-center justify-between">
            <h4>Change subscription plan for {selectedOrganization?.name}</h4>
            <Link href="https://supabase.com/pricing">
              <a target="_blank" rel="noreferrer">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  Pricing
                </Button>
              </a>
            </Link>
          </div>
        }
      >
        <SidePanel.Content>
          <div className="py-6 grid grid-cols-12 gap-3">
            {subscriptionsPlans.map((plan) => {
              const planMeta = availablePlans.find((p) => p.id === plan.id.split('tier_')[1])
              const tierMeta = subscriptionsPlans.find((it) => it.id === plan.id)
              const price = planMeta?.price ?? 0
              const isDowngradeOption = planMeta?.change_type === 'downgrade'
              const isCurrentPlan = planMeta?.id === subscription?.plan?.id

              if (plan.id === 'tier_enterprise') {
                return <EnterpriseCard key={plan.id} plan={plan} isCurrentPlan={isCurrentPlan} />
              }

              return (
                <div
                  key={plan.id}
                  className={clsx(
                    'border rounded-md px-4 py-4 flex flex-col items-start justify-between',
                    plan.id === 'tier_enterprise' ? 'col-span-12' : 'col-span-12 md:col-span-4',
                    plan.id === 'tier_enterprise' ? 'bg-scale-200' : 'bg-scale-300'
                  )}
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-2">
                      <p className={clsx('text-brand text-sm uppercase')}>{plan.name}</p>
                      {isCurrentPlan ? (
                        <div className="text-xs bg-scale-500 text-scale-1000 rounded px-2 py-0.5">
                          Current plan
                        </div>
                      ) : plan.nameBadge ? (
                        <div className="text-xs bg-brand-400 text-brand rounded px-2 py-0.5">
                          {plan.nameBadge}
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="mt-4 flex items-center space-x-1">
                      {(price ?? 0) > 0 && <p className="text-scale-1000 text-sm">From</p>}
                      {isLoadingPlans ? (
                        <div className="h-[28px] flex items-center justify-center">
                          <ShimmeringLoader className="w-[30px] h-[24px]" />
                        </div>
                      ) : (
                        <p className="text-scale-1200 text-lg">${price}</p>
                      )}
                      <p className="text-scale-1000 text-sm">{tierMeta?.costUnitOrg}</p>
                    </div>
                    <div className={clsx('flex mt-1 mb-4', !tierMeta?.warning && 'opacity-0')}>
                      <div className="bg-scale-200 text-brand-600 border shadow-sm rounded-md bg-opacity-30 py-0.5 px-2 text-xs">
                        {tierMeta?.warning}
                      </div>
                    </div>
                    {isCurrentPlan ? (
                      <Button block disabled type="default">
                        Current plan
                      </Button>
                    ) : (
                      <Tooltip.Root delayDuration={0}>
                        <Tooltip.Trigger asChild>
                          <div>
                            <Button
                              block
                              disabled={
                                // No self-serve downgrades from Enterprise
                                subscription?.plan?.id === 'enterprise' || !canUpdateSubscription
                              }
                              type={isDowngradeOption ? 'default' : 'primary'}
                              onClick={() => {
                                setSelectedTier(plan.id as any)
                                Telemetry.sendActivity(
                                  {
                                    activity: 'Popup Viewed',
                                    source: 'Dashboard',
                                    data: {
                                      title: isDowngradeOption
                                        ? 'Downgrade'
                                        : 'Upgrade' + ' to ' + plan.name,
                                      section: 'Subscription plan',
                                    },
                                    ...(slug && { orgSlug: slug }),
                                  },
                                  router
                                )
                              }}
                            >
                              {isDowngradeOption ? 'Downgrade' : 'Upgrade'} to {plan.name}
                            </Button>
                          </div>
                        </Tooltip.Trigger>
                        {!canUpdateSubscription ? (
                          <Tooltip.Portal>
                            <Tooltip.Content side="bottom">
                              <Tooltip.Arrow className="radix-tooltip-arrow" />
                              <div
                                className={[
                                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                  'border border-scale-200',
                                ].join(' ')}
                              >
                                <span className="text-xs text-scale-1200">
                                  You do not have permission to change the subscription plan.
                                </span>
                              </div>
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        ) : null}
                      </Tooltip.Root>
                    )}

                    <div className="border-t my-6" />

                    <ul role="list">
                      {(plan.featuresOrg || plan.features).map((feature) => (
                        <li key={feature} className="flex py-2">
                          <div className="w-[12px]">
                            <IconCheck
                              className="h-3 w-3 text-brand translate-y-[2.5px]"
                              aria-hidden="true"
                              strokeWidth={3}
                            />
                          </div>
                          <p className="ml-3 text-xs text-scale-1100">{feature}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.footer && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-scale-1000 text-xs">{plan.footer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SidePanel.Content>
      </SidePanel>

      <DowngradeModal
        visible={selectedTier === 'tier_free'}
        selectedPlan={subscriptionPlanMeta}
        subscription={subscription}
        onClose={() => setSelectedTier(undefined)}
        onConfirm={onConfirmDowngrade}
      />

      <Modal
        loading={isUpdating}
        alignFooter="right"
        className="!w-[450px]"
        visible={selectedTier !== undefined && selectedTier !== 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        onConfirm={onUpdateSubscription}
        overlayClassName="pointer-events-none"
        header={`Confirm to upgrade to ${subscriptionPlanMeta?.name}`}
      >
        <Modal.Content>
          <div className="py-6 space-y-2">
            <p className="text-sm">
              Upon clicking confirm, the amount of ${selectedPlanMeta?.price ?? 'Unknown'} will be
              added to your monthly invoice and your credit card will be charged immediately.
              Changing the plan resets your billing cycle and may result in a prorated charge for
              previous usage.
            </p>
            <p className="text-sm text-scale-1000">
              You will also be able to change your project's add-ons after upgrading your plan.
            </p>
            <div className="!mt-6">
              <PaymentMethodSelection
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPaymentMethod={setSelectedPaymentMethod}
              />
            </div>
          </div>
        </Modal.Content>
      </Modal>

      <MembersExceedLimitModal
        visible={showDowngradeError}
        onClose={() => setShowDowngradeError(false)}
      />

      <ExitSurveyModal
        visible={showExitSurvey}
        subscription={subscription}
        onClose={(success?: boolean) => {
          setShowExitSurvey(false)
          if (success) onClose()
        }}
      />
    </>
  )
}

export default PlanUpdateSidePanel
