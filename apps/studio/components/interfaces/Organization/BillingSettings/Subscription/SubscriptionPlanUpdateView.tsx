import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, PaymentIntentResult, StripeElementsOptions } from '@stripe/stripe-js'
import { useParams } from 'common'
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
import { PlanMinusIcon } from './PlanIcons'
import { FullScreenPanel } from './PlanUpdatePanelShell'
import { getStripeElementsAppearanceOptions } from '@/components/interfaces/Billing/Payment/Payment.utils'
import { PaymentConfirmation } from '@/components/interfaces/Billing/Payment/PaymentConfirmation'
import type { PaymentMethodElementRef } from '@/components/interfaces/Billing/Payment/PaymentMethods/NewPaymentMethodElement'
import {
  billingPartnerLabel,
  getPlanChangeType,
  type PlanChangeType,
} from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { AlertError } from '@/components/ui/AlertError'
import { type OrganizationBillingSubscriptionPreviewQueryResult } from '@/data/organizations/organization-billing-subscription-preview'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { useConfirmPendingSubscriptionChangeMutation } from '@/data/subscriptions/org-subscription-confirm-pending-change'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useOrgSubscriptionUpdateMutation } from '@/data/subscriptions/org-subscription-update-mutation'
import { OrgPlan, SubscriptionTier } from '@/data/subscriptions/types'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { PRICING_TIER_PRODUCT_IDS, STRIPE_PUBLIC_KEY } from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'
import { useTrack } from '@/lib/telemetry/track'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

interface Props {
  selectedTier: 'tier_free' | 'tier_pro' | 'tier_team' | undefined
  onClose: () => void
  /** Called after the subscription update succeeds, in addition to onClose. */
  onSuccess?: (result: { changeType: PlanChangeType }) => void
  planMeta?: OrgPlan | null
  currentPlanMeta?: Partial<OrgPlan> & { features: (string | string[])[] }
  subscriptionPreviewQueryResult: OrganizationBillingSubscriptionPreviewQueryResult
  projects: OrgProject[]
  /** Receives null when there is no address to estimate against, which clears the preview address. */
  onAddressChange?: (address: CustomerAddress | null) => void
  onTaxIdChange?: (taxId: CustomerTaxId | null) => void
  /** The billing address was edited and the plan preview has not caught up with it yet. */
  isBillingPreviewPending?: boolean
  useAsDefaultBillingAddress: boolean
  onUseAsDefaultBillingAddressChange: (useAsDefault: boolean) => void
  /** The `source` query param the pricing panel was opened with, sent on telemetry events. */
  origin?: string
}

