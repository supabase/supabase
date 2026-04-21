import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subscription from './Subscription'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const { mockSelectedOrganization, mockSubscription, mockSetPanelKey } = vi.hoisted(() => ({
  mockSelectedOrganization: vi.fn(),
  mockSubscription: vi.fn(),
  mockSetPanelKey: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useParams: () => ({ slug: 'stripe-org' }),
    useFlag: () => false,
  }
})

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockSelectedOrganization() }),
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: () => mockSubscription(),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
}))

vi.mock('@/state/organization-settings', () => ({
  useOrgSettingsPageStateSnapshot: () => ({
    setPanelKey: mockSetPanelKey,
  }),
}))

vi.mock('../Restriction', () => ({
  Restriction: () => null,
}))

vi.mock('../ProjectUpdateDisabledTooltip', () => ({
  ProjectUpdateDisabledTooltip: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('./PlanUpdateSidePanel', () => ({
  PlanUpdateSidePanel: () => null,
}))

describe('Subscription', () => {
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
    mockSubscription.mockReturnValue({
      data: {
        plan: { id: 'free', name: 'Free' },
        usage_billing_enabled: true,
      },
      error: null,
      isPending: false,
      isError: false,
      isSuccess: true,
    })
  })

  it('shows a Stripe-managed plan notice instead of the plan-change CTA', () => {
    render(<Subscription />)

    expect(screen.getByText('Organization plans are managed by Stripe.')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Change Plan in Stripe Dashboard' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change subscription plan' })
    ).not.toBeInTheDocument()
    expect(mockSetPanelKey).not.toHaveBeenCalled()
  })

  it('continues to show the self-serve plan-change CTA for non-Stripe orgs', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'self-serve-org',
        billing_partner: null,
        integration_source: null,
        managed_by: MANAGED_BY.SUPABASE,
      })
    )

    render(<Subscription />)

    expect(screen.getByRole('button', { name: 'Change subscription plan' })).toBeInTheDocument()
    expect(screen.queryByText('Organization plans are managed by Stripe.')).not.toBeInTheDocument()
  })
})
