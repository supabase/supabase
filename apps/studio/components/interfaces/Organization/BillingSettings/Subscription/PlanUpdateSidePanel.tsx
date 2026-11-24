import { useDebounce } from '@uidotdev/usehooks'
import { useFlag, useParams } from 'common'
import { isEqual } from 'lodash'
import { useQueryState } from 'nuqs'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { plans as subscriptionsPlans } from 'shared-data/plans'

import { useOrgSettingsPanel } from '../useOrgSettingsPanel'
import { CancellationFlow } from './CancellationFlow'
import { PlanCards } from './PlanCards'
import { PlanUpdateFullScreenShell } from './PlanUpdatePanelShell'
import { SubscriptionPlanUpdateDialog } from './SubscriptionPlanUpdateDialog'
import { SubscriptionPlanUpdateView } from './SubscriptionPlanUpdateView'
import UpgradeSurveyModal from './UpgradeModal'
import { STRIPE_PROJECTS_DOCS_URL } from '@/components/interfaces/Billing/Payment/PaymentMethods/StripePaymentConnection'
import PartnerManagedResource from '@/components/ui/PartnerManagedResource'
import { isPartnerBillingOrganization } from '@/data/organizations/managed-by-utils'
import { useOrganizationBillingSubscriptionPreview } from '@/data/organizations/organization-billing-subscription-preview'
import { useOrganizationQuery } from '@/data/organizations/organization-query'
import type { CustomerAddress, CustomerTaxId } from '@/data/organizations/types'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useOrgPlansQuery } from '@/data/subscriptions/org-plans-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import type { OrgPlan } from '@/data/subscriptions/types'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { useTrack } from '@/lib/telemetry/track'
import { Organization } from '@/types/base'

const getPartnerManagedResourceCta = (selectedOrganization: Organization) => {
  if (selectedOrganization.managed_by === MANAGED_BY.VERCEL_MARKETPLACE) {
    return {
      installationId: selectedOrganization?.partner_id,
      path: '/settings',
      message: 'Change plan on Vercel Marketplace',
    }
  }
  if (selectedOrganization.managed_by === MANAGED_BY.AWS_MARKETPLACE) {
    return {
      organizationSlug: selectedOrganization?.slug,
    }
  }
}

const PartnerManagedPlanNotice = ({
  organization,
  isStripeManaged,
  isPartnerBilled,
  stripeProjectsUpgradeCommand,
}: {
  organization: Organization | undefined
  isStripeManaged: boolean
  isPartnerBilled: boolean
  stripeProjectsUpgradeCommand: string
}) => {
  if (!organization) return null

  if (isStripeManaged) {
    return (
      <PartnerManagedResource
        managedBy={MANAGED_BY.STRIPE_PROJECTS}
        resource="Organization plans"
        title="Organization plans are managed through Stripe."
        details={
          <>
            Run <code>{stripeProjectsUpgradeCommand}</code> in your project directory.
          </>
        }
        cta={{
          overrideUrl: `${STRIPE_PROJECTS_DOCS_URL}#upgrade-a-service-tier`,
          message: 'Stripe Projects docs',
        }}
      />
    )
  }

  if (isPartnerBilled) {
    return (
      <PartnerManagedResource
        managedBy={organization.managed_by}
        resource="Organization plans"
        cta={getPartnerManagedResourceCta(organization)}
      />
    )
  }

  return null
}

const getStripeProjectsUpgradeCommand = (planId: string | null | undefined) => {
  const currentTier = planId ?? 'free'
  const action = currentTier === 'team' ? 'downgrade' : 'upgrade'
  return `stripe projects ${action} supabase/${currentTier}`
}

/**
 * Sends the panel opened event once per open. On a page load that lands on the panel, the
 * organization resolves after the panel is visible, so the event waits for its plan.
 */
