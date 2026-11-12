import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, PaymentIntentResult, StripeElementsOptions } from '@stripe/stripe-js'
import { useParams } from 'common'
import { InfoIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useRef, useState } from 'react'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import { toast } from 'sonner'
import { Badge, Button } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DueTodayRow } from './DueTodayRow'
import PaymentMethodSelection from './PaymentMethodSelection'
import { PlanChangeBill } from './PlanChangeBill'
import { PlanChangeNotes } from './PlanChangeNotes'
import {
  getDueTodayBreakdown,
  getPausedProjects,
  getPlanChangeSummary,
} from './PlanChangeSummary.utils'
import { FullScreenPanel } from './PlanUpdatePanelShell'
import { hasPlanBenefits, PlanUpgradeBenefits } from './PlanUpgradeBenefits'
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
import { PRICING_TIER_PRODUCT_IDS, STRIPE_PUBLIC_KEY } from '@/lib/constants'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

interface Props {
  selectedTier: 'tier_free' | 'tier_pro' | 'tier_team' | undefined
  onClose: () => void
  /** Called after the subscription update succeeds, in addition to onClose. */
  onSuccess?: () => void
  planMeta?: OrgPlan | null
  currentPlanMeta?: Partial<OrgPlan> & { features: (string | string[])[] }
  subscriptionPreviewQueryResult: OrganizationBillingSubscriptionPreviewQueryResult
  projects: OrgProject[]
  onAddressChange?: (address: CustomerAddress) => void
  onTaxIdChange?: (taxId: CustomerTaxId | null) => void
  useAsDefaultBillingAddress: boolean
  onUseAsDefaultBillingAddressChange: (useAsDefault: boolean) => void
}

