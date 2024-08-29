import { Box, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Dispatch, SetStateAction, useState } from 'react'
import { PricingInformation, plans as subscriptionsPlans } from 'shared-data/plans'

import { useQueryClient } from '@tanstack/react-query'
import { billingPartnerLabel } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { organizationKeys } from 'data/organizations/keys'
import { useOrganizationBillingSubscriptionPreview } from 'data/organizations/organization-billing-subscription-preview'
import { ProjectInfo } from 'data/projects/projects-query'
import { OrgSubscriptionData } from 'data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { OrgPlan, SubscriptionTier } from 'data/subscriptions/types'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import toast from 'react-hot-toast'
import { instanceSizeSpecs } from 'shared-data'
import { Alert_Shadcn_, Badge, Button, cn, Modal, WarningIcon } from 'ui'
import PaymentMethodSelection from './PaymentMethodSelection'

type PricingTier = 'tier_free' | 'tier_pro' | 'tier_team' | undefined

const AMOUNT_OF_CREDITS = 10

const OrganizationPlanRow = ({
  previousPlan,
  nextPlan,
}: {
  previousPlan: PricingInformation
  nextPlan: PricingInformation
}) => {
  const previousMonthlyPrice = previousPlan.priceMonthly
  const nextMonthlyPrice = nextPlan.priceMonthly
  // If the price is not a number (enterprise tier), don't render
  if (typeof previousMonthlyPrice !== 'number' || typeof nextMonthlyPrice !== 'number') {
    return null
  }

  return (
    <Table.tr key="organization-plan" className="!bg-transparent">
      <Table.td className="!border-dotted !border-0 !border-b-2">
        <div className="flex items-center gap-2 pl-8">
          <Badge variant="brand" className="uppercase">
            {nextPlan.name}
          </Badge>
          <span>Organization plan</span>
        </div>
      </Table.td>
      <Table.td className="text-right pr-4 tabular-nums !border-dotted !border-0 !border-b-2"></Table.td>
      <Table.td className="text-foreground-muted !border-dotted !border-0 !border-b-2">
        {formatCurrency(nextMonthlyPrice)} per month
      </Table.td>
      <Table.td className="text-right !border-dotted !border-0 !border-b-2">
        <Badge className="flex gap-1 justify-between text-base">
          <span className="line-through !text-foreground-lighter">
            {formatCurrency(previousMonthlyPrice)}
          </span>
          <span>{formatCurrency(nextMonthlyPrice)}</span>
        </Badge>
      </Table.td>
    </Table.tr>
  )
}

const RunningProjectRow = ({
  project,
  previousPlan,
  nextPlan,
  expanded,
  onToggle,
}: {
  project: ProjectInfo
  previousPlan: PricingInformation
  nextPlan: PricingInformation
  expanded: boolean
  onToggle: () => void
}) => {
  // this corrects a situation where the customer upgraded from pro to team but the instance is still nano
  const correctedComputeSize =
    nextPlan.id !== 'tier_free' && project.infra_compute_size === 'nano'
      ? 'micro'
      : project.infra_compute_size!

  let instanceSizeBadge = <span className="text-foreground">{correctedComputeSize}</span>
  let instancePriceBadge = (
    <>
      <span />
      <span>{formatCurrency(instanceSizeSpecs[correctedComputeSize].priceMonthly)}</span>
    </>
  )
  // if the user is upgrading the plan from free
  if (previousPlan.id === 'tier_free' && nextPlan.id !== 'tier_free') {
    instanceSizeBadge = (
      <>
        <span className="line-through text-foreground-lighter">Nano</span>
        <span className="text-foreground">Micro</span>
      </>
    )

    instancePriceBadge = (
      <>
        <span className="line-through !text-foreground-lighter">
          {formatCurrency(instanceSizeSpecs['nano'].priceMonthly)}
        </span>
        <span>{formatCurrency(instanceSizeSpecs['micro'].priceMonthly)}</span>
      </>
    )
  }
  // if the user is downgrading to free (shouldn't happen because downgrading to free is handled by another modal)
  if (previousPlan.id !== 'tier_free' && nextPlan.id === 'tier_free') {
    instanceSizeBadge = (
      <>
        <span className="line-through text-foreground-lighter">{project.infra_compute_size}</span>
        <span className="text-foreground">Nano</span>
      </>
    )

    instancePriceBadge = (
      <>
        <span className="line-through !text-foreground-lighter">
          {formatCurrency(instanceSizeSpecs[project.infra_compute_size!].priceMonthly)}
        </span>
        <span>{formatCurrency(instanceSizeSpecs['nano'].priceMonthly)}</span>
      </>
    )
  }

  return (
    <Table.tr key={project.name} className="!bg-transparent">
      <Table.td>
        <div className="flex flex-row gap-2 items-center">
          <Button
            type="text"
            className="!px-1"
            icon={<ChevronRight className={cn('transition', expanded && 'rotate-90')} />}
            onClick={() => onToggle()}
          />
          <Button className="!px-1.5" type="default" icon={<Box />}></Button>
          <span className="text-foreground-lighter">Project</span>
          <span className="text-foreground">{project.name}</span>
          <Badge className="flex gap-1 justify-between sans uppercase">{instanceSizeBadge}</Badge>
        </div>
      </Table.td>
      <Table.td></Table.td>
      <Table.td />
      <Table.td className="text-right">
        <Badge className="flex gap-1 justify-between text-base">{instancePriceBadge}</Badge>
      </Table.td>
    </Table.tr>
  )
}

