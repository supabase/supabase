import clsx from 'clsx'
import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useProjectPlansQuery } from 'data/subscriptions/project-plans-query'
import { useProjectSubscriptionUpdateMutation } from 'data/subscriptions/project-subscription-update-mutation'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useFlag, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconCheck, IconExternalLink, Modal, SidePanel } from 'ui'
import EnterpriseCard from './EnterpriseCard'
import ExitSurveyModal from './ExitSurveyModal'
import MembersExceedLimitModal from './MembersExceedLimitModal'
import PaymentMethodSelection from './PaymentMethodSelection'
import { SUBSCRIPTION_PLANS } from './Tier.constants'

const TierUpdateSidePanel = () => {
  const { ui } = useStore()
  const slug = ui.selectedOrganization?.slug
  const { ref: projectRef } = useParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [showDowngradeError, setShowDowngradeError] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'subscriptionPlan'
  const onClose = () => snap.setPanelKey(undefined)

  const { data: plans, isLoading: isLoadingPlans } = useProjectPlansQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery({ slug })
  const { data: subscription, isLoading } = useProjectSubscriptionV2Query({ projectRef })
  const { mutateAsync: updateSubscriptionTier } = useProjectSubscriptionUpdateMutation()

  const availablePlans = plans ?? []
  const subscriptionAddons = addons?.selected_addons ?? []
  const userIsOnTeamTier = subscription?.plan?.id === 'team'

  const teamTierEnabled = useFlag('teamTier') || userIsOnTeamTier
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const selectedTierMeta = SUBSCRIPTION_PLANS.find((tier) => tier.id === selectedTier)
  const selectedPlanMeta = availablePlans.find(
    (plan) => plan.id === selectedTier?.split('tier_')[1]
  )

  useEffect(() => {
    if (visible) {
      setSelectedTier(undefined)
    }
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
    if (!projectRef) return console.error('Project ref is required')
    if (!selectedTier) return console.error('Selected plan is required')
    if (!selectedPaymentMethod) {
      return ui.setNotification({ category: 'error', message: 'Please select a payment method' })
    }

    try {
      setIsSubmitting(true)
      await updateSubscriptionTier({
        projectRef,
        tier: selectedTier,
        paymentMethod: selectedPaymentMethod,
      })
      ui.setNotification({
        category: 'success',
        message: `Successfully updated subscription to ${selectedTierMeta?.name}!`,
      })
      setSelectedTier(undefined)
      onClose()
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to update subscription: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
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
            <h4>Change subscription plan</h4>
            <Link href="https://supabase.com/pricing">
              <a target="_blank" rel="noreferrer">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  More information
                </Button>
              </a>
            </Link>
          </div>
        }
      >
        <SidePanel.Content>
          <div className="py-6 grid grid-cols-12 gap-3">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const planMeta = availablePlans.find((p) => p.id === plan.id.split('tier_')[1])
              const price = planMeta?.price ?? 0
              const isDowngradeOption = planMeta?.change_type === 'downgrade'
              const isCurrentPlan = planMeta?.is_current ?? false

              if (plan.id === 'tier_team' && !teamTierEnabled) return null
              if (plan.id === 'tier_enterprise') {
                return (
                  <EnterpriseCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={isCurrentPlan}
                    isTeamTierEnabled={teamTierEnabled}
                  />
                )
              }

              return (
                <div
                  key={plan.id}
                  className={clsx(
                    'border rounded-md px-4 py-4 flex flex-col items-start justify-between',
                    teamTierEnabled && plan.id === 'tier_enterprise' ? 'col-span-12' : 'col-span-4',
                    plan.id === 'tier_enterprise' ? 'bg-scale-200' : 'bg-scale-300'
                  )}
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-2">
                      <p className={clsx('text-brand-900 text-sm uppercase')}>{plan.name}</p>
                      {isCurrentPlan ? (
                        <div className="text-xs bg-scale-500 text-scale-1000 rounded px-2 py-0.5">
                          Current plan
                        </div>
                      ) : plan.new ? (
                        <div className="text-xs bg-brand-400 text-brand-900 rounded px-2 py-0.5">
                          New
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
                      <p className="text-scale-1000 text-sm">per month</p>
                    </div>
                    <div
                      className={clsx(
                        'flex mt-1 mb-4',
                        plan.id !== PRICING_TIER_PRODUCT_IDS.TEAM && 'opacity-0'
                      )}
                    >
                      <div className="text-xs bg-brand-400 text-brand-900 rounded px-2 py-0.5">
                        Usage based plan
                      </div>
                    </div>
                    {isCurrentPlan ? (
                      <Button block disabled type="default">
                        Current plan
                      </Button>
                    ) : (
                      <Button
                        block
                        type={isDowngradeOption ? 'default' : 'primary'}
                        loading={isLoading}
                        disabled={isLoading}
                        onClick={() => setSelectedTier(plan.id as any)}
                      >
                        {isDowngradeOption ? 'Downgrade' : 'Upgrade'} to {plan.name}
                      </Button>
                    )}

                    <div className="border-t my-6" />

                    <ul role="list">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex py-2">
                          <div className="w-[12px]">
                            <IconCheck
                              className="h-3 w-3 text-brand-900 translate-y-[2.5px]"
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

      <Modal
        size="medium"
        alignFooter="right"
        visible={selectedTier === 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        onConfirm={onConfirmDowngrade}
        header={`Confirm to downgrade to ${selectedTierMeta?.name}`}
      >
        {/* [JOSHEN] We could make this better by only showing a danger warning if the project is already above the free plan limits */}
        <Modal.Content>
          <div className="py-6">
            <Alert
              withIcon
              variant="warning"
              title="Downgrading to the free plan will lead to reductions in your project's capacity"
            >
              <p>
                If you're already past the limits of the free plan, your project could become
                unresponsive or enter read only mode.
              </p>
              {subscriptionAddons.length > 0 && (
                <>
                  <p className="mt-2">
                    Your project's add ons will also be removed, which includes:
                  </p>
                  <ul className="list-disc pl-6">
                    {subscriptionAddons.map((addon) => (
                      <li key={addon.type} className="mt-0.5">
                        {addon.variant.name}{' '}
                        {addon.type === 'compute_instance'
                          ? 'compute instance'
                          : addon.type === 'pitr'
                          ? 'PITR'
                          : ''}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Alert>
          </div>
        </Modal.Content>
      </Modal>

      <Modal
        loading={isSubmitting}
        alignFooter="right"
        className="!w-[450px]"
        visible={selectedTier !== undefined && selectedTier !== 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        onConfirm={onUpdateSubscription}
        overlayClassName="pointer-events-none"
        header={`Confirm to upgrade to ${selectedTierMeta?.name}`}
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
              You will also be able to change your project's add-ons after upgrading your project's
              plan.
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
        onClose={(success?: boolean) => {
          setShowExitSurvey(false)
          if (success) onClose()
        }}
      />
    </>
  )
}

export default TierUpdateSidePanel
