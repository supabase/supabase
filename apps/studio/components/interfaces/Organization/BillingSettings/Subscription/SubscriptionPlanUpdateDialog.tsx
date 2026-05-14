import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, PaymentIntentResult, StripeElementsOptions } from '@stripe/stripe-js'
import { useParams } from 'common'
import { Check, InfoIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import { toast } from 'sonner'
import { Button, cn, Dialog, DialogContent } from 'ui'
import { Admonition } from 'ui-patterns'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { InvoiceEstimateTooltip } from './InvoiceEstimateTooltip'
import PaymentMethodSelection from './PaymentMethodSelection'
import { getStripeElementsAppearanceOptions } from '@/components/interfaces/Billing/Payment/Payment.utils'
import { PaymentConfirmation } from '@/components/interfaces/Billing/Payment/PaymentConfirmation'
import type { PaymentMethodElementRef } from '@/components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import {
  billingPartnerLabel,
  getPlanChangeType,
} from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { type OrganizationBillingSubscriptionPreviewQueryResult } from '@/data/organizations/organization-billing-subscription-preview'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { useConfirmPendingSubscriptionChangeMutation } from '@/data/subscriptions/org-subscription-confirm-pending-change'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from '@/data/subscriptions/org-subscription-update-mutation'
import { OrgPlan, SubscriptionTier } from '@/data/subscriptions/types'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  DOCS_URL,
  PRICING_TIER_PRODUCT_IDS,
  PROJECT_STATUS,
  STRIPE_PUBLIC_KEY,
} from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'

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

type BreakdownItem =
  | { type: 'amount'; label: string; amount: number; tooltip?: string }
  | { type: 'notice'; label: string }

interface Props {
  selectedTier: 'tier_free' | 'tier_pro' | 'tier_team' | undefined
  onClose: () => void
  planMeta?: OrgPlan | null
  currentPlanMeta?: Partial<OrgPlan> & { features: (string | string[])[] }
  subscriptionPreviewQueryResult: OrganizationBillingSubscriptionPreviewQueryResult
  projects: OrgProject[]
  onAddressChange?: (address: CustomerAddress) => void
  onTaxIdChange?: (taxId: CustomerTaxId | null) => void
  useAsDefaultBillingAddress: boolean
  onUseAsDefaultBillingAddressChange: (useAsDefault: boolean) => void
}

