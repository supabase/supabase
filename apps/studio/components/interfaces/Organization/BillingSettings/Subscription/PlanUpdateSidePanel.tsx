import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { StudioPricingSidePanelOpenedEvent } from 'common/telemetry-constants'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { plans as subscriptionsPlans } from 'shared-data/plans'
import { Button } from 'ui'

import { CancellationFlow } from './CancellationFlow'
import { PlanCards } from './PlanCards'
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

  return (
    <>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-studio"
          initial={isOpenedViaUrl ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Button
            variant="text"
            icon={<ArrowLeft />}
            onClick={() => onClose()}
            className="fixed top-4 left-4 z-10"
          >
            Go back to Studio
          </Button>
          <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
            <Button
              asChild
              variant="text"
              iconRight={<ExternalLink />}
              className="hidden sm:inline-flex"
            >
              <a href="https://supabase.com/pricing#faq" target="_blank" rel="noreferrer">
                Pricing FAQ
              </a>
            </Button>
            <Button asChild variant="default" iconRight={<ExternalLink />}>
              <a href="https://supabase.com/pricing#compare-plans" target="_blank" rel="noreferrer">
                Compare plans
              </a>
            </Button>
          </div>
          <motion.div
            className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-16"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: contentDelay, duration: 0.3, ease: 'easeOut' }}
          >
            <h1 className="text-2xl text-center">
              Change subscription plan for {selectedOrganization?.name}
            </h1>
            {selectedOrganization &&
              (isStripeManagedOrganization ? (
                <PartnerManagedResource
                  managedBy={MANAGED_BY.STRIPE_PROJECTS}
                  resource="Organization plans"
                  title="Organization plans are managed through Stripe."
                  details={
                    <>
                      Run <code className="text-code-inline">{stripeProjectsUpgradeCommand}</code>{' '}
                      in your project directory.
                    </>
                  }
                  cta={{
                    overrideUrl: `${STRIPE_PROJECTS_DOCS_URL}#upgrade-a-service-tier`,
                    message: 'Stripe Projects docs',
                  }}
                />
              ) : isPartnerBilledOrganization ? (
                <PartnerManagedResource
                  managedBy={selectedOrganization.managed_by}
                  resource="Organization plans"
                  cta={getPartnerManagedResourceCta(selectedOrganization)}
                />
              ) : null)}
            <PlanCards
              availablePlans={availablePlans}
              isLoadingPlans={isLoadingPlans}
              currentSubscriptionPlanId={subscription?.plan?.id}
              currentSubscriptionPlanName={subscription?.plan?.name}
              canUpdateSubscription={canUpdateSubscription}
              isPartnerBilledOrganization={isPartnerBilledOrganization}
              hasOrioleProjects={hasOrioleProjects}
              selectedOrganization={selectedOrganization}
              onSelectTier={setSelectedTier}
              contentDelay={contentDelay}
            />
          </motion.div>
        </motion.div>
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