const useTrackPanelOpened = (isOpen: boolean, currentPlan: string | undefined) => {
  const track = useTrack()
  const [source] = useQueryState('source')

  const onOpened = useEffectEvent(() => {
    track('studio_pricing_side_panel_opened', { currentPlan, origin: source ?? undefined })
  })

  const isReady = isOpen && currentPlan !== undefined
  useEffect(() => {
    if (isReady) onOpened()
  }, [isReady])
}

export const PlanUpdateSidePanel = () => {
  const { slug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const isPartnerBilledOrganization = isPartnerBillingOrganization(
    selectedOrganization?.billing_partner
  )
  const isStripeManagedOrganization =
    selectedOrganization?.managed_by === MANAGED_BY.STRIPE_PROJECTS

  const originalPlanRef = useRef<string>(undefined)

  const [showUpgradeSurvey, setShowUpgradeSurvey] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()
  const [latestAddress, setLatestAddress] = useState<CustomerAddress>()
  const [latestTaxId, setLatestTaxId] = useState<CustomerTaxId | null>()
  const [useAsDefaultBillingAddress, setUseAsDefaultBillingAddress] = useState(true)

  const billingAddress = useAsDefaultBillingAddress ? latestAddress : undefined
  const billingTaxId = useAsDefaultBillingAddress ? latestTaxId : null
  const debouncedAddress = useDebounce(billingAddress, 1000)
  const debouncedTaxId = useDebounce(billingTaxId, 1000)
  // Until the debounce settles the preview prices an older address than the one on screen,
  // and submitting would charge an amount the customer never reviewed.
  const isBillingPreviewPending =
    !isEqual(billingAddress, debouncedAddress) || !isEqual(billingTaxId, debouncedTaxId)

  const handleAddressChange = useCallback(
    (address: CustomerAddress | null) => setLatestAddress(address ?? undefined),
    []
  )

  const handleTaxIdChange = useCallback((taxId: CustomerTaxId | null) => setLatestTaxId(taxId), [])

  const handleUseAsDefaultBillingAddressChange = useCallback(
    (useAsDefault: boolean) => setUseAsDefaultBillingAddress(useAsDefault),
    []
  )

  const { can: canUpdateSubscription } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.ORGANIZATION.BILLING_WRITE
  )

  const { panel, setPanel } = useOrgSettingsPanel()
  const visible = panel === 'subscriptionPlan'
  // Panel was already open when the page loaded (deep link), so skip the entry animation delay
  const [isOpenedViaUrl] = useState(visible)

  const contentDelay = isOpenedViaUrl ? 0.4 : 0.15

  const { data: orgProjectsData } = useOrgProjectsInfiniteQuery({ slug }, { enabled: visible })
  const orgProjects =
    useMemo(
      () => orgProjectsData?.pages.flatMap((page) => page.projects),
      [orgProjectsData?.pages]
    ) || []

  const { data } = useOrganizationQuery({ slug })
  const hasOrioleProjects = !!data?.has_oriole_project

  const [source, setSource] = useQueryState('source')

  const onClose = () => {
    setPanel(null)
    // A reopen from the billing page would otherwise report the previous entry point as its origin.
    setSource(null)
  }

  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: slug,
  })
  const { data: plans, isPending: isLoadingPlans } = useOrgPlansQuery(
    { orgSlug: slug },
    { enabled: visible }
  )

  const subscriptionPreviewData = useOrganizationBillingSubscriptionPreview({
    tier: selectedTier,
    organizationSlug: slug,
    address: debouncedAddress,
    taxId: debouncedTaxId ?? undefined,
  })

  const availablePlans: OrgPlan[] = plans?.plans ?? []

  useTrackPanelOpened(visible, selectedOrganization?.plan.name)

  useEffect(() => {
    if (visible) {
      setSelectedTier(undefined)
      setLatestAddress(undefined)
      setLatestTaxId(undefined)
      setUseAsDefaultBillingAddress(true)
    }
  }, [visible])

  useEffect(() => {
    if (visible && isSuccessSubscription && subscription.plan.id) {
      originalPlanRef.current = subscription.plan.id
    }
  }, [visible, isSuccessSubscription, subscription?.plan.id])

  // tier_free goes through the cancellation flow instead of the plan update view
  const isConfirmingPlanChange = selectedTier !== undefined && selectedTier !== 'tier_free'

  // Rolls out the redesigned full screen plan change flow. Off falls back to the dialog.
  const isPlanUpdateRedesignEnabled = useFlag('billingPlanUpdateRedesign')

  const planMeta = selectedTier
    ? availablePlans.find((p) => p.id === selectedTier.split('tier_')[1])
    : null

  const currentPlanMeta = {
    ...availablePlans.find((p) => p.id === subscription?.plan?.id),
    features:
      subscriptionsPlans.find((plan) => plan.id === `tier_${subscription?.plan?.id}`)?.features ||
      [],
  }

  const stripeProjectsUpgradeCommand = getStripeProjectsUpgradeCommand(
    selectedOrganization?.plan?.id ?? subscription?.plan?.id
  )

  const notice = (
    <PartnerManagedPlanNotice
      organization={selectedOrganization}
      isStripeManaged={isStripeManagedOrganization}
      isPartnerBilled={isPartnerBilledOrganization}
      stripeProjectsUpgradeCommand={stripeProjectsUpgradeCommand}
    />
  )

  // Fail closed until subscription succeeds: unresolved plan ids look eligible.
  const showAwsMarketplacePurchase =
    isSuccessSubscription &&
    canUpdateSubscription &&
    selectedOrganization?.managed_by === MANAGED_BY.SUPABASE &&
    !isPartnerBilledOrganization &&
    subscription.billing_via_partner === false &&
    !['enterprise', 'platform'].includes(subscription.plan.id)

  const planCards = (
    <PlanCards
      availablePlans={availablePlans}
      isLoadingPlans={isLoadingPlans}
      currentSubscriptionPlanId={subscription?.plan?.id}
      currentSubscriptionPlanName={subscription?.plan?.name}
      canUpdateSubscription={canUpdateSubscription}
      isPartnerBilledOrganization={isPartnerBilledOrganization}
      hasOrioleProjects={hasOrioleProjects}
      selectedOrganization={selectedOrganization}
      showAwsMarketplacePurchase={showAwsMarketplacePurchase}
      isPlanUpdateRedesignEnabled={isPlanUpdateRedesignEnabled}
      onSelectTier={setSelectedTier}
    />
  )

  // Both plan change surfaces take the same props, so the flag only picks the renderer.
  const planChangeProps = {
    selectedTier,
    onClose: () => setSelectedTier(undefined),
    onSuccess: onClose,
    planMeta,
    subscriptionPreviewQueryResult: subscriptionPreviewData,
    projects: orgProjects,
    currentPlanMeta,
    onAddressChange: handleAddressChange,
    onTaxIdChange: handleTaxIdChange,
    isBillingPreviewPending,
    useAsDefaultBillingAddress,
    onUseAsDefaultBillingAddressChange: handleUseAsDefaultBillingAddressChange,
  }

  return (
    <>
      {visible && (
        <PlanUpdateFullScreenShell
          organizationName={selectedOrganization?.name}
          notice={notice}
          skipOverlayFade={isOpenedViaUrl}
          contentDelay={contentDelay}
          onClose={onClose}
        >
          {planCards}
        </PlanUpdateFullScreenShell>
      )}

      <CancellationFlow
        visible={selectedTier === 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        onDowngrade={() => setSelectedTier(undefined)}
      />

      {isConfirmingPlanChange &&
        (isPlanUpdateRedesignEnabled ? (
          <SubscriptionPlanUpdateView {...planChangeProps} origin={source ?? undefined} />
        ) : (
          <SubscriptionPlanUpdateDialog {...planChangeProps} />
        ))}

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
