import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanUpdateSidePanel } from './PlanUpdateSidePanel'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const mockSelectedOrganization = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())
const mockPartnerManagedResource = vi.hoisted(() => vi.fn())
const mockUsePHFlag = vi.hoisted(() => vi.fn())

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
    {
      id: 'tier_free',
      planId: 'free',
      name: 'Free',
      costUnit: '/ month',
      features: ['Unlimited API requests'],
      description: 'Perfect for passion projects & simple websites.',
      preface: 'Get started with:',
      footer: 'Free projects are paused after 1 week of inactivity. Limit of 2 active projects.',
    },
    {
      id: 'tier_pro',
      planId: 'pro',
      name: 'Pro',
      nameBadge: 'Most Popular',
      costUnit: '/ month',
      features: ['Email support'],
      description: 'For production applications with the power to scale.',
      preface: 'Everything in the Free Plan, plus:',
    },
  ],
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockSelectedOrganization() }),
}))

vi.mock('@/lib/telemetry/track', () => ({
  useTrack: () => vi.fn(),
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
  default: (props: any) => {
    mockPartnerManagedResource(props)
    return <div data-testid="partner-managed-resource">{props.details}</div>
  },
}))

vi.mock('./EnterpriseCard', () => ({
  EnterpriseCard: () => <div>Enterprise</div>,
}))

vi.mock('./DowngradeModal', () => ({
  DowngradeModal: () => null,
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

vi.mock('@/hooks/ui/useFlag', () => ({
  usePHFlag: (...args: any[]) => mockUsePHFlag(...args),
}))

vi.mock('@/hooks/misc/useTrackExperimentExposure', () => ({
  useTrackExperimentExposure: vi.fn(),
}))

describe('PlanUpdateSidePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePHFlag.mockReturnValue('control')
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'stripe-org',
        billing_partner: null,
        integration_source: 'stripe_projects',
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
      })
    )
  })

  it('shows Stripe-managed messaging without treating Stripe orgs as partner-billed', () => {
    render(<PlanUpdateSidePanel />)

    expect(screen.getByTestId('partner-managed-resource')).toBeInTheDocument()
    expect(screen.getByText('stripe projects upgrade supabase/free')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeInTheDocument()
  })

  it('uses the current plan in the Stripe Projects upgrade command', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'stripe-org',
        billing_partner: null,
        integration_source: 'stripe_projects',
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
        plan: { id: 'pro', name: 'Pro' },
      })
    )

    render(<PlanUpdateSidePanel />)

    expect(screen.getByText('stripe projects upgrade supabase/pro')).toBeInTheDocument()
  })

  it('uses the Stripe Projects downgrade command for team plans', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'stripe-org',
        billing_partner: null,
        integration_source: 'stripe_projects',
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
        plan: { id: 'team', name: 'Team' },
      })
    )

    render(<PlanUpdateSidePanel />)

    expect(screen.getByText('stripe projects downgrade supabase/team')).toBeInTheDocument()
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

  describe('parity variant', () => {
    beforeEach(() => {
      mockUsePHFlag.mockReturnValue('parity')
      mockSelectedOrganization.mockReturnValue(
        createMockOrganization({ slug: 'test-org', billing_partner: null })
      )
    })

    it('renders plan description', () => {
      render(<PlanUpdateSidePanel />)
      expect(
        screen.getByText('Perfect for passion projects & simple websites.')
      ).toBeInTheDocument()
    })

    it('renders preface line', () => {
      render(<PlanUpdateSidePanel />)
      expect(screen.getByText('Everything in the Free Plan, plus:')).toBeInTheDocument()
    })
  })

  describe('gaps variant', () => {
    beforeEach(() => {
      mockUsePHFlag.mockReturnValue('gaps')
      mockSelectedOrganization.mockReturnValue(
        createMockOrganization({ slug: 'test-org', billing_partner: null })
      )
    })

    it('renders gap rows on the Free plan', () => {
      render(<PlanUpdateSidePanel />)
      expect(screen.getByText('Daily backups')).toBeInTheDocument()
      expect(screen.getByText('Email support')).toBeInTheDocument()
    })

    it('shows log retention as a lesser value, not a missing feature', () => {
      render(<PlanUpdateSidePanel />)
      expect(screen.getByText('1-day log retention')).toBeInTheDocument()
    })

    it('renders the Not included label', () => {
      render(<PlanUpdateSidePanel />)
      expect(screen.getByText('Not included')).toBeInTheDocument()
    })
  })

  describe('control variant', () => {
    beforeEach(() => {
      mockUsePHFlag.mockReturnValue('control')
      mockSelectedOrganization.mockReturnValue(
        createMockOrganization({ slug: 'test-org', billing_partner: null })
      )
    })

    it('does not render preface or description', () => {
      render(<PlanUpdateSidePanel />)
      expect(
        screen.queryByText('Everything in the Free Plan, plus:')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('Perfect for passion projects & simple websites.')
      ).not.toBeInTheDocument()
    })

    it('does not render gap rows', () => {
      render(<PlanUpdateSidePanel />)
      expect(screen.queryByText('Not included')).not.toBeInTheDocument()
    })
  })
})
