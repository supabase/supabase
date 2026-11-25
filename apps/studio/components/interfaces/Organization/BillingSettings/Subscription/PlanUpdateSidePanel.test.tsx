import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanUpdateSidePanel } from './PlanUpdateSidePanel'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'

const mockSelectedOrganization = vi.hoisted(() => vi.fn())
const mockPartnerManagedResource = vi.hoisted(() => vi.fn())
const mockFlags = vi.hoisted(() => ({}) as Record<string, boolean>)
const mockTrack = vi.hoisted(() => vi.fn())
const mockSubscriptionPlan = vi.hoisted(() => ({ id: 'free', name: 'Free' }))

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useParams: () => ({ slug: 'stripe-org' }),
    useFlag: (name: string) => mockFlags[name] ?? false,
  }
})

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/org/[slug]/billing',
    query: {},
  }),
}))

const render = (ui: React.ReactElement) =>
  customRender(ui, { nuqs: { searchParams: '?panel=subscriptionPlan' } })

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
  useTrack: () => mockTrack,
}))

vi.mock('@/hooks/misc/useCheckPermissionsV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/misc/useCheckPermissionsV2')>()),
  useAsyncCheckPermissionsV2: () => ({ can: true }),
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
    data: { plan: { ...mockSubscriptionPlan }, billing_via_partner: false },
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
  MembersExceedLimitModal: () => null,
}))

vi.mock('./SubscriptionPlanUpdateView', () => ({
  SubscriptionPlanUpdateView: ({
    onSuccess,
  }: {
    onSuccess: (result: { changeType: 'upgrade' }) => void
  }) => (
    <div data-testid="plan-update-view">
      <button tabIndex={0} onClick={() => onSuccess({ changeType: 'upgrade' })}>
        Complete upgrade
      </button>
    </div>
  ),
}))

vi.mock('./PlanUpgradeSuccessView', () => ({
  PlanUpgradeSuccessView: ({
    planId,
    previousPlanId,
  }: {
    planId: string
    previousPlanId?: string
  }) => (
    <div data-testid="plan-upgrade-success">
      {previousPlanId} to {planId}
    </div>
  ),
}))

vi.mock('./SubscriptionPlanUpdateDialog', () => ({
  SubscriptionPlanUpdateDialog: () => <div data-testid="plan-update-dialog" />,
}))

describe('PlanUpdateSidePanel', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockFlags)) delete mockFlags[key]
    mockTrack.mockClear()
    Object.assign(mockSubscriptionPlan, { id: 'free', name: 'Free' })
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

  describe('plan presentation', () => {
    beforeEach(() => {
      mockSelectedOrganization.mockReturnValue(
        createMockOrganization({ slug: 'test-org', billing_partner: null })
      )
    })

    it('renders the full-screen shell', () => {
      render(<PlanUpdateSidePanel />)

      expect(screen.getByRole('button', { name: /Back/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Compare plans/ })).toBeInTheDocument()
    })

    it('renders pricing-page style cards with description and preface', () => {
      render(<PlanUpdateSidePanel />)

      expect(
        screen.getByText('Perfect for passion projects & simple websites.')
      ).toBeInTheDocument()
      expect(screen.getByText('Everything in the Free Plan, plus:')).toBeInTheDocument()
    })

    it('offers AWS Marketplace as a separate purchasing route', () => {
      render(<PlanUpdateSidePanel />)

      expect(screen.getByText('Prefer purchasing through AWS Marketplace?')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View options' })).toHaveAttribute(
        'href',
        'https://supabase.com/aws-marketplace'
      )
    })

    it('does not offer AWS Marketplace for partner-billed organizations', () => {
      mockSelectedOrganization.mockReturnValue(
        createMockOrganization({
          slug: 'aws-org',
          billing_partner: 'aws_marketplace',
          managed_by: MANAGED_BY.AWS_MARKETPLACE,
        })
      )

      render(<PlanUpdateSidePanel />)

      expect(
        screen.queryByText('Prefer purchasing through AWS Marketplace?')
      ).not.toBeInTheDocument()
    })

    it('does not render gap rows', () => {
      render(<PlanUpdateSidePanel />)

      expect(screen.queryByText('Not included')).not.toBeInTheDocument()
      expect(screen.queryByText('Plan limits')).not.toBeInTheDocument()
    })
  })

  it('sends the panel opened event once, after the organization has loaded', () => {
    mockSelectedOrganization.mockReturnValue(undefined)
    const { rerender } = render(<PlanUpdateSidePanel />)

    expect(mockTrack).not.toHaveBeenCalled()

    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({ slug: 'test-org', billing_partner: null })
    )
    rerender(<PlanUpdateSidePanel />)
    rerender(<PlanUpdateSidePanel />)

    expect(mockTrack).toHaveBeenCalledTimes(1)
    expect(mockTrack).toHaveBeenCalledWith('studio_pricing_side_panel_opened', {
      currentPlan: 'Free',
    })
  })

  describe('plan change surface', () => {
    beforeEach(() => {
      mockSelectedOrganization.mockReturnValue(
        createMockOrganization({ slug: 'test-org', billing_partner: null })
      )
    })

    const selectPro = async () => {
      render(<PlanUpdateSidePanel />)
      await userEvent.click(screen.getByRole('button', { name: 'Upgrade to Pro' }))
    }

    it('keeps the dialog while the redesign flag is off', async () => {
      await selectPro()

      expect(screen.getByTestId('plan-update-dialog')).toBeInTheDocument()
      expect(screen.queryByTestId('plan-update-view')).not.toBeInTheDocument()
    })

    it('shows the redesigned full-screen view when the flag is on', async () => {
      mockFlags.billingPlanUpdateRedesign = true

      await selectPro()

      expect(screen.getByTestId('plan-update-view')).toBeInTheDocument()
      expect(screen.queryByTestId('plan-update-dialog')).not.toBeInTheDocument()
    })

    it('remembers the plan from before the upgrade after the subscription refetches', async () => {
      mockFlags.billingPlanUpdateRedesign = true
      const { rerender } = render(<PlanUpdateSidePanel />)
      await userEvent.click(screen.getByRole('button', { name: 'Upgrade to Pro' }))

      // The upgrade refetches the subscription before the success screen opens.
      Object.assign(mockSubscriptionPlan, { id: 'pro', name: 'Pro' })
      rerender(<PlanUpdateSidePanel />)
      await userEvent.click(screen.getByRole('button', { name: 'Complete upgrade' }))

      expect(await screen.findByTestId('plan-upgrade-success')).toHaveTextContent('free to pro')
    })

    it('reads the previous plan from the URL when the success screen loads fresh', async () => {
      Object.assign(mockSubscriptionPlan, { id: 'team', name: 'Team' })
      customRender(<PlanUpdateSidePanel />, {
        nuqs: { searchParams: '?panel=planUpgraded&upgradedFrom=free' },
      })

      expect(await screen.findByTestId('plan-upgrade-success')).toHaveTextContent('free to team')
    })
  })
})
