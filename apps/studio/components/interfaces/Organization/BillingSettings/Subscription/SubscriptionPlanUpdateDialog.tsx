import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, PaymentIntentResult, StripeElementsOptions } from '@stripe/stripe-js'
import { getStripeElementsAppearanceOptions } from 'components/interfaces/Billing/Payment/Payment.utils'
import { PaymentConfirmation } from 'components/interfaces/Billing/Payment/PaymentConfirmation'
import type { PaymentMethodElementRef } from 'components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import {
  billingPartnerLabel,
  getPlanChangeType,
} from 'components/interfaces/Billing/Subscription/Subscription.utils'
import AlertError from 'components/ui/AlertError'
import { OrganizationBillingSubscriptionPreviewResponse } from 'data/organizations/organization-billing-subscription-preview'
import { OrgProject } from 'data/projects/org-projects-infinite-query'
import { useConfirmPendingSubscriptionChangeMutation } from 'data/subscriptions/org-subscription-confirm-pending-change'
import { useOrgSubscriptionUpdateMutation } from 'data/subscriptions/org-subscription-update-mutation'
import { SubscriptionTier } from 'data/subscriptions/types'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  DOCS_URL,
  PRICING_TIER_PRODUCT_IDS,
  PROJECT_STATUS,
  STRIPE_PUBLIC_KEY,
} from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import { Check, InfoIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import { toast } from 'sonner'
import { Button, Dialog, DialogContent, Table, TableBody, TableCell, TableRow } from 'ui'
import { Admonition } from 'ui-patterns'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import PaymentMethodSelection from './PaymentMethodSelection'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const PLAN_HEADINGS = {
  tier_pro:
    'the Pro plan to unlock more compute resources, daily backups, no project pausing, and email support whenever you need it',
  tier_team: 'the Team plan for SOC2, SSO, priority support and greater data and log retention',
  default: 'to a new plan',
} as const

type PlanHeadingKey = keyof typeof PLAN_HEADINGS

// Add downgrade headings
const DOWNGRADE_PLAN_HEADINGS = {
  tier_free: 'the Free plan with limited resources and active projects',
  tier_pro: 'the Pro plan',
  default: 'to a lower plan',
} as const

type DowngradePlanHeadingKey = keyof typeof DOWNGRADE_PLAN_HEADINGS

interface Props {
  selectedTier: 'tier_free' | 'tier_pro' | 'tier_team' | undefined
  onClose: () => void
  planMeta: any
  subscriptionPreviewError: any
  subscriptionPreviewIsLoading: boolean
  subscriptionPreviewInitialized: boolean
  subscriptionPreview: OrganizationBillingSubscriptionPreviewResponse | undefined
  subscription: any
  currentPlanMeta: any
  projects: OrgProject[]
}

export const SubscriptionPlanUpdateDialog = ({
  selectedTier,
  onClose,
  planMeta,
  subscriptionPreviewError,
  subscriptionPreviewIsLoading,
  subscriptionPreviewInitialized,
  subscriptionPreview,
  subscription,
  currentPlanMeta,
  projects,
}: Props) => {
  const { resolvedTheme } = useTheme()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string | null>(null)
  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false)
  const paymentMethodSelectionRef = useRef<{
    createPaymentMethod: PaymentMethodElementRef['createPaymentMethod']
  }>(null)

  const billingViaPartner = subscription?.billing_via_partner === true
  const billingPartner = subscription?.billing_partner

  const stripeOptionsConfirm = useMemo(() => {
    return {
      clientSecret: paymentIntentSecret,
      appearance: getStripeElementsAppearanceOptions(resolvedTheme),
    } as StripeElementsOptions
  }, [paymentIntentSecret, resolvedTheme])

  const changeType = useMemo(() => {
    return getPlanChangeType(subscription?.plan?.id, planMeta?.id)
  }, [planMeta, subscription])

  const subscriptionPlanMeta = useMemo(
    () => subscriptionsPlans.find((tier) => tier.id === selectedTier),
    [selectedTier]
  )

  const onSuccessfulPlanChange = () => {
    setPaymentConfirmationLoading(false)
    toast.success(
      `Successfully ${changeType === 'downgrade' ? 'downgraded' : 'upgraded'} subscription to ${subscriptionPlanMeta?.name}!`
    )
    onClose()
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  const { mutate: updateOrgSubscription, isPending: isUpdating } = useOrgSubscriptionUpdateMutation(
    {
      onSuccess: (data) => {
        if (data.pending_payment_intent_secret) {
          setPaymentIntentSecret(data.pending_payment_intent_secret)
          return
        }

        onSuccessfulPlanChange()
      },
      onError: (error) => {
        setPaymentConfirmationLoading(false)
        toast.error(`Unable to update subscription: ${error.message}`)
      },
    }
  )

  const { mutate: confirmPendingSubscriptionChange, isPending: isConfirming } =
    useConfirmPendingSubscriptionChangeMutation({
      onSuccess: () => {
        onSuccessfulPlanChange()
      },
      onError: (error) => {
        toast.error(`Unable to update subscription: ${error.message}`)
      },
    })

  const paymentIntentConfirmed = async (paymentIntentConfirmation: PaymentIntentResult) => {
    // Reset payment intent secret to ensure another attempt works as expected
    setPaymentIntentSecret('')

    if (paymentIntentConfirmation.paymentIntent?.status === 'succeeded') {
      await confirmPendingSubscriptionChange({
        slug: selectedOrganization?.slug,
        payment_intent_id: paymentIntentConfirmation.paymentIntent.id,
      })
    } else {
      setPaymentConfirmationLoading(false)
      // If the payment intent is not successful, we reset the payment method and show an error
      toast.error(`Could not confirm payment. Please try again or use a different card.`)
    }
  }

  const onUpdateSubscription = async () => {
    if (!selectedOrganization?.slug) return console.error('org slug is required')
    if (!selectedTier) return console.error('Selected plan is required')

    setPaymentConfirmationLoading(true)

    const result = await paymentMethodSelectionRef.current?.createPaymentMethod()
    if (result) {
      setSelectedPaymentMethod(result.paymentMethod.id)
    } else {
      setPaymentConfirmationLoading(false)
    }

    if (!result && subscription?.payment_method_type !== 'invoice' && changeType === 'upgrade') {
      return
    }

    // If the user is downgrading from team, should have spend cap disabled by default
    const tier =
      subscription?.plan?.id === 'team' && selectedTier === PRICING_TIER_PRODUCT_IDS.PRO
        ? (PRICING_TIER_PRODUCT_IDS.PAYG as SubscriptionTier)
        : selectedTier

    updateOrgSubscription({
      slug: selectedOrganization?.slug,
      tier,
      paymentMethod: result?.paymentMethod?.id,
      address: result?.address,
      tax_id: result?.taxId ?? undefined,
      billing_name: result?.customerName ?? undefined,
    })
  }

  const features = subscriptionPlanMeta?.features || []
  const topFeatures = features

  // Get current plan features for downgrade comparison
  const currentPlanFeatures = currentPlanMeta?.features || []

  // Features that will be lost when downgrading
  const featuresToLose =
    changeType === 'downgrade'
      ? currentPlanFeatures.filter((feature: string | [string, ...any[]]) => {
          const featureStr = typeof feature === 'string' ? feature : feature[0]
          // Check if this feature exists in the new plan
          return !topFeatures.some((newFeature: string | string[]) => {
            const newFeatureStr = typeof newFeature === 'string' ? newFeature : newFeature[0]
            return newFeatureStr === featureStr
          })
        })
      : []

  // Calculate remaining days in current billing cycle
  const now = Math.floor(Date.now() / 1000) // current time in seconds
  const remainingSeconds = subscription?.current_period_end - now
  const totalSeconds = subscription?.current_period_end - subscription?.current_period_start
  const remainingRatio = remainingSeconds / totalSeconds

  // Calculate prorated credit for current plan
  const currentPlanMonthlyPrice = currentPlanMeta?.price ?? 0
  const proratedCredit = currentPlanMonthlyPrice * remainingRatio

  // Calculate new plan cost
  const newPlanCost = Number(subscriptionPlanMeta?.priceMonthly) ?? 0

  const customerBalance = ((subscription?.customer_balance ?? 0) / 100) * -1

  // Calculate total charge (new plan - prorated credit)
  const totalCharge = Math.max(0, newPlanCost - proratedCredit - customerBalance)

  return (
    <Dialog
      open={selectedTier !== undefined && selectedTier !== 'tier_free'}
      onOpenChange={(open) => {
        // Do not allow closing mid-change
        if (isUpdating || paymentConfirmationLoading || isConfirming) {
          return
        }
        if (!open) onClose()
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        size="xlarge"
        className="p-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 h-full items-stretch">
          {/* Left Column */}
          <div className="p-8 pb-8 flex flex-col xl:col-span-3">
            <div className="flex-1">
              <div>
                {!billingViaPartner && subscriptionPreview != null && changeType === 'upgrade' && (
                  <div className="space-y-2 mb-4">
                    <PaymentMethodSelection
                      ref={paymentMethodSelectionRef}
                      selectedPaymentMethod={selectedPaymentMethod}
                      onSelectPaymentMethod={(pm) => setSelectedPaymentMethod(pm)}
                      readOnly={paymentConfirmationLoading || isConfirming || isUpdating}
                    />
                  </div>
                )}

                {billingViaPartner && (
                  <div className="mb-4">
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
                          Your organization will be downgraded at the end of your current billing
                          cycle.
                        </p>
                      )}
                  </div>
                )}
              </div>

              {subscriptionPreviewIsLoading && (
                <div className="space-y-2 mb-4 mt-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              )}
              {subscriptionPreviewInitialized && (
                <>
                  <div className="mt-2 mb-4 text-foreground-light text-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-muted text-foreground">
                      <div className="py-2 pl-0">Charge today</div>
                      <div className="py-2 pr-0 text-right" translate="no">
                        {formatCurrency(totalCharge)}
                        {subscription?.plan?.id !== 'free' && (
                          <>
                            {' '}
                            <Link
                              href={`/org/${selectedOrganization?.slug}/billing#breakdown`}
                              className="text-sm text-brand hover:text-brand-600 transition"
                              target="_blank"
                            >
                              + current spend
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {subscription?.plan?.id !== 'free' && (
                      <div className="flex items-center justify-between gap-2 border-b border-muted text-xs">
                        <div className="py-2 pl-0 flex items-center gap-1">
                          <span>Unused Time on {subscription?.plan?.name} Plan</span>
                          <InfoTooltip className="max-w-sm">
                            Your previous plan was charged upfront, so a plan change will prorate
                            any unused time in credits. If the prorated credits exceed the new plan
                            charge, the excessive credits are added to your organization for future
                            use.
                          </InfoTooltip>
                        </div>
                        <div className="py-2 pr-0 text-right" translate="no">
                          -{formatCurrency(proratedCredit)}
                        </div>
                      </div>
                    )}

                    {/* Ignore rare case with negative balance (debt) */}
                    {customerBalance > 0 && (
                      <div className="flex items-center justify-between gap-2 border-b border-muted text-xs">
                        <div className="py-2 pl-0 flex items-center gap-1">
                          <span>Credits</span>
                          <InfoTooltip>
                            Credits will be used first before charging your card.
                          </InfoTooltip>
                        </div>
                        <div className="py-2 pr-0 text-right" translate="no">
                          {formatCurrency(customerBalance)}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 text-foreground-lighter text-xs">
                      <div className="py-2 pl-0 flex items-center gap-1">
                        <span>Monthly invoice estimate</span>
                        <InfoTooltip side="right">
                          <div className="w-[520px] p-6">
                            <h3 className="font-medium mb-2">Your new monthly invoice</h3>
                            <p className="prose text-xs mb-2">
                              First project included. Additional projects cost{' '}
                              <span translate="no">$10</span>+/month regardless of activity.{' '}
                              <Link
                                href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
                                target="_blank"
                              >
                                Learn more
                              </Link>
                              .
                            </p>

                            {subscriptionPreviewError && (
                              <AlertError
                                error={subscriptionPreviewError}
                                subject="Failed to preview subscription."
                              />
                            )}

                            {subscriptionPreviewIsLoading && (
                              <div className="space-y-2 p-6">
                                <span className="text-sm">Estimating monthly costs...</span>
                                <ShimmeringLoader />
                                <ShimmeringLoader className="w-3/4" />
                                <ShimmeringLoader className="w-1/2" />
                              </div>
                            )}

                            {subscriptionPreviewInitialized && (
                              <>
                                <Table className="[&_tr:last-child]:border-t font-mono text-xs">
                                  <TableBody>
                                    {/* Non-compute items and Projects list */}
                                    {(() => {
                                      // Combine all compute-related projects
                                      const computeItems =
                                        subscriptionPreview?.breakdown?.filter(
                                          (item) =>
                                            item.description?.toLowerCase().includes('compute') &&
                                            item.breakdown &&
                                            item.breakdown.length > 0
                                        ) || []

                                      const computeCreditsItem =
                                        subscriptionPreview?.breakdown?.find((item) =>
                                          item.description.startsWith('Compute Credits')
                                        ) ?? null

                                      const planItem = subscriptionPreview?.breakdown?.find(
                                        (item) => item.description?.toLowerCase().includes('plan')
                                      )

                                      const allProjects = computeItems.flatMap((item) =>
                                        (item.breakdown || []).map((project) => ({
                                          ...project,
                                          computeType: item.description,
                                          computeCosts: Math.round(
                                            item.total_price / item.breakdown!.length
                                          ),
                                        }))
                                      )

                                      const otherItems =
                                        subscriptionPreview?.breakdown?.filter(
                                          (item) =>
                                            !item.description?.toLowerCase().includes('compute') &&
                                            !item.description?.toLowerCase().includes('plan')
                                        ) || []

                                      const content = (
                                        <>
                                          {/* Combined projects section */}
                                          {allProjects.length > 0 && (
                                            <>
                                              <TableRow className="text-foreground-light">
                                                <TableCell className="!py-2 px-0">
                                                  {planItem?.description}
                                                </TableCell>
                                                <TableCell
                                                  className="text-right py-2 px-0"
                                                  translate="no"
                                                >
                                                  {formatCurrency(planItem?.total_price)}
                                                </TableCell>
                                              </TableRow>

                                              <TableRow className="text-foreground-light">
                                                <TableCell className="!py-2 px-0 flex items-center gap-1">
                                                  <span>Compute</span>
                                                </TableCell>
                                                <TableCell
                                                  className="text-right py-2 px-0"
                                                  translate="no"
                                                >
                                                  {formatCurrency(
                                                    computeItems.reduce(
                                                      (sum: number, item) => sum + item.total_price,
                                                      0
                                                    ) + (computeCreditsItem?.total_price ?? 0)
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                              {/* Show first 3 projects */}
                                              {allProjects.map((project) => (
                                                <TableRow
                                                  key={project.project_ref}
                                                  className="text-foreground-light"
                                                >
                                                  <TableCell
                                                    className="!py-2 px-0 pl-6"
                                                    translate="no"
                                                  >
                                                    {project.project_name} ({project.computeType}) |{' '}
                                                    {formatCurrency(project.computeCosts)}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                              {computeCreditsItem && (
                                                <TableRow className="text-foreground-light">
                                                  <TableCell
                                                    className="!py-2 px-0 pl-6"
                                                    translate="no"
                                                  >
                                                    Compute Credits |{' '}
                                                    {formatCurrency(computeCreditsItem.total_price)}
                                                  </TableCell>
                                                </TableRow>
                                              )}
                                            </>
                                          )}

                                          {/* Non-compute items */}
                                          {otherItems.map((item) => (
                                            <TableRow
                                              key={item.description}
                                              className="text-foreground-light"
                                            >
                                              <TableCell className="text-xs py-2 px-0">
                                                <div className="flex items-center gap-1">
                                                  <span>{item.description ?? 'Unknown'}</span>
                                                  {item.breakdown && item.breakdown.length > 0 && (
                                                    <InfoTooltip className="max-w-sm">
                                                      <p>Projects using {item.description}:</p>
                                                      <ul className="ml-6 list-disc">
                                                        {item.breakdown.map((breakdown) => (
                                                          <li
                                                            key={`${item.description}-breakdown-${breakdown.project_ref}`}
                                                          >
                                                            {breakdown.project_name}
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    </InfoTooltip>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell
                                                className="text-right text-xs py-2 px-0"
                                                translate="no"
                                              >
                                                {formatCurrency(item.total_price)}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </>
                                      )
                                      return content
                                    })()}

                                    <TableRow>
                                      <TableCell className="font-medium py-2 px-0">
                                        Total per month (excluding other usage)
                                      </TableCell>
                                      <TableCell
                                        className="text-right font-medium py-2 px-0"
                                        translate="no"
                                      >
                                        {formatCurrency(
                                          Math.round(
                                            subscriptionPreview?.breakdown?.reduce(
                                              (prev, cur) => prev + cur.total_price,
                                              0
                                            ) ?? 0
                                          ) ?? 0
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </>
                            )}
                          </div>
                        </InfoTooltip>
                      </div>
                      <div className="py-2 pr-0 text-right" translate="no">
                        {formatCurrency(
                          Math.round(
                            subscriptionPreview?.breakdown.reduce(
                              (prev: number, cur) => prev + cur.total_price,
                              0
                            ) ?? 0
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4">
              {projects.filter(
                (it) =>
                  it.status === PROJECT_STATUS.ACTIVE_HEALTHY ||
                  it.status === PROJECT_STATUS.COMING_UP
              ).length === 5 &&
                subscriptionPreview?.plan_change_type !== 'downgrade' && (
                  <div className="pb-2">
                    <Admonition title="Empty organization" type="warning">
                      This organization has no active projects. Did you select the correct
                      organization?
                    </Admonition>
                  </div>
                )}

              {projects.filter(
                (it) =>
                  it.status === PROJECT_STATUS.ACTIVE_HEALTHY ||
                  it.status === PROJECT_STATUS.COMING_UP
              ).length === 1 &&
                subscriptionPlanMeta?.planId === 'pro' &&
                changeType === 'upgrade' && (
                  <div className="pb-2">
                    <Admonition type="note">
                      <div className="text-sm prose">
                        First project included. Additional projects cost{' '}
                        <span translate="no">$10</span>+/month regardless of activity.{' '}
                        <Link
                          href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
                          target="_blank"
                          className="underline"
                        >
                          Learn more
                        </Link>
                      </div>
                    </Admonition>
                  </div>
                )}

              <div className="flex space-x-2">
                <Button
                  loading={isUpdating || paymentConfirmationLoading || isConfirming}
                  disabled={subscriptionPreviewIsLoading}
                  type="primary"
                  onClick={onUpdateSubscription}
                  className="flex-1"
                  size="small"
                >
                  Confirm {changeType === 'downgrade' ? 'downgrade' : 'upgrade'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-surface-100 p-8 flex flex-col border-l xl:col-span-2">
            <h3 className="mb-8">
              {changeType === 'downgrade' ? 'Downgrade' : 'Upgrade'}{' '}
              <span className="font-bold">{selectedOrganization?.name}</span> to{' '}
              {changeType === 'downgrade'
                ? DOWNGRADE_PLAN_HEADINGS[(selectedTier as DowngradePlanHeadingKey) || 'default']
                : PLAN_HEADINGS[(selectedTier as PlanHeadingKey) || 'default']}
            </h3>
            {changeType === 'downgrade'
              ? featuresToLose.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm mb-1">Features you'll lose</h3>
                    <p className="text-xs text-foreground-light mb-4">
                      Please review carefully before downgrading.
                    </p>
                    <div className="space-y-2 mb-4 text-foreground-light">
                      {featuresToLose.map((feature: string | [string, ...any[]]) => (
                        <div
                          key={typeof feature === 'string' ? feature : feature[0]}
                          className="flex items-center gap-2"
                        >
                          <div className="w-4">
                            <InfoIcon className="h-3 w-3 text-amber-900" strokeWidth={3} />
                          </div>
                          <p className="text-sm">
                            {typeof feature === 'string' ? feature : feature[0]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              : topFeatures.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm mb-4">Upgrade features</h3>

                    <div className="space-y-2 mb-4 text-foreground-light">
                      {topFeatures.map((feature: string | string[]) => (
                        <div
                          key={typeof feature === 'string' ? feature : feature[0]}
                          className="flex items-center gap-2"
                        >
                          <div className="w-4">
                            <Check className="h-3 w-3 text-brand" strokeWidth={3} />
                          </div>
                          <div className="text-sm">
                            <p>{typeof feature === 'string' ? feature : feature[0]}</p>
                            {Array.isArray(feature) && feature.length > 1 && (
                              <p className="text-foreground-lighter text-xs">{feature[1]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
          </div>
        </div>

        {stripePromise && paymentIntentSecret && (
          <Elements stripe={stripePromise} options={stripeOptionsConfirm}>
            <PaymentConfirmation
              paymentIntentSecret={paymentIntentSecret}
              onPaymentIntentConfirm={(paymentIntentConfirmation) =>
                paymentIntentConfirmed(paymentIntentConfirmation)
              }
              onLoadingChange={(loading) => setPaymentConfirmationLoading(loading)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}
