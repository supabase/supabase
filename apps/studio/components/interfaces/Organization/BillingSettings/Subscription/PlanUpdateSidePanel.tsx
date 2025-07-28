import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isArray } from 'lodash'
import { Check, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

import { StudioPricingSidePanelOpenedEvent } from 'common/telemetry-constants'
import { getPlanChangeType } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useOrganizationBillingSubscriptionPreview } from 'data/organizations/organization-billing-subscription-preview'
import { useOrganizationQuery } from 'data/organizations/organization-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgPlansQuery } from 'data/subscriptions/org-plans-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import type { OrgPlan } from 'data/subscriptions/types'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  useSelectedOrganization,
  useSelectedOrganizationQuery,
} from 'hooks/misc/useSelectedOrganization'
import { formatCurrency } from 'lib/helpers'
import { pickFeatures, pickFooter, plans as subscriptionsPlans } from 'shared-data/plans'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Button, SidePanel, cn } from 'ui'
import DowngradeModal from './DowngradeModal'
import { EnterpriseCard } from './EnterpriseCard'
import { ExitSurveyModal } from './ExitSurveyModal'
import { useParams } from 'common'
import MembersExceedLimitModal from './MembersExceedLimitModal'
import { SubscriptionPlanUpdateDialog } from './SubscriptionPlanUpdateDialog'
import UpgradeSurveyModal from './UpgradeModal'

const PlanUpdateSidePanel = () => {
  const router = useRouter()
  const { slug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const originalPlanRef = useRef<string>()

  const [showExitSurvey, setShowExitSurvey] = useState(false)
  const [showUpgradeSurvey, setShowUpgradeSurvey] = useState(false)
  const [showDowngradeError, setShowDowngradeError] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()

  const canUpdateSubscription = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )
  const { data: allProjects } = useProjectsQuery()
  const orgProjects = (allProjects || []).filter(
    (it) => it.organization_id === selectedOrganization?.id
  )

  const { data } = useOrganizationQuery({ slug })
  const hasOrioleProjects = !!data?.has_oriole_project

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

  const billingPartner = subscription?.billing_partner

  const {
    data: subscriptionPreview,
    error: subscriptionPreviewError,
    isLoading: subscriptionPreviewIsLoading,
    isSuccess: subscriptionPreviewInitialized,
  } = useOrganizationBillingSubscriptionPreview({ tier: selectedTier, organizationSlug: slug })

  const availablePlans: OrgPlan[] = plans?.plans ?? []
  const hasMembersExceedingFreeTierLimit =
    (membersExceededLimit || []).length > 0 &&
    orgProjects.filter((it) => it.status !== 'INACTIVE' && it.status !== 'GOING_DOWN').length > 0

  useEffect(() => {
    if (visible) {
      setSelectedTier(undefined)
      const source = Array.isArray(router.query.source)
        ? router.query.source[0]
        : router.query.source
      const properties: StudioPricingSidePanelOpenedEvent['properties'] = {
        currentPlan: subscription?.plan?.name,
      }
      if (source) {
        properties.origin = source
      }
      sendEvent({
        action: 'studio_pricing_side_panel_opened',
        properties,
        groups: { organization: slug ?? 'Unknown' },
      })
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
            <Button asChild type="default" icon={<ExternalLink />}>
              <a href="https://supabase.com/pricing" target="_blank" rel="noreferrer">
                Pricing
              </a>
            </Button>
          </div>
        }
      >
        {selectedOrganization?.managed_by === 'vercel-marketplace' && (
          <PartnerManagedResource
            partner={selectedOrganization?.managed_by}
            resource="Organization plans"
            cta={{
              installationId: selectedOrganization?.partner_id,
              path: '/settings',
              message: 'Change Plan on Vercel Marketplace',
            }}
            // TODO: support AWS marketplace here: `https://us-east-1.console.aws.amazon.com/billing/home#/bills`
          />
        )}
        <SidePanel.Content>
          <div className="py-6 grid grid-cols-12 gap-3">
            {subscriptionsPlans.map((plan) => {
              const planMeta = availablePlans.find((p) => p.id === plan.id.split('tier_')[1])
              const price = planMeta?.price ?? 0
              const isDowngradeOption =
                getPlanChangeType(subscription?.plan.id, plan?.planId) === 'downgrade'
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
                  className={cn(
                    'px-4 py-4 flex flex-col items-start justify-between',
                    'border rounded-md col-span-12 md:col-span-4 bg-surface-200'
                  )}
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-2">
                      <p className="text-brand text-sm uppercase">{plan.name}</p>
                      {isCurrentPlan ? (
                        <div className="text-xs bg-surface-300 text-foreground-light rounded px-2 py-0.5">
                          Current plan
                        </div>
                      ) : plan.nameBadge ? (
                        <div className="text-xs bg-brand-400 text-brand-600 rounded px-2 py-0.5">
                          {plan.nameBadge}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center space-x-1 mb-4">
                      {(price ?? 0) > 0 && <p className="text-foreground-light text-sm">From</p>}
                      {isLoadingPlans ? (
                        <div className="h-[28px] flex items-center justify-center">
                          <ShimmeringLoader className="w-[30px] h-[24px]" />
                        </div>
                      ) : (
                        <p className="text-foreground text-lg" translate="no">
                          {formatCurrency(price)}
                        </p>
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
                          // Downgrades to free are still allowed through the dashboard given we have much better control about showing customers the impact + any possible issues with downgrading to free
                          (selectedOrganization?.managed_by !== 'supabase' &&
                            plan.id !== 'tier_free') ||
                          hasOrioleProjects ||
                          !canUpdateSubscription
                        }
                        onClick={() => {
                          setSelectedTier(plan.id as any)
                          sendEvent({
                            action: 'studio_pricing_plan_cta_clicked',
                            properties: {
                              selectedPlan: plan.name,
                              currentPlan: subscription?.plan?.name,
                            },
                            groups: { organization: slug ?? 'Unknown' },
                          })
                        }}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            className: hasOrioleProjects ? 'w-96 text-center' : '',
                            text:
                              subscription?.plan?.id === 'enterprise'
                                ? 'Reach out to us via support to update your plan from Enterprise'
                                : hasOrioleProjects
                                  ? 'Your organization has projects that are using the OrioleDB extension which is only available on the Free plan. Remove all OrioleDB projects before changing your plan.'
                                  : !canUpdateSubscription
                                    ? 'You do not have permission to change the subscription plan'
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
                            <Check
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
        subscription={subscription}
        onClose={() => setSelectedTier(undefined)}
        onConfirm={onConfirmDowngrade}
        projects={orgProjects}
      />

      <SubscriptionPlanUpdateDialog
        selectedTier={selectedTier}
        onClose={() => setSelectedTier(undefined)}
        planMeta={planMeta}
        subscriptionPreviewError={subscriptionPreviewError}
        subscriptionPreviewIsLoading={subscriptionPreviewIsLoading}
        subscriptionPreviewInitialized={subscriptionPreviewInitialized}
        subscriptionPreview={subscriptionPreview}
        subscription={subscription}
        projects={orgProjects}
        currentPlanMeta={{
          ...availablePlans.find((p) => p.id === subscription?.plan?.id),
          features:
            subscriptionsPlans.find((plan) => plan.id === `tier_${subscription?.plan?.id}`)
              ?.features || [],
        }}
      />

      <MembersExceedLimitModal
        visible={showDowngradeError}
        onClose={() => setShowDowngradeError(false)}
      />

      <ExitSurveyModal
        visible={showExitSurvey}
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
