import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanUpdateSidePanel } from './PlanUpdateSidePanel'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const mockSelectedOrganization = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useParams: () => ({ slug: 'stripe-org' }),
  }
})

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/org/[slug]/billing',
    query: {},
    push: mockPush,
  }),
}))

vi.mock('shared-data/plans', () => ({
  plans: [
    { id: 'tier_free', planId: 'free', name: 'Free', costUnit: '/ month', features: [] },
    { id: 'tier_pro', planId: 'pro', name: 'Pro', costUnit: '/ month', features: [] },
  ],
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockSelectedOrganization() }),
}))

vi.mock('@/data/telemetry/send-event-mutation', () => ({
  useSendEventMutation: () => ({ mutate: vi.fn() }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true }),
}))

vi.mock('@/state/organization-settings', () => ({
  useOrgSettingsPageStateSnapshot: () => ({
    panelKey: 'subscriptionPlan',
    setPanelKey: vi.fn(),
  }),
}))

vi.mock('@/data/projects/org-projects-infinite-query', () => ({
  useOrgProjectsInfiniteQuery: () => ({ data: undefined }),
}))

vi.mock('@/data/organizations/free-project-limit-check-query', () => ({
  useFreeProjectLimitCheckQuery: () => ({ data: [] }),
}))

vi.mock('@/data/organizations/organization-query', () => ({
  useOrganizationQuery: () => ({ data: { has_oriole_project: false } }),
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: () => ({
    data: { plan: { id: 'free', name: 'Free' } },
    isSuccess: true,
  }),
}))

vi.mock('@/data/subscriptions/org-plans-query', () => ({
  useOrgPlansQuery: () => ({
    data: {
      plans: [
        { id: 'free', price: 0 },
        { id: 'pro', price: 25 },
      ],
    },
    isPending: false,
  }),
}))

vi.mock('@/data/organizations/organization-billing-subscription-preview', () => ({
  useOrganizationBillingSubscriptionPreview: () => ({}),
}))

vi.mock('@/components/ui/PartnerManagedResource', () => ({
  default: () => <div data-testid="partner-managed-resource" />,
}))

vi.mock('./EnterpriseCard', () => ({
  EnterpriseCard: () => <div>Enterprise</div>,
}))

vi.mock('./DowngradeModal', () => ({
  default: () => null,
}))

vi.mock('./ExitSurveyModal', () => ({
  ExitSurveyModal: () => null,
}))

vi.mock('./UpgradeModal', () => ({
  default: () => null,
}))

vi.mock('./MembersExceedLimitModal', () => ({
  default: () => null,
}))

vi.mock('./SubscriptionPlanUpdateDialog', () => ({
  SubscriptionPlanUpdateDialog: () => null,
}))

describe('PlanUpdateSidePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'stripe-org',
        billing_partner: null,
        integration_source: 'stripe_projects',
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
      })
    )
  })

  it('does not treat Stripe-connected orgs as partner-billed', () => {
    render(<PlanUpdateSidePanel />)

    expect(screen.queryByTestId('partner-managed-resource')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument()
  })

  it('still shows partner-managed messaging for billing-partner orgs', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'aws-org',
        billing_partner: 'aws_marketplace',
        managed_by: MANAGED_BY.AWS_MARKETPLACE,
      })
    )

    render(<PlanUpdateSidePanel />)

    expect(screen.getByTestId('partner-managed-resource')).toBeInTheDocument()
  })
})
