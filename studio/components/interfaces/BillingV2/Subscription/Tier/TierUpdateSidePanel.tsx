import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import InformationBox from 'components/ui/InformationBox'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useProjectPlansQuery } from 'data/subscriptions/project-plans-query'
import { useProjectSubscriptionUpdateMutation } from 'data/subscriptions/project-subscription-update-mutation'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import Telemetry from 'lib/telemetry'
import { useRouter } from 'next/router'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconCheck, IconExternalLink, IconInfo, Modal, SidePanel } from 'ui'
import EnterpriseCard from './EnterpriseCard'
import ExitSurveyModal from './ExitSurveyModal'
import MembersExceedLimitModal from './MembersExceedLimitModal'
import PaymentMethodSelection from './PaymentMethodSelection'

const TierUpdateSidePanel = () => {
  const { ui } = useStore()
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug
  const { ref: projectRef } = useParams()

  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [showDowngradeError, setShowDowngradeError] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'subscriptionPlan'
  const onClose = () => snap.setPanelKey(undefined)

  const { data: plans, isLoading: isLoadingPlans } = useProjectPlansQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery({ slug })
  const { mutate: updateSubscriptionTier, isLoading: isUpdating } =
    useProjectSubscriptionUpdateMutation({
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: `Successfully updated subscription to ${selectedTierMeta?.name}!`,
        })
        setSelectedTier(undefined)
        onClose()
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      },
    })

  const availablePlans = plans ?? []
  const subscriptionAddons = addons?.selected_addons ?? []

  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const selectedTierMeta = subscriptionsPlans.find((tier) => tier.id === selectedTier)
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
          projectRef,
        },
        router
      )
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

    updateSubscriptionTier({
      projectRef,
      tier: selectedTier,
      paymentMethod: selectedPaymentMethod,
    })
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
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link href="https://supabase.com/pricing" target="_blank" rel="noreferrer">
                Pricing
              </Link>
            </Button>
          </div>
        }
      >
        <SidePanel.Content>
          <InformationBox
            icon={<IconInfo size="large" strokeWidth={1.5} />}
            defaultVisibility={true}
            hideCollapse
            title="We're upgrading our billing system"
            className="mt-4"
            description={
              <div className="space-y-3">
                <p className="text-sm leading-normal">
                  This organization uses the legacy project-based billing. We’ve recently made some
                  big improvements to our billing system. To migrate to the new organization-based
                  billing, head over to your{' '}
                  <Link
                    href={`/org/${slug}/billing`}
                    className="text-sm text-green-900 transition hover:text-green-1000"
                  >
                    organization billing settings
                  </Link>
                  .
                </p>

                <div className="space-x-3">
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    <Link
                      href="https://supabase.com/blog/organization-based-billing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Announcement
                    </Link>
                  </Button>
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    <Link
                      href="https://supabase.com/docs/guides/platform/org-based-billing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Documentation
                    </Link>
                  </Button>
                </div>
              </div>
            }
          />

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
                        <div className="text-xs bg-scale-500 text-foreground-light rounded px-2 py-0.5">
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
                      {(price ?? 0) > 0 && <p className="text-foreground-light text-sm">From</p>}
                      {isLoadingPlans ? (
                        <div className="h-[28px] flex items-center justify-center">
                          <ShimmeringLoader className="w-[30px] h-[24px]" />
                        </div>
                      ) : (
                        <p className="text-foreground text-lg">${price}</p>
                      )}
                      <p className="text-foreground-light text-sm">{tierMeta?.costUnit}</p>
                    </div>
                    <div
                      className={clsx('flex mt-1 mb-4', !tierMeta?.warningLegacy && 'opacity-0')}
                    >
                      <div className="bg-scale-200 text-brand-600 border shadow-sm rounded-md bg-opacity-30 py-0.5 px-2 text-xs">
                        {tierMeta?.warningLegacy}
                      </div>
                    </div>
                    {isCurrentPlan ? (
                      <Button block disabled type="default">
                        Current plan
                      </Button>
                    ) : plan.id !== PRICING_TIER_PRODUCT_IDS.TEAM ? (
                      <Tooltip.Root delayDuration={0}>
                        <Tooltip.Trigger asChild>
                          <div>
                            <Button
                              block
                              disabled={
                                // no self-serve downgrades from team plan right now
                                (plan.id !== PRICING_TIER_PRODUCT_IDS.TEAM &&
                                  ['team', 'enterprise'].includes(subscription?.plan?.id || '')) ||
                                !canUpdateSubscription
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
                                    projectRef,
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
                                <span className="text-xs text-foreground">
                                  You do not have permission to change the subscription plan.
                                </span>
                              </div>
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        ) : null}
                      </Tooltip.Root>
                    ) : (
                      <Button asChild block type="primary">
                        <Link href={plan.href} className="hidden md:block" target="_blank">
                          Contact Us
                        </Link>
                      </Button>
                    )}

                    <div className="border-t my-6" />

                    <ul role="list">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex py-2">
                          <div className="w-[12px]">
                            <IconCheck
                              className="h-3 w-3 text-brand translate-y-[2.5px]"
                              aria-hidden="true"
                              strokeWidth={3}
                            />
                          </div>
                          <p className="ml-3 text-xs text-foreground-light">{feature}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.footer && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-foreground-light text-xs">{plan.footer}</p>
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
        loading={isUpdating}
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
            <p className="text-sm text-foreground-light">
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
