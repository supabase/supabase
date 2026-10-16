import { fireEvent, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subscription from './Subscription'
import { render } from '@/tests/helpers'

const { mockSubscription, mockSetPanelKey, mockSelectedOrganization } = vi.hoisted(() => ({
  mockSubscription: vi.fn(),
  mockSetPanelKey: vi.fn(),
  mockSelectedOrganization: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useParams: () => ({ slug: 'stripe-org' }),
    useFlag: () => false,
  }
})

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: () => mockSubscription(),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({
    data: mockSelectedOrganization(),
  }),
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
    mockSelectedOrganization.mockReturnValue({ managed_by: 'supabase' })
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

  it('shows the plan-change CTA and opens the side panel when clicked', () => {
    render(<Subscription />)
    const button = screen.getByRole('button', { name: 'Change subscription plan' })
    expect(button).toBeInTheDocument()
    expect(mockSetPanelKey).not.toHaveBeenCalled()

    fireEvent.click(button)

    expect(mockSetPanelKey).toHaveBeenCalledWith('subscriptionPlan')
  })

  it('links to Compare plans and AWS Marketplace under More information', () => {
    render(<Subscription />)

    expect(screen.getByText('More information')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Compare plans/ })).toHaveAttribute(
      'href',
      'https://supabase.com/pricing#compare-plans'
    )
    expect(screen.getByRole('link', { name: /AWS Marketplace/ })).toHaveAttribute(
      'href',
      'https://supabase.com/aws-marketplace'
    )
  })

  it('shows the support fallback when plan changes are not available', () => {
    mockSubscription.mockReturnValue({
      data: {
        plan: { id: 'enterprise', name: 'Enterprise' },
        usage_billing_enabled: true,
      },
      error: null,
      isPending: false,
      isError: false,
      isSuccess: true,
    })

    render(<Subscription />)

    expect(
      screen.queryByRole('button', { name: 'Change subscription plan' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Unable to update plan from Enterprise')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Compare plans/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /AWS Marketplace/ })).not.toBeInTheDocument()
  })
})