const SumRow = ({
  projects,
  previousPlan,
  nextPlan,
}: {
  projects: ProjectInfo[]
  previousPlan: PricingInformation
  nextPlan: PricingInformation
}) => {
  const projectsCost = projects
    .map((project) => {
      // this corrects a situation where the customer upgraded from pro to team but the instance is still nano
      const correctedComputeSize =
        nextPlan.id !== 'tier_free' && project.infra_compute_size === 'nano'
          ? 'micro'
          : project.infra_compute_size!
      return instanceSizeSpecs[correctedComputeSize].priceMonthly
    })
    .reduce((sum, cost) => sum + cost, 0)

  const previousMonthlyPrice = +previousPlan.priceMonthly + projectsCost - AMOUNT_OF_CREDITS
  const nextMonthlyPrice = +nextPlan.priceMonthly + projectsCost - AMOUNT_OF_CREDITS

  return (
    <>
      <Table.tr className="!bg-transparent">
        <Table.td className="!border-none" />
        <Table.td className="!border-none" />
        <Table.td className="!border-dotted !border-0 !border-b-2 !pt-8">
          Costs before upgrade
        </Table.td>
        <Table.td className="text-right !text-base !border-dotted !border-0 !border-b-2 !pt-8">
          <span className="pr-3">{formatCurrency(previousMonthlyPrice)}</span>
        </Table.td>
      </Table.tr>
      {/* empty row to separate the dotted lines */}
      <Table.tr className="!bg-transparent h-0.5" />
      <Table.tr className="!bg-transparent ">
        <Table.td className="!border-none" />
        <Table.td className="!border-none" />
        <Table.td className="!border-dotted !border-0 !border-t-2 !pb-8">
          <div className="flex flex-col ">
            <span className="text-foreground text-lg font-thin">New monthly cost</span>
            <span>(Excluding over-usage and credits)</span>
          </div>
        </Table.td>
        <Table.td className="text-right !border-dotted !border-0 !border-t-2 !pb-8 align-top">
          <span className="pr-3 font-thin text-lg text-foreground">
            {formatCurrency(nextMonthlyPrice)}
          </span>
        </Table.td>
      </Table.tr>
    </>
  )
}

