import { createRootRoute, createRoute } from '@tanstack/react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { consentState } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import type { ComponentProps } from 'react'
import { describe, expect, it, onTestFinished, vi } from 'vitest'

import { PlanUpgradeSuccessView } from './PlanUpgradeSuccessView'
import { createMockOrgProject } from '@/tests/helpers'
import { addAPIMock } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

mockAnimationsApi()

type ViewProps = ComponentProps<typeof PlanUpgradeSuccessView>

const renderView = async (props: Partial<ViewProps> = {}) => {
  const viewProps: ViewProps = {
    planId: 'pro',
    organizationName: 'Acme',
    organizationSlug: 'acme',
    projects: [],
    isSpendCapEnabled: false,
    onManageSpendCap: vi.fn(),
    onClose: vi.fn(),
    ...props,
  }
  const BillingRoute = createRoute({
    getParentRoute: () => createRootRoute(),
    path: 'billing',
    component: () => <PlanUpgradeSuccessView {...viewProps} />,
  })

  await renderRoute(BillingRoute, {
    routeId: '/_app/org/$slug/billing',
    url: '/org/acme/billing?panel=planUpgraded',
  })
  return viewProps
}

describe('PlanUpgradeSuccessView', () => {
  it('links each running Nano project to its Infrastructure settings', async () => {
    await renderView({
      projects: [
        createMockOrgProject({ ref: 'nano-one', name: 'Nano one', computeSize: 'nano' }),
        createMockOrgProject({ ref: 'micro-one', name: 'Micro one', computeSize: 'micro' }),
      ],
    })

    expect(
      screen.getByRole('heading', { name: 'Upgrade to Micro compute at no extra cost' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upgrade to Micro for Nano one' })).toHaveAttribute(
      'href',
      '/project/nano-one/settings/infrastructure'
    )
    expect(screen.queryByText('Micro one')).not.toBeInTheDocument()
  })

  it('tracks Micro upgrade clicks against the clicked project', async () => {
    const previousConsent = consentState.hasConsented
    consentState.hasConsented = true
    onTestFinished(() => {
      consentState.hasConsented = previousConsent
    })
    const telemetryEvents: unknown[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/telemetry/event',
      response: async ({ request }) => {
        telemetryEvents.push(await request.json())
        return new HttpResponse(null, { status: 201 })
      },
    })
    const user = userEvent.setup()
    await renderView({
      planId: 'team',
      projects: [
        createMockOrgProject({ ref: 'nano-one', name: 'Nano one', computeSize: 'nano' }),
        createMockOrgProject({ ref: 'nano-two', name: 'Nano two', computeSize: 'nano' }),
      ],
    })

    await user.click(screen.getByRole('link', { name: 'Upgrade to Micro for Nano two' }))

    await waitFor(() =>
      expect(telemetryEvents).toContainEqual(
        expect.objectContaining({
          action: 'plan_upgraded_micro_compute_upgrade_clicked',
          custom_properties: { planId: 'team', nanoProjectCount: 2 },
          groups: expect.objectContaining({ project: 'nano-two' }),
        })
      )
    )
  })

  it('hides the Micro upgrade when no project runs on Nano', async () => {
    await renderView({ projects: [createMockOrgProject({ computeSize: 'micro' })] })

    expect(
      screen.queryByRole('heading', { name: 'Upgrade to Micro compute at no extra cost' })
    ).not.toBeInTheDocument()
  })

  it('shows Pro benefits and offers to turn off the spend cap', async () => {
    const user = userEvent.setup()
    const { onManageSpendCap } = await renderView({ planId: 'pro', isSpendCapEnabled: true })

    expect(screen.getByRole('heading', { name: 'Welcome to the Pro plan' })).toBeInTheDocument()
    expect(screen.getByText('Daily backups')).toBeInTheDocument()
    expect(screen.getByText('Connect through the dedicated pooler')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Manage spend cap' }))
    expect(onManageSpendCap).toHaveBeenCalled()
  })

  it('skips the spend cap step when the spend cap is already off', async () => {
    await renderView({ planId: 'pro', isSpendCapEnabled: false })

    expect(screen.queryByRole('button', { name: 'Manage spend cap' })).not.toBeInTheDocument()
  })

  it('shows Team benefits with links to org settings and onboarding', async () => {
    await renderView({ planId: 'team', isSpendCapEnabled: true })

    expect(screen.getByRole('heading', { name: 'Welcome to the Team plan' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up SSO' })).toHaveAttribute(
      'href',
      '/org/acme/sso'
    )
    expect(screen.getByRole('link', { name: /Book a call/ })).toHaveAttribute(
      'href',
      'https://forms.supabase.com/teamtier'
    )
    expect(screen.queryByRole('button', { name: 'Manage spend cap' })).not.toBeInTheDocument()
  })

  it('returns to billing', async () => {
    const user = userEvent.setup()
    const { onClose } = await renderView()

    await user.click(screen.getByRole('button', { name: 'Back to billing' }))
    expect(onClose).toHaveBeenCalled()
  })
})