export const SubscriptionPlanUpdateView = ({
  selectedTier,
  onClose,
  onSuccess,
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

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
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
    onSuccess?.()
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

  const isChangeInProgress = isUpdating || paymentConfirmationLoading || isConfirming
  const isDowngrade = changeType === 'downgrade'

  const currentPlanId = subscription?.plan?.id
  const currentPlanName = subscription?.plan?.name
  const newPlanName = planMeta?.name ?? subscriptionPlanMeta?.name ?? 'new'

  /**
   * An org already paying for a plan knows how compute bills and may run hundreds of
   * projects, so the bill collapses to a single compute line and drops the explainers.
   */
  const isCondensed = currentPlanId !== 'free'

  const summary = useMemo(
    () =>
      getPlanChangeSummary(subscriptionPreview, {
        // `priceMonthly` is typed loosely in shared-data, hence the Number()
        fallbackPlanAmount: planMeta?.price ?? Number(subscriptionPlanMeta?.priceMonthly ?? 0),
      }),
    [subscriptionPreview, planMeta?.price, subscriptionPlanMeta?.priceMonthly]
  )

  const dueToday = useMemo(
    () => getDueTodayBreakdown(subscriptionPreview, { planAmount: summary.planAmount }),
    [subscriptionPreview, summary.planAmount]
  )

  const pausedProjects = useMemo(() => getPausedProjects(projects), [projects])

  // Features the org gives up, shown in place of the new plan's benefits on a downgrade.
  const featuresToLose = useMemo(() => {
    if (!isDowngrade) return []
    const newFeatures = subscriptionPlanMeta?.features ?? []
    return (currentPlanMeta?.features ?? []).filter((feature) => {
      const label = typeof feature === 'string' ? feature : feature[0]
      return !newFeatures.some(
        (newFeature) => (typeof newFeature === 'string' ? newFeature : newFeature[0]) === label
      )
    })
  }, [isDowngrade, currentPlanMeta?.features, subscriptionPlanMeta?.features])

  const exampleProjectRef = summary.computeProjects[0]?.ref ?? projects[0]?.ref
  const hasProjectsToLeaveBehind = summary.computeProjects.length > 1 || pausedProjects.length > 0
  const showPaymentMethodSelection =
    !billingViaPartner && subscriptionPreviewInitialized && changeType === 'upgrade'

  const confirmLabel = isDowngrade ? `Downgrade to ${newPlanName}` : `Upgrade to ${newPlanName}`

  return (
    <FullScreenPanel
      onBack={onClose}
      backDisabled={isChangeInProgress}
      contentClassName="max-w-6xl"
    >
      <div className="w-full overflow-hidden rounded-md border bg-surface-100">
        <div className="grid grid-cols-1 items-stretch md:grid-cols-2 xl:grid-cols-5">
          {/* Billing — first in the DOM so it stacks above the benefits on narrow screens */}
          <div className="flex flex-col gap-6 p-8 xl:col-span-3">
            <div>
              <h1 className="sr-only">
                {`${isDowngrade ? 'Downgrade' : 'Upgrade'} ${selectedOrganization?.name ?? 'organization'} to the ${newPlanName} plan`}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-light" translate="no">
                  {selectedOrganization?.name}
                </span>
                {currentPlanName && <Badge>{currentPlanName} Plan</Badge>}
              </div>
            </div>

            {subscriptionPreviewIsLoading && (
              <div className="space-y-2">
                <ShimmeringLoader className="h-20" />
                <ShimmeringLoader className="h-20 w-3/4" />
                <ShimmeringLoader className="h-20 w-1/2" />
              </div>
            )}

            {subscriptionPreviewInitialized && (
              <div className={subscriptionPreviewIsFetching ? 'opacity-50 transition-opacity' : ''}>
                <PlanChangeBill
                  planName={newPlanName}
                  summary={summary}
                  pausedProjects={pausedProjects}
                  isCondensed={isCondensed}
                  currentPlan={
                    isCondensed && currentPlanName
                      ? { name: currentPlanName, price: currentPlanMeta?.price ?? 0 }
                      : undefined
                  }
                />
              </div>
            )}

            {!isCondensed && subscriptionPreviewInitialized && (
              <PlanChangeNotes
                exampleProjectRef={exampleProjectRef}
                hasProjectsToLeaveBehind={hasProjectsToLeaveBehind}
              />
            )}

            {billingViaPartner && (
              <p className="text-sm text-foreground-light">
                This organization is billed through our partner{' '}
                {billingPartnerLabel(billingPartner)}.{' '}
                {/* @ts-ignore [Joshen] Might be API types issue */}
                {billingPartner === 'aws' ? (
                  <>The organization's credit balance will be decreased accordingly.</>
                ) : (
                  <>You will be charged by them directly.</>
                )}
              </p>
            )}

            {showPaymentMethodSelection && (
              <div className="border-t pt-6">
                <PaymentMethodSelection
                  ref={paymentMethodSelectionRef}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onSelectPaymentMethod={(pm) => setSelectedPaymentMethod(pm)}
                  readOnly={isChangeInProgress}
                  onAddressChange={onAddressChange}
                  onTaxIdChange={onTaxIdChange}
                  useAsDefaultBillingAddress={useAsDefaultBillingAddress}
                  onUseAsDefaultBillingAddressChange={onUseAsDefaultBillingAddressChange}
                  onClose={onClose}
                />
              </div>
            )}

            {subscriptionPreviewInitialized && !isDowngrade && (
              <DueTodayRow
                breakdown={dueToday}
                planName={newPlanName}
                currentPlanName={currentPlanName}
              />
            )}

            <Button
              loading={isChangeInProgress}
              disabled={subscriptionPreviewIsLoading || subscriptionPreviewIsFetching}
              variant="primary"
              onClick={onUpdateSubscription}
              size="medium"
              block
            >
              {confirmLabel}
            </Button>
          </div>

          {/* Benefits */}
          <div className="border-t bg-surface-200 p-8 md:border-l md:border-t-0 xl:col-span-2">
            {isDowngrade ? (
              <div>
                <h2 className="mb-1 text-sm text-foreground">Features you'll lose</h2>
                <p className="mb-4 text-xs text-foreground-light">
                  Please review carefully before downgrading.
                </p>
                <ul className="space-y-2">
                  {featuresToLose.map((feature) => (
                    <li
                      key={typeof feature === 'string' ? feature : feature[0]}
                      className="flex items-start gap-3"
                    >
                      <InfoIcon
                        size={14}
                        strokeWidth={3}
                        className="mt-1 shrink-0 text-warning-600"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-foreground-light">
                        {typeof feature === 'string' ? feature : feature[0]}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              hasPlanBenefits(selectedTier) && <PlanUpgradeBenefits tier={selectedTier} />
            )}
          </div>
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
    </FullScreenPanel>
  )
}