export const SubscriptionPlanUpdateDialog = ({
  selectedTier,
  onClose,
  planMeta,
  subscriptionPreviewQueryResult,
  currentPlanMeta,
  projects,
  onAddressChange,
  onTaxIdChange,
  useAsDefaultBillingAddress,
  onUseAsDefaultBillingAddressChange,
}: Props) => {
  const { slug } = useParams()
  const { resolvedTheme } = useTheme()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>()
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string | null>(null)
  const [paymentConfirmationLoading, setPaymentConfirmationLoading] = useState(false)
  const paymentMethodSelectionRef = useRef<{
    createPaymentMethod: PaymentMethodElementRef['createPaymentMethod']
    validateBillingProfile: () => Promise<boolean>
  }>(null)

  const {
    data: subscriptionPreview,
    isPending: subscriptionPreviewIsLoading,
    isFetching: subscriptionPreviewIsFetching,
    isSuccess: subscriptionPreviewInitialized,
  } = subscriptionPreviewQueryResult

  const { data: subscription } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })
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

    if (paymentMethodSelectionRef.current) {
      const isValid = await paymentMethodSelectionRef.current.validateBillingProfile()
      if (!isValid) {
        setPaymentConfirmationLoading(false)
        return
      }
    }

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
      ? currentPlanFeatures.filter((feature) => {
          const featureStr = typeof feature === 'string' ? feature : feature[0]
          // Check if this feature exists in the new plan
          return !topFeatures.some((newFeature: string | string[]) => {
            const newFeatureStr = typeof newFeature === 'string' ? newFeature : newFeature[0]
            return newFeatureStr === featureStr
          })
        })
      : []

  const upfrontCharge = subscriptionPreview?.upfront_charge

  const proratedCredit = upfrontCharge?.prorated_credit ?? 0
  const customerBalance = upfrontCharge?.customer_balance ?? 0
  const totalCharge = upfrontCharge?.total ?? 0
  const tax = upfrontCharge?.tax
  const taxableAmount = upfrontCharge?.taxable_amount
  const taxStatus = upfrontCharge?.tax_status
  const hasTax = taxStatus === 'calculated' && (tax?.tax_amount ?? 0) > 0
  const taxFailed = taxStatus === 'failed'

  const newPlanCost = Number(subscriptionPlanMeta?.priceMonthly) || 0

  const currentPlanId = subscription?.plan?.id
  const currentPlanName = subscription?.plan?.name

  // Derives the itemized charge breakdown rows shown above "Charge today".
  // Example: Pro -> Team upgrade with proration, tax, and credits:
  //   Team Plan            $25.00
  //   Tax (10%)             $1.67
  //   Subtotal             $26.67
  //   Unused Time on Pro   -$8.33
  //   Credits              -$5.00
  //   ─────────────────────────────
  //   Charge today         $13.34
  const breakdownItems = useMemo(() => {
    const items: BreakdownItem[] = []

    if (hasTax && tax) {
      items.push({
        type: 'amount',
        label: `Tax (${tax.tax_rate_percentage}%)`,
        amount: tax.tax_amount,
      })
      if (taxableAmount !== newPlanCost) {
        items.push({ type: 'amount', label: 'Subtotal', amount: taxableAmount! })
      }
    }

    if (taxFailed) {
      items.push({
        type: 'notice',
        label: 'Tax could not be estimated and may be applied separately',
      })
    }

    if (currentPlanId !== 'free' && proratedCredit > 0) {
      items.push({
        type: 'amount',
        label: `Unused Time on ${currentPlanName} Plan`,
        amount: -proratedCredit,
        tooltip:
          'Your previous plan was charged upfront, so a plan change will prorate any unused time in credits. If the prorated credits exceed the new plan charge, the excessive credits are added to your organization for future use.' +
          (hasTax ? ' Includes proportional tax if applicable.' : ''),
      })
    }

    if (customerBalance > 0) {
      items.push({
        type: 'amount',
        label: 'Credits',
        amount: -customerBalance,
        tooltip: 'Credits will be used first before charging your card.',
      })
    }

    // Prepend the plan cost row when there are adjustment items to show
    if (items.length > 0) {
      items.unshift({
        type: 'amount',
        label: `${subscriptionPlanMeta?.name} Plan`,
        amount: newPlanCost,
      })
    }

    return items
  }, [
    currentPlanId,
    currentPlanName,
    proratedCredit,
    hasTax,
    tax,
    taxableAmount,
    newPlanCost,
    taxFailed,
    customerBalance,
    subscriptionPlanMeta?.name,
  ])

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
                {!billingViaPartner &&
                  subscriptionPreviewInitialized &&
                  changeType === 'upgrade' && (
                    <div className="space-y-2 mb-4">
                      <PaymentMethodSelection
                        ref={paymentMethodSelectionRef}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onSelectPaymentMethod={(pm) => setSelectedPaymentMethod(pm)}
                        readOnly={paymentConfirmationLoading || isConfirming || isUpdating}
                        onAddressChange={onAddressChange}
                        onTaxIdChange={onTaxIdChange}
                        useAsDefaultBillingAddress={useAsDefaultBillingAddress}
                        onUseAsDefaultBillingAddressChange={onUseAsDefaultBillingAddressChange}
                      />
                    </div>
                  )}

                {billingViaPartner && (
                  <div className="mb-4">
                    <p className="text-sm">
                      This organization is billed through our partner{' '}
                      {billingPartnerLabel(billingPartner)}.{' '}
                      {/* @ts-ignore [Joshen] Might be API types issue */}
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
                  <div
                    className={cn(
                      'mt-2 mb-4 text-foreground-light text-sm transition-opacity',
                      subscriptionPreviewIsFetching && 'opacity-50'
                    )}
                  >
                    {breakdownItems.map((item, i) =>
                      item.type === 'amount' ? (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 border-b border-muted text-xs"
                        >
                          <div className="py-2 pl-0 flex items-center gap-1">
                            <span>{item.label}</span>
                            {item.tooltip && (
                              <InfoTooltip className="max-w-sm">{item.tooltip}</InfoTooltip>
                            )}
                          </div>
                          <div className="py-2 pr-0 text-right tabular-nums" translate="no">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 border-b border-muted text-xs"
                        >
                          <div className="py-2 pl-0 text-foreground-lighter">{item.label}</div>
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between gap-2 border-b border-muted text-foreground">
                      <div className="py-2 pl-0">Charge today</div>
                      <div className="py-2 pr-0 text-right tabular-nums" translate="no">
                        {formatCurrency(totalCharge)}
                        {currentPlanId !== 'free' && (
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

                    <div className="flex items-center justify-between gap-2 text-foreground-lighter text-xs mt-4">
                      <div className="py-2 pl-0 flex items-center gap-1">
                        <span>Monthly invoice estimate</span>
                        <InvoiceEstimateTooltip
                          subscriptionPreviewQueryResult={subscriptionPreviewQueryResult}
                        />
                      </div>
                      <div className="py-2 pr-0 text-right tabular-nums" translate="no">
                        {formatCurrency(
                          subscriptionPreview?.breakdown.reduce(
                            (prev: number, cur) => prev + cur.total_price,
                            0
                          ) ?? 0
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
              ).length === 0 &&
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
                  disabled={subscriptionPreviewIsLoading || subscriptionPreviewIsFetching}
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
                      {featuresToLose.map((feature) => (
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
