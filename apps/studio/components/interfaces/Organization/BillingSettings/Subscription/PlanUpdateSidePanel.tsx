import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isArray } from 'lodash'
import { Box, ChevronRight, ExternalLink, Pause } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { billingPartnerLabel } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationBillingSubscriptionPreview } from 'data/organizations/organization-billing-subscription-preview'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgPlansQuery } from 'data/subscriptions/org-plans-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import type { OrgPlan, SubscriptionTier } from 'data/subscriptions/types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import { pickFeatures, pickFooter, plans as subscriptionsPlans } from 'shared-data/plans'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Alert_Shadcn_, Badge, Button, IconCheck, Modal, SidePanel, WarningIcon, cn } from 'ui'
import DowngradeModal from './DowngradeModal'
import EnterpriseCard from './EnterpriseCard'
import ExitSurveyModal from './ExitSurveyModal'
import MembersExceedLimitModal from './MembersExceedLimitModal'
import PaymentMethodSelection from './PaymentMethodSelection'
import UpgradeSurveyModal from './UpgradeModal'

const PlanUpdateSidePanel = () => {
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug

  const originalPlanRef = useRef<string>()

  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [showUpgradeSurvey, setShowUpgradeSurvey] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [showDowngradeError, setShowDowngradeError] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()
  const [usageFeesExpanded, setUsageFeesExpanded] = useState<string[]>([])

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const { data: allProjects } = useProjectsQuery()
  const orgProjects = (allProjects || []).filter(
    (it) => it.organization_id === selectedOrganization?.id
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

  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })
  const { data: plans, isLoading: isLoadingPlans } = useOrgPlansQuery({ orgSlug: slug })
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery({ slug })
  const { mutate: updateOrgSubscription, isLoading: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onSuccess: () => {
        toast.success(`Successfully updated subscription to ${subscriptionPlanMeta?.name}!`)
        setSelectedTier(undefined)
        onClose()
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        setShowUpgradeSurvey(true)
      },
      onError: (error) => {
        toast.error(`Unable to update subscription: ${error.message}`)
      },
    }
  )

  const billingViaPartner = subscription?.billing_via_partner === true
  const billingPartner = subscription?.billing_partner
  const paymentViaInvoice = subscription?.payment_method_type === 'invoice'

  const {
    data: subscriptionPreview,
    error: subscriptionPreviewError,
    isLoading: subscriptionPreviewIsLoading,
    isSuccess: subscriptionPreviewInitialized,
  } = useOrganizationBillingSubscriptionPreview({ tier: selectedTier, organizationSlug: slug })

  const availablePlans: OrgPlan[] = plans?.plans ?? []
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (visible && isSuccessSubscription) {
      originalPlanRef.current = subscription.plan.id
    }
  }, [visible, isSuccessSubscription])

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
      return toast.error('Please select a payment method')
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
            <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
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
              const price = planMeta?.price ?? 0
              const isDowngradeOption = planMeta?.change_type === 'downgrade'
              const isCurrentPlan = planMeta?.id === subscription?.plan?.id
              const features = pickFeatures(plan, billingPartner)
              const footer = pickFooter(plan, billingPartner)

              if (plan.id === 'tier_enterprise') {
                return (
                  <EnterpriseCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={isCurrentPlan}
                    billingPartner={billingPartner}
                  />
                )
              }

              return (
                <div
                  key={plan.id}
                  className={
                    'border rounded-md px-4 py-4 flex flex-col items-start justify-between col-span-12 md:col-span-4 bg-surface-200'
                  }
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-2">
                      <p className={cn('text-brand text-sm uppercase')}>{plan.name}</p>
                      {isCurrentPlan ? (
                        <div className="text-xs bg-surface-300 text-foreground-light rounded px-2 py-0.5">
                          Current plan
                        </div>
                      ) : plan.nameBadge ? (
                        <div className="text-xs bg-brand-400 text-brand-600 rounded px-2 py-0.5">
                          {plan.nameBadge}
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="mt-4 flex items-center space-x-1 mb-4">
                      {(price ?? 0) > 0 && <p className="text-foreground-light text-sm">From</p>}
                      {isLoadingPlans ? (
                        <div className="h-[28px] flex items-center justify-center">
                          <ShimmeringLoader className="w-[30px] h-[24px]" />
                        </div>
                      ) : (
                        <p className="text-foreground text-lg">{formatCurrency(price)}</p>
                      )}
                      <p className="text-foreground-light text-sm">{plan.costUnit}</p>
                    </div>
                    {isCurrentPlan ? (
                      <Button block disabled type="default">
                        Current plan
                      </Button>
                    ) : (
                      <ButtonTooltip
                        block
                        type={isDowngradeOption ? 'default' : 'primary'}
                        disabled={
                          subscription?.plan?.id === 'enterprise' ||
                          !canUpdateSubscription ||
                          (plan.id === 'tier_team' &&
                            selectedOrganization?.managed_by === 'vercel-marketplace')
                        }
                        onClick={() => setSelectedTier(plan.id as any)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text:
                              subscription?.plan?.id === 'enterprise'
                                ? 'Reach out to us via support to update your plan from Enterprise'
                                : !canUpdateSubscription
                                  ? 'You do not have permission to change the subscription plan'
                                  : plan.id === 'tier_team' &&
                                      selectedOrganization?.managed_by === 'vercel-marketplace'
                                    ? 'The Team plan is currently unavailable for Vercel Marketplace managed organizations'
                                    : undefined,
                          },
                        }}
                      >
                        {isDowngradeOption ? 'Downgrade' : 'Upgrade'} to {plan.name}
                      </ButtonTooltip>
                    )}

                    <div className="border-t my-4" />

                    <ul role="list">
                      {features.map((feature) => (
                        <li
                          key={typeof feature === 'string' ? feature : feature[0]}
                          className="flex py-2"
                        >
                          <div className="w-[12px]">
                            <IconCheck
                              className="h-3 w-3 text-brand translate-y-[2.5px]"
                              aria-hidden="true"
                              strokeWidth={3}
                            />
                          </div>
                          <div>
                            <p className="ml-3 text-xs text-foreground-light">
                              {typeof feature === 'string' ? feature : feature[0]}
                            </p>
                            {isArray(feature) && (
                              <p className="ml-3 text-xs text-foreground-lighter">{feature[1]}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {footer && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-foreground-light text-xs">{footer}</p>
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
        projects={orgProjects}
      />

      <Modal
        loading={isUpdating}
        alignFooter="right"
        visible={selectedTier !== undefined && selectedTier !== 'tier_free'}
        size="xxlarge"
        onCancel={() => setSelectedTier(undefined)}
        onConfirm={onUpdateSubscription}
        dialogOverlayProps={{ className: 'pointer-events-none' }}
        header={`Confirm ${planMeta?.change_type === 'downgrade' ? 'downgrade' : 'upgrade'} to ${subscriptionPlanMeta?.name}`}
      >
        <div>
          {subscriptionPreviewError && (
            <AlertError
              error={subscriptionPreviewError}
              subject="Failed to preview subscription."
            />
          )}
          {subscriptionPreviewIsLoading && (
            <div className="space-y-2 px-4">
              <span className="text-sm">Estimating monthly costs...</span>
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}
          {subscriptionPreviewInitialized && (
            <div>
              <Table
                containerClassName="!bg-transparent !border-collapse"
                className="mt-2 !bg-transparent !border-collapse"
                borderless={true}
                head={[
                  <Table.th
                    key="header-item"
                    className="!text-foreground-muted uppercase sans !bg-transparent"
                  >
                    Item
                  </Table.th>,
                  <Table.th
                    key="header-count"
                    className="text-right pr-4 !text-foreground-muted uppercase sans !bg-transparent"
                  >
                    Usage
                  </Table.th>,
                  <Table.th
                    key="header-unit-price"
                    className="!text-foreground-muted uppercase sans !bg-transparent"
                  >
                    Unit Price
                  </Table.th>,
                  <Table.th
                    key="header-price"
                    className="text-right !text-foreground-muted uppercase sans !bg-transparent"
                  >
                    Cost
                  </Table.th>,
                ]}
                body={
                  <>
                    <Table.tr key={1} className="!bg-transparent">
                      <Table.td className="!border-dotted !border-0 !border-b-2">
                        <div className="flex items-center gap-2 pl-8">
                          <Badge variant="brand">PRO</Badge>
                          <span>Organization plan</span>
                        </div>
                      </Table.td>
                      <Table.td className="text-right pr-4 tabular-nums !border-dotted !border-0 !border-b-2"></Table.td>
                      <Table.td className="text-foreground-muted !border-dotted !border-0 !border-b-2">
                        {formatCurrency(25)} per month
                      </Table.td>
                      <Table.td className="text-right !border-dotted !border-0 !border-b-2">
                        <Badge className="flex gap-1 justify-between text-base">
                          <span className="line-through !text-foreground-lighter">
                            {formatCurrency(0)}
                          </span>
                          <span>{formatCurrency(25)}</span>
                        </Badge>
                      </Table.td>
                    </Table.tr>
                    <Table.tr key={2} className="!bg-transparent">
                      <Table.td>
                        <div className="flex flex-row gap-2 items-center">
                          <Button
                            type="text"
                            className="!px-1"
                            icon={
                              <ChevronRight
                                className={cn(
                                  'transition',
                                  usageFeesExpanded.includes('example item description') &&
                                    'rotate-90'
                                )}
                              />
                            }
                            onClick={() =>
                              usageFeesExpanded.includes('example item description')
                                ? collapseUsageFee('example item description')
                                : expandUsageFee('example item description')
                            }
                          />
                          <Button className="!px-1.5" type="default" icon={<Box />}></Button>
                          <span className="text-foreground-lighter">Project</span>
                          <span className="text-foreground">Project name</span>
                          <Badge className="flex gap-1 justify-between sans uppercase">
                            <span className="line-through text-foreground-lighter">Nano</span>
                            <span className="text-foreground">Micro</span>
                          </Badge>
                        </div>
                      </Table.td>
                      <Table.td></Table.td>
                      <Table.td className="text-foreground-muted">
                        {formatCurrency(10)} per month
                      </Table.td>
                      <Table.td className="text-right">
                        <Badge className="flex gap-1 justify-between text-base">
                          <span className="line-through !text-foreground-lighter">
                            {formatCurrency(0)}
                          </span>
                          <span>{formatCurrency(10)}</span>
                        </Badge>
                      </Table.td>
                    </Table.tr>
                    <Table.tr key={3} className="!bg-surface-200">
                      <Table.td colSpan={4} className="w-full !py-3 !px-6 !text-foreground-muted">
                        Any un-paused projects will be charged for compute hours
                      </Table.td>
                    </Table.tr>
                    <Table.tr key={4} className="!bg-transparent">
                      <Table.td>
                        <div className="flex flex-row gap-2 items-center">
                          <Button
                            type="text"
                            className="!px-1"
                            icon={
                              <ChevronRight
                                className={cn(
                                  'transition',
                                  usageFeesExpanded.includes('example item description') &&
                                    'rotate-90'
                                )}
                              />
                            }
                            onClick={() =>
                              usageFeesExpanded.includes('example item description')
                                ? collapseUsageFee('example item description')
                                : expandUsageFee('example item description')
                            }
                          />
                          <Button className="!px-1.5" type="default" icon={<Box />}></Button>
                          <span className="text-foreground-lighter">Project</span>
                          <span className="text-foreground">Project name</span>
                          <Badge className="flex gap-1 justify-between sans uppercase text-foreground-lighter">
                            <Pause size="14" />
                            <span>Paused</span>
                          </Badge>
                        </div>
                      </Table.td>
                      <Table.td></Table.td>
                      <Table.td className="text-foreground-muted">
                        {formatCurrency(10)} per month
                      </Table.td>
                      <Table.td className="text-right">
                        <Badge className="flex gap-1 justify-between text-base">
                          <span className="line-through !text-foreground-lighter">
                            {formatCurrency(0)}
                          </span>
                          <span className="">{formatCurrency(10)}</span>
                        </Badge>
                      </Table.td>
                    </Table.tr>

                    <Table.tr className="!bg-transparent">
                      <Table.td className="flex flex-col gap-2">
                        <span className="sans !text-foreground-lighter uppercase pl-8">
                          Credits
                        </span>
                        <span className="text-foreground pl-8">Up to $10 Compute credits</span>
                      </Table.td>
                      <Table.td />
                      <Table.td />
                      <Table.td className="text-right align-bottom !text-base">
                        <span className="pr-3">{formatCurrency(-10)}</span>
                      </Table.td>
                    </Table.tr>
                    <Table.tr className="!bg-transparent">
                      <Table.td className="!border-none" />
                      <Table.td className="!border-none" />
                      <Table.td className="!border-dotted !border-0 !border-b-2 !pt-8">
                        Costs before upgrade
                      </Table.td>
                      <Table.td className="text-right !text-base !border-dotted !border-0 !border-b-2 !pt-8">
                        <span className="pr-3">{formatCurrency(0)}</span>
                      </Table.td>
                    </Table.tr>
                    <Table.tr className="!bg-transparent h-1" />
                    <Table.tr className="!bg-transparent ">
                      <Table.td className="!border-none" />
                      <Table.td className="!border-none" />
                      <Table.td className="!border-dotted !border-0 !border-t-2 !pb-8">
                        <div className="flex flex-col ">
                          <span className="text-foreground text-lg font-thin">
                            New monthly cost
                          </span>
                          <span>(Excluding over-usage and credits)</span>
                        </div>
                      </Table.td>
                      <Table.td className="text-right !border-dotted !border-0 !border-t-2 !pb-8 align-top">
                        <span className="pr-3 font-thin text-lg text-foreground">
                          {formatCurrency(35)}
                        </span>
                      </Table.td>
                    </Table.tr>
                  </>
                }
              ></Table>

              {subscription?.plan?.id === 'free' && (
                <Alert_Shadcn_ className="py-6 pl-14 pr-8 rounded-none border-l-0 border-r-0">
                  <div className="flex flex-row gap-4 items-center">
                    <WarningIcon className="w-6 h-6 p-1 bg-foreground" />
                    <div className="flex-1">
                      <p className="text-foreground">
                        Mixing paid and non-paid projects in a single organization is not possible.
                      </p>
                      <p className="text-foreground-lighter">
                        To keep projects on a free plan, move them to another organization.
                      </p>
                    </div>

                    <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                      <Link
                        href="https://supabase.com/docs/guides/platform/project-transfer"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Project transfers docs
                      </Link>
                    </Button>
                  </div>
                </Alert_Shadcn_>
              )}
            </div>
          )}
        </div>

        <Modal.Content>
          {!billingViaPartner ? (
            <div className="pl-8 pr-2 py-4 space-y-4">
              <PaymentMethodSelection
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPaymentMethod={setSelectedPaymentMethod}
              />
              <p className="text-sm pl-1 text-foreground-light">
                When upgrading to Pro, the monthly invoice will be adjusted and your credit card
                will be charged immediately. Changing the plan resets your billing cycle and may
                result in a prorated charge for the previous usage.
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-2">
              <p className="text-sm">
                This organization is billed through our partner{' '}
                {billingPartnerLabel(billingPartner)}.{' '}
                {billingPartner === 'aws' ? (
                  <>The organization's credit balance will be decreased accordingly.</>
                ) : (
                  <>You will be charged by them directly.</>
                )}
              </p>
              {billingViaPartner &&
                billingPartner === 'fly' &&
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
        projects={orgProjects}
        onClose={(success?: boolean) => {
          setShowExitSurvey(false)
          if (success) onClose()
        }}
      />

      <UpgradeSurveyModal
        visible={showUpgradeSurvey}
        originalPlan={originalPlanRef.current}
        subscription={subscription}
        onClose={(success?: boolean) => {
          setShowUpgradeSurvey(false)
          if (success) onClose()
        }}
      />
    </>
  )
}

export default PlanUpdateSidePanel
