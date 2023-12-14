import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import InformationBox from 'components/ui/InformationBox'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationBillingSubscriptionPreview } from 'data/organizations/organization-billing-subscription-preview'
import { useOrgPlansQuery } from 'data/subscriptions/org-plans-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { SubscriptionTier } from 'data/subscriptions/types'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import Telemetry from 'lib/telemetry'
import { useRouter } from 'next/router'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import {
  Button,
  IconCheck,
  IconChevronRight,
  IconExternalLink,
  IconInfo,
  Modal,
  SidePanel,
} from 'ui'
import DowngradeModal from './DowngradeModal'
import EnterpriseCard from './EnterpriseCard'
import ExitSurveyModal from './ExitSurveyModal'
import MembersExceedLimitModal from './MembersExceedLimitModal'
import PaymentMethodSelection from './PaymentMethodSelection'

const PlanUpdateSidePanel = () => {
  const { ui } = useStore()
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug

  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [showDowngradeError, setShowDowngradeError] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()
  const [usageFeesExpanded, setUsageFeesExpanded] = useState<string[]>([])

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useOrgSettingsPageStateSnapshot()
  const visible = snap.panelKey === 'subscriptionPlan'
  const onClose = () => {
    const { panel, ...queryWithoutPanel } = router.query
    router.push({ pathname: router.pathname, query: queryWithoutPanel }, undefined, {
      shallow: true,
    })
    snap.setPanelKey(undefined)
  }

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

  const billingViaPartner = subscription?.billing_via_partner === true
  const paymentViaInvoice = subscription?.payment_method_type === 'invoice'

  const {
    data: subscriptionPreview,
    error: subscriptionPreviewError,
    isLoading: subscriptionPreviewIsLoading,
    isSuccess: subscriptionPreviewInitialized,
  } = useOrganizationBillingSubscriptionPreview({ tier: selectedTier, organizationSlug: slug })

  const availablePlans = plans ?? []
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const subscriptionPlanMeta = subscriptionsPlans.find((tier) => tier.id === selectedTier)

  const expandUsageFee = (fee: string) => {
    setUsageFeesExpanded([...usageFeesExpanded, fee])
  }

  const collapseUsageFee = (fee: string) => {
    setUsageFeesExpanded(usageFeesExpanded.filter((item) => item !== fee))
  }

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
    if (!selectedPaymentMethod && !paymentViaInvoice) {
      return ui.setNotification({ category: 'error', message: 'Please select a payment method' })
    }

    // If the user is downgrading from team, should have spend cap disabled by default
    const tier =
      subscription?.plan?.id === 'team' && selectedTier === PRICING_TIER_PRODUCT_IDS.PRO
        ? (PRICING_TIER_PRODUCT_IDS.PAYG as SubscriptionTier)
        : selectedTier

    updateOrgSubscription({ slug, tier, paymentMethod: selectedPaymentMethod })
  }

  const planMeta = selectedTier
    ? availablePlans.find((p) => p.id === selectedTier.split('tier_')[1])
    : null

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
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link href="https://supabase.com/pricing" target="_blank" rel="noreferrer">
                Pricing
              </Link>
            </Button>
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
                    plan.id === 'tier_enterprise' ? 'bg-background' : 'bg-surface-200'
                  )}
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-2">
                      <p className={clsx('text-brand text-sm uppercase')}>{plan.name}</p>
                      {isCurrentPlan ? (
                        <div className="text-xs bg-surface-300 text-foreground-light rounded px-2 py-0.5">
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
                    <div className={clsx('flex mt-1 mb-4', !tierMeta?.warning && 'opacity-0')}>
                      <div className="bg-background text-brand-600 border shadow-sm rounded-md bg-opacity-30 py-0.5 px-2 text-xs">
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
                                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                                  'border border-background',
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
        size="xlarge"
        visible={selectedTier !== undefined && selectedTier !== 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        onConfirm={onUpdateSubscription}
        overlayClassName="pointer-events-none"
        header={`Confirm ${planMeta?.change_type === 'downgrade' ? 'downgrade' : 'upgrade'} to ${
          subscriptionPlanMeta?.name
        }`}
      >
        <Modal.Content className="mt-4">
          {subscriptionPreviewError && (
            <AlertError
              error={subscriptionPreviewError}
              subject="Failed to preview subscription."
            />
          )}
          {subscriptionPreviewIsLoading && (
            <div className="space-y-2">
              <span className="text-sm">Estimating monthly costs...</span>
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}
          {subscriptionPreviewInitialized && (
            <div>
              <Table
                className="mt-2"
                borderless={true}
                head={[
                  <Table.th key="header-item">Item</Table.th>,
                  <Table.th key="header-count" className="text-right pr-4">
                    Usage
                  </Table.th>,
                  <Table.th key="header-unit-price">Unit Price</Table.th>,
                  <Table.th key="header-price" className="text-right">
                    Cost
                  </Table.th>,
                ]}
                body={
                  <>
                    {subscriptionPreview.breakdown.map((item) => (
                      <>
                        <Table.tr key={item.description}>
                          <Table.td>
                            {item.breakdown && item.breakdown.length > 0 && (
                              <Button
                                type="text"
                                className="!pl-0 !pr-1"
                                icon={
                                  <IconChevronRight
                                    className={clsx(
                                      'transition',
                                      usageFeesExpanded.includes(item.description) && 'rotate-90'
                                    )}
                                  />
                                }
                                onClick={() =>
                                  usageFeesExpanded.includes(item.description)
                                    ? collapseUsageFee(item.description)
                                    : expandUsageFee(item.description)
                                }
                              />
                            )}
                            {item.description ?? 'Unknown'}{' '}
                            {item.description.endsWith('Compute') && ` (Hours)`}
                          </Table.td>
                          <Table.td className="text-right pr-4 tabular-nums">
                            {item.quantity?.toLocaleString()}
                          </Table.td>
                          <Table.td>
                            {item.unit_price_desc
                              ? item.unit_price_desc
                              : item.unit_price === 0
                              ? 'FREE'
                              : item.unit_price
                              ? `$${item.unit_price}`
                              : ''}
                          </Table.td>
                          <Table.td className="text-right">${item.total_price}</Table.td>
                        </Table.tr>

                        {usageFeesExpanded.includes(item.description) &&
                          item.breakdown &&
                          item.breakdown.length > 0 &&
                          item.breakdown.map((project) => (
                            <Table.tr key={project.project_ref}>
                              <Table.td className="!pl-12">{project.project_name}</Table.td>
                              <Table.td className="text-right pr-4 tabular-nums">
                                {project.usage}
                              </Table.td>
                              <Table.td />
                              <Table.td />
                            </Table.tr>
                          ))}
                      </>
                    ))}

                    <Table.tr>
                      <Table.td className="font-medium">
                        Monthly Costs (excluding over-usage and credits)
                      </Table.td>
                      <Table.td />
                      <Table.td />
                      <Table.td className="text-right font-medium">
                        $
                        {Math.round(
                          subscriptionPreview.breakdown.reduce(
                            (prev, cur) => prev + cur.total_price,
                            0
                          )
                        ) ?? 0}
                      </Table.td>
                    </Table.tr>
                  </>
                }
              ></Table>

              <InformationBox
                className="mt-4"
                title="Usage-billing for Compute"
                icon={<IconInfo />}
                defaultVisibility={true}
                hideCollapse={true}
                description={
                  <div>
                    <p className="text-sm mt-2">
                      Each project is a dedicated server and database. Paid plans come with $10 of
                      Compute Credits to cover one project on the default Starter Compute size or
                      parts of any compute addon. Additional unpaused projects on paid plans will
                      incur compute usage costs starting at $10 per month, billed hourly.
                    </p>

                    {subscription?.plan?.id === 'free' && (
                      <p className="text-sm mt-2">
                        Mixing paid and non-paid projects in a single organization is not possible.
                        If you want projects to be on the free plan, use self-serve project
                        transfers.
                      </p>
                    )}

                    <div className="space-x-3 mt-2">
                      <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                        <Link
                          href="https://supabase.com/docs/guides/platform/org-based-billing"
                          target="_blank"
                          rel="noreferrer"
                        >
                          How billing works
                        </Link>
                      </Button>
                      {subscription?.plan?.id === 'free' && (
                        <Button
                          asChild
                          type="default"
                          icon={<IconExternalLink strokeWidth={1.5} />}
                        >
                          <Link
                            href="https://supabase.com/docs/guides/platform/project-transfer"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Project transfers
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                }
              />
            </div>
          )}
        </Modal.Content>

        <Modal.Content>
          {!billingViaPartner ? (
            <div className="py-4 space-y-2">
              <p className="text-sm">
                Upon clicking confirm, your monthly invoice will be adjusted and your credit card
                will be charged immediately. Changing the plan resets your billing cycle and may
                result in a prorated charge for previous usage.
              </p>

              <div className="!mt-4">
                <PaymentMethodSelection
                  selectedPaymentMethod={selectedPaymentMethod}
                  onSelectPaymentMethod={setSelectedPaymentMethod}
                />
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-2">
              <p className="text-sm">
                This organization is billed through one of our partners and you will be charged by
                them directly.
              </p>
              {subscriptionPreview?.billed_via_partner &&
                subscriptionPreview?.plan_change_type === 'downgrade' && (
                  <p className="text-sm">
                    Your organization will be downgraded at the end of your current billing cycle.
                  </p>
                )}
            </div>
          )}
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