export const UpgradeDowngradeModal = ({
  subscription,
  selectedTier,
  setSelectedTier,
  availablePlans,
  projects,
  onSuccess,
}: {
  selectedTier: PricingTier
  setSelectedTier: Dispatch<SetStateAction<PricingTier>>
  subscription: OrgSubscriptionData | undefined
  availablePlans: OrgPlan[]
  projects: ProjectInfo[]
  onSuccess: () => void
}) => {
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug

  const queryClient = useQueryClient()

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [usageFeesExpanded, setUsageFeesExpanded] = useState<string[]>([])

  const previousPlanMeta = subscriptionsPlans.find(
    (tier) => tier.id === `tier_${subscription?.plan.id}`
  )
  const nextPlanMeta = subscriptionsPlans.find((tier) => tier.id === selectedTier)

  const planMeta = selectedTier
    ? availablePlans.find((p) => p.id === selectedTier.split('tier_')[1])
    : null

  const { mutate: updateOrgSubscription, isLoading: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onSuccess: () => {
        toast.success(`Successfully updated subscription to ${nextPlanMeta?.name}!`)
        onSuccess()
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

  const onUpdateSubscription = async () => {
    if (!slug) return console.error('org slug is required')
    if (!selectedTier) return console.error('Selected plan is required')
    if (!selectedPaymentMethod && !paymentViaInvoice) {
      return toast.error('Please select a payment method')
    }

    if (selectedPaymentMethod) {
      queryClient.setQueriesData(organizationKeys.paymentMethods(slug), (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          defaultPaymentMethodId: selectedPaymentMethod,
          data: prev.data.map((pm: any) => ({
            ...pm,
            is_default: pm.id === selectedPaymentMethod,
          })),
        }
      })
    }

    // If the user is downgrading from team, should have spend cap disabled by default
    const tier =
      subscription?.plan?.id === 'team' && selectedTier === PRICING_TIER_PRODUCT_IDS.PRO
        ? (PRICING_TIER_PRODUCT_IDS.PAYG as SubscriptionTier)
        : selectedTier

    updateOrgSubscription({ slug, tier, paymentMethod: selectedPaymentMethod })
  }

  return (
    <Modal
      loading={isUpdating}
      alignFooter="right"
      visible={selectedTier !== undefined && selectedTier !== 'tier_free'}
      size="xxlarge"
      onCancel={() => setSelectedTier(undefined)}
      onConfirm={onUpdateSubscription}
      dialogOverlayProps={{ className: 'pointer-events-none' }}
      header={`Confirm ${planMeta?.change_type === 'downgrade' ? 'downgrade' : 'upgrade'} to ${nextPlanMeta?.name}`}
    >
      <div>
        {subscriptionPreviewError && (
          <AlertError error={subscriptionPreviewError} subject="Failed to preview subscription." />
        )}
        {subscriptionPreviewIsLoading && (
          <div className="space-y-2 pl-12 pr-8 pt-4">
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
                <Table.th
                  key="header-item"
                  className="!text-foreground-muted uppercase sans !bg-transparent"
                >
                  <span className="pl-8">Item</span>
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
                  <OrganizationPlanRow previousPlan={previousPlanMeta!} nextPlan={nextPlanMeta!} />

                  {projects.map((project) => {
                    const expanded = usageFeesExpanded.includes(project.name)
                    return (
                      <RunningProjectRow
                        project={project}
                        previousPlan={previousPlanMeta!}
                        nextPlan={nextPlanMeta!}
                        expanded={expanded}
                        onToggle={() => {
                          if (expanded) {
                            setUsageFeesExpanded(
                              usageFeesExpanded.filter((item) => item !== project.name)
                            )
                          } else {
                            setUsageFeesExpanded([...usageFeesExpanded, project.name])
                          }
                        }}
                      />
                    )
                  })}
                  {/* <Table.tr key={3} className="!bg-surface-200">
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
                  </Table.tr> */}

                  <Table.tr className="!bg-transparent">
                    <Table.td className="flex flex-col gap-2">
                      <span className="sans !text-foreground-lighter uppercase pl-8">Credits</span>
                      <span className="text-foreground pl-8">Up to $10 Compute credits</span>
                    </Table.td>
                    <Table.td />
                    <Table.td />
                    <Table.td className="text-right align-bottom !text-base">
                      <span className="pr-3">{formatCurrency(-AMOUNT_OF_CREDITS)}</span>
                    </Table.td>
                  </Table.tr>
                  <SumRow
                    projects={projects}
                    previousPlan={previousPlanMeta!}
                    nextPlan={nextPlanMeta!}
                  />
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
              When upgrading to Pro, the monthly invoice will be adjusted and your credit card will
              be charged immediately. Changing the plan resets your billing cycle and may result in
              a prorated charge for the previous usage.
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <p className="text-sm">
              This organization is billed through our partner {billingPartnerLabel(billingPartner)}.{' '}
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
  )
}