export const SubscriptionPlanUpdateView = ({
  selectedTier,
  onClose,
  onSuccess,
  planMeta,
  subscriptionPreviewQueryResult,
  currentPlanMeta: liveCurrentPlanMeta,
  projects,
  onAddressChange,
  onTaxIdChange,
  isBillingPreviewPending = false,
  useAsDefaultBillingAddress,
  onUseAsDefaultBillingAddressChange,
  origin,
}: Props) => {
  const track = useTrack()
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
    data: liveSubscriptionPreview,
    isPending: subscriptionPreviewIsLoading,
    isFetching: liveSubscriptionPreviewIsFetching,
    isSuccess: subscriptionPreviewInitialized,
    isError: liveSubscriptionPreviewIsError,
    error: subscriptionPreviewError,
    refetch: refetchSubscriptionPreview,
  } = subscriptionPreviewQueryResult

  const { data: liveSubscription } = useOrgSubscriptionQuery({ orgSlug: slug })

  /**
   * The subscription, preview and current plan the change was submitted against. On success the
   * mutations refetch these before the view closes, which would briefly re-render it as a change
   * from the new plan to itself (condensed bill, no payment form, $0 due, no features to lose).
   * Held until the change fails.
   */
  const [submittedState, setSubmittedState] = useState<{
    subscription: typeof liveSubscription
    subscriptionPreview: typeof liveSubscriptionPreview
    currentPlanMeta: typeof liveCurrentPlanMeta
  }>()
  const isSubmitted = submittedState !== undefined
  const subscription = isSubmitted ? submittedState.subscription : liveSubscription
  const subscriptionPreview = isSubmitted
    ? submittedState.subscriptionPreview
    : liveSubscriptionPreview
  const currentPlanMeta = isSubmitted ? submittedState.currentPlanMeta : liveCurrentPlanMeta
  const subscriptionPreviewIsFetching = !isSubmitted && liveSubscriptionPreviewIsFetching
  const subscriptionPreviewIsError = !isSubmitted && liveSubscriptionPreviewIsError
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

  const pausedProjects = useMemo(() => getPausedProjects(projects), [projects])

  const planChangeProperties = {
    selectedPlan: subscriptionPlanMeta?.name,
    currentPlan: subscription?.plan?.name,
    origin,
    pausedProjectCount: pausedProjects.length,
  }

  const trackDocsLinkClick = (docsLink: 'compute' | 'project_transfer') =>
    track('studio_pricing_plan_change_docs_link_clicked', { ...planChangeProperties, docsLink })

  const onSuccessfulPlanChange = () => {
    track('studio_pricing_plan_change_completed', planChangeProperties)
    setPaymentConfirmationLoading(false)
    // Upgrades land on the post-upgrade screen, which confirms the change itself.
    if (changeType !== 'upgrade') {
      toast.success(`Successfully downgraded subscription to ${subscriptionPlanMeta?.name}!`)
    }
    onClose()
    onSuccess?.({ changeType })
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
        setSubmittedState(undefined)
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
        setSubmittedState(undefined)
        toast.error(`Unable to update subscription: ${error.message}`)
      },
    })

  const paymentIntentConfirmed = async (paymentIntentConfirmation: PaymentIntentResult) => {
    // Reset payment intent secret to ensure another attempt works as expected
    setPaymentIntentSecret('')

    if (paymentIntentConfirmation.paymentIntent?.status === 'succeeded') {
      await confirmPendingSubscriptionChange(
        {
          slug: selectedOrganization?.slug,
          payment_intent_id: paymentIntentConfirmation.paymentIntent.id,
        },
        {
          // A 202 means the payment went through and the plan is still syncing. The mutation skips
          // its onSuccess for that response, so the completion is tracked here.
          onSuccess: (data) => {
            if (data && 'message' in data) {
              track('studio_pricing_plan_change_completed', planChangeProperties)
            }
          },
        }
      )
    } else {
      setSubmittedState(undefined)
      setPaymentConfirmationLoading(false)
      // If the payment intent is not successful, we reset the payment method and show an error
      toast.error(`Could not confirm payment. Please try again or use a different card.`)
    }
  }

  const onUpdateSubscription = async () => {
    if (!selectedOrganization?.slug) return console.error('org slug is required')
    if (!selectedTier) return console.error('Selected plan is required')
    if (!subscriptionPreviewInitialized) return console.error('Plan preview is required')

    track('studio_pricing_plan_change_confirm_clicked', planChangeProperties)
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

    setSubmittedState({ subscription, subscriptionPreview, currentPlanMeta })
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
    () =>
      getDueTodayBreakdown(subscriptionPreview, {
        planAmount: summary.planAmount,
      }),
    [subscriptionPreview, summary.planAmount]
  )

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

  // If there is only a single project, we can directly link to the specific project - otherwise we default to the generic `_` placeholder
  // which opens a project selection page
  const activeProjectsOnNano = projects.filter(
    (it) =>
      it.status === 'ACTIVE_HEALTHY' ||
      (it.status === 'COMING_UP' && it.databases[0].infra_compute_size === 'nano')
  )
  const exampleProjectRef = activeProjectsOnNano.length === 1 ? activeProjectsOnNano[0].ref : '_'

  const showPaymentMethodSelection =
    !billingViaPartner && subscriptionPreviewInitialized && changeType === 'upgrade'

  const hasPaymentDueToday = subscriptionPreviewInitialized && !isDowngrade && dueToday.dueToday > 0
  const confirmLabel = isDowngrade
    ? `Downgrade to ${newPlanName}`
    : `Upgrade to ${newPlanName}${hasPaymentDueToday ? ` · pay ${formatCurrency(dueToday.dueToday)} today` : ''}`

  return (
    <FullScreenPanel
      onBack={onClose}
      backDisabled={isChangeInProgress}
      contentClassName="max-w-6xl"
    >
      <div className="w-full overflow-hidden rounded-md border bg-surface-100">
        <div className="grid grid-cols-1 items-stretch md:grid-cols-2 xl:grid-cols-5">
          {/* Billing — first in the DOM so it stacks above the payment form on narrow screens */}
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

            {subscriptionPreviewIsError && (
              <AlertError error={subscriptionPreviewError} subject="Failed to estimate your bill">
                <Button variant="default" onClick={() => refetchSubscriptionPreview()}>
                  Try again
                </Button>
              </AlertError>
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
                      ? {
                          name: currentPlanName,
                          price: currentPlanMeta?.price ?? 0,
                        }
                      : undefined
                  }
                  onHourlyBillingOpen={() =>
                    track('studio_pricing_compute_billing_explainer_opened', planChangeProperties)
                  }
                  onDocsLinkClick={trackDocsLinkClick}
                />
              </div>
            )}

            {!isCondensed && subscriptionPreviewInitialized && (
              <PlanChangeNotes
                exampleProjectRef={exampleProjectRef}
                onProjectTransferDocsClick={() => trackDocsLinkClick('project_transfer')}
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
          </div>

          {/* Payment */}
          <div className="flex flex-col gap-6 border-t bg-surface-200 p-8 md:border-l md:border-t-0 xl:col-span-2">
            {showPaymentMethodSelection && (
              <div>
                <h2 className="mb-4 text-base font-medium text-foreground">Payment details</h2>
                <PaymentMethodSelection
                  ref={paymentMethodSelectionRef}
                  variant="radio"
                  label="Pay with"
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

            {isDowngrade && (
              <div>
                <h2 className="mb-1 text-sm text-foreground">Features you'll lose</h2>
                <p className="mb-4 text-xs text-foreground-light">
                  Please review carefully before downgrading.
                </p>
                <ul className="space-y-2">
                  {featuresToLose.map((feature) => (
                    <li
                      key={typeof feature === 'string' ? feature : feature[0]}
                      className="flex items-start text-sm text-foreground-light"
                    >
                      <div className="flex h-lh w-6 shrink-0 items-center">
                        <PlanMinusIcon className="size-5 -ml-0.5" />
                      </div>
                      <span>{typeof feature === 'string' ? feature : feature[0]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto flex flex-col gap-6 border-t pt-6">
              {subscriptionPreviewInitialized && !isDowngrade && (
                <DueTodayRow
                  breakdown={dueToday}
                  planName={newPlanName}
                  currentPlanName={currentPlanName}
                />
              )}

              <Button
                loading={isChangeInProgress}
                disabled={
                  !subscriptionPreviewInitialized ||
                  subscriptionPreviewIsLoading ||
                  subscriptionPreviewIsFetching ||
                  isBillingPreviewPending
                }
                variant="primary"
                onClick={onUpdateSubscription}
                size="medium"
                block
              >
                {confirmLabel}
              </Button>
            </div>
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
