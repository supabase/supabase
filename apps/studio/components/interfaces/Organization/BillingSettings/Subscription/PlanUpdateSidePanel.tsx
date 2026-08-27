import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { StudioPricingSidePanelOpenedEvent } from 'common/telemetry-constants'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { plans as subscriptionsPlans } from 'shared-data/plans'

import { CancellationFlow } from './CancellationFlow'
import {
  isFullScreenPresentation,
  isPlanChangeEligible,
  usePlanPresentationExperiment,
} from './plan-presentation'
import { PlanCards } from './PlanCards'
import { PlanUpdateFullScreenShell, PlanUpdateSheetShell } from './PlanUpdatePanelShell'
import { SubscriptionPlanUpdateDialog } from './SubscriptionPlanUpdateDialog'
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
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { useTrack } from '@/lib/telemetry/track'
import { useOrgSettingsPageStateSnapshot } from '@/state/organization-settings'
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
            Run <code className="text-code-inline">{stripeProjectsUpgradeCommand}</code> in your
            project directory.
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

export const PlanUpdateSidePanel = () => {
  const router = useRouter()
  const { slug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const isPartnerBilledOrganization = isPartnerBillingOrganization(
    selectedOrganization?.billing_partner
  )
  const isStripeManagedOrganization =
    selectedOrganization?.managed_by === MANAGED_BY.STRIPE_PROJECTS
  const track = useTrack()

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

  const handleAddressChange = useCallback(
    (address: CustomerAddress) => setLatestAddress(address),
    []
  )

  const handleTaxIdChange = useCallback((taxId: CustomerTaxId | null) => setLatestTaxId(taxId), [])

  const handleUseAsDefaultBillingAddressChange = useCallback(
    (useAsDefault: boolean) => setUseAsDefaultBillingAddress(useAsDefault),
    []
  )

  const { can: canUpdateSubscription } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useOrgSettingsPageStateSnapshot()
  const isOpenedViaUrl = router.query.panel === 'subscriptionPlan'
  const visible = snap.panelKey === 'subscriptionPlan' || isOpenedViaUrl

  const contentDelay = isOpenedViaUrl ? 0.4 : 0.15

  const { data: orgProjectsData } = useOrgProjectsInfiniteQuery({ slug }, { enabled: visible })
  const orgProjects =
    useMemo(
      () => orgProjectsData?.pages.flatMap((page) => page.projects),
      [orgProjectsData?.pages]
    ) || []

  const { data } = useOrganizationQuery({ slug })
  const hasOrioleProjects = !!data?.has_oriole_project

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

  // Only orgs that can actually act on the panel enter the experiment, and only once it is open
  const isPlanPresentationEligible =
    visible &&
    isPlanChangeEligible({
      managedBy: selectedOrganization?.managed_by,
      billingPartner: selectedOrganization?.billing_partner,
      currentPlanId: subscription?.plan?.id,
      canUpdateSubscription,
    })

  const { variant: presentation, isResolved: isPresentationResolved } =
    usePlanPresentationExperiment({ eligible: isPlanPresentationEligible })
  const isFullScreen = isFullScreenPresentation(presentation)

  // The fullscreen variant swaps the shell, so hold the panel closed until the variant is known
  const isPanelOpen = visible && isPresentationResolved

  const onPanelOpened = useEffectEvent(
    (properties: StudioPricingSidePanelOpenedEvent['properties']) => {
      track('studio_pricing_side_panel_opened', properties)
    }
  )

  useEffect(() => {
    if (visible) {
      setSelectedTier(undefined)
      setLatestAddress(undefined)
      setLatestTaxId(undefined)
      setUseAsDefaultBillingAddress(true)
      const source = Array.isArray(router.query.source)
        ? router.query.source[0]
        : router.query.source
      const properties: StudioPricingSidePanelOpenedEvent['properties'] = {
        currentPlan: subscription?.plan?.name,
      }
      if (source) {
        properties.origin = source
      }
      onPanelOpened(properties)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (visible && isSuccessSubscription && subscription.plan.id) {
      originalPlanRef.current = subscription.plan.id
    }
  }, [visible, isSuccessSubscription, subscription?.plan.id])

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
      variant={presentation}
      entryDelay={isFullScreen ? contentDelay : undefined}
      onSelectTier={setSelectedTier}
    />
  )

  return (
    <>
      {isFullScreen && isPanelOpen && (
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

      {!isFullScreen && (
        <PlanUpdateSheetShell
          visible={isPanelOpen}
          organizationName={selectedOrganization?.name}
          notice={notice}
          onClose={onClose}
        >
          {planCards}
        </PlanUpdateSheetShell>
      )}

      <CancellationFlow
        visible={selectedTier === 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        onDowngrade={() => setSelectedTier(undefined)}
      />

      <SubscriptionPlanUpdateDialog
        selectedTier={selectedTier}
        onClose={() => setSelectedTier(undefined)}
        planMeta={planMeta}
        subscriptionPreviewQueryResult={subscriptionPreviewData}
        projects={orgProjects}
        currentPlanMeta={currentPlanMeta}
        onAddressChange={handleAddressChange}
        onTaxIdChange={handleTaxIdChange}
        useAsDefaultBillingAddress={useAsDefaultBillingAddress}
        onUseAsDefaultBillingAddressChange={handleUseAsDefaultBillingAddressChange}
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
