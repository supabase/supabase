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
  it('upgrades a Nano project to Micro once the restart is confirmed', async () => {
    const addonRequests: { ref: string; body: unknown }[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/billing/addons',
      response: async ({ request, params }) => {
        addonRequests.push({ ref: String(params.ref), body: await request.json() })
        return new HttpResponse(null, { status: 201 })
      },
    })
    const user = userEvent.setup()
    await renderView({
      projects: [
        createMockOrgProject({ ref: 'nano-one', name: 'Nano one', computeSize: 'nano' }),
        createMockOrgProject({ ref: 'micro-one', name: 'Micro one', computeSize: 'micro' }),
      ],
    })

    expect(
      screen.getByRole('heading', { name: '1 project can move to Micro for no additional costs' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Micro one')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Upgrade Nano one to Micro' }))
    const dialog = await screen.findByRole('dialog', { name: 'Upgrade Nano one to Micro' })
    expect(dialog).toHaveTextContent('restarts for ~1 minute')

    await user.click(screen.getByRole('button', { name: 'Upgrade to Micro' }))

    await waitFor(() =>
      expect(addonRequests).toEqual([
        {
          ref: 'nano-one',
          body: { addon_type: 'compute_instance', addon_variant: 'ci_micro' },
        },
      ])
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('blocks the upgrade while a project resizes and links to its progress', async () => {
    await renderView({
      projects: [
        createMockOrgProject({
          ref: 'nano-one',
          name: 'Nano one',
          computeSize: 'nano',
          status: 'RESIZING',
        }),
      ],
    })

    expect(screen.getByRole('button', { name: 'Upgrading' })).toBeDisabled()
    const progressLink = screen.getByRole('link', { name: 'View progress for Nano one' })
    expect(progressLink).toHaveAttribute('href', '/project/nano-one')
    expect(progressLink).toHaveAttribute('target', '_blank')
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

    await user.click(screen.getByRole('button', { name: 'Upgrade Nano two to Micro' }))

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

    expect(screen.queryByRole('heading', { name: /can move to Micro/ })).not.toBeInTheDocument()
  })

  it('shows Pro benefits and offers to turn off the spend cap', async () => {
    const user = userEvent.setup()
    const { onManageSpendCap } = await renderView({ planId: 'pro', isSpendCapEnabled: true })

    expect(screen.getByRole('heading', { name: "You're on Pro" })).toBeInTheDocument()
    expect(screen.getByText('Daily backups')).toBeInTheDocument()
    expect(screen.getByText('Switch to the dedicated pooler')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cost control' }))
    expect(onManageSpendCap).toHaveBeenCalled()
  })

  it('skips the spend cap step when the spend cap is already off', async () => {
    await renderView({ planId: 'pro', isSpendCapEnabled: false })

    expect(screen.queryByRole('button', { name: 'Cost control' })).not.toBeInTheDocument()
  })

  it('shows Team benefits with links to org settings and onboarding', async () => {
    await renderView({ planId: 'team', isSpendCapEnabled: true })

    expect(screen.getByRole('heading', { name: "You're on Team" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Configure' })).toHaveAttribute('href', '/org/acme/sso')
    expect(screen.getByRole('link', { name: /Book a call/ })).toHaveAttribute(
      'href',
      'https://forms.supabase.com/teamtier'
    )
    expect(screen.queryByRole('button', { name: 'Cost control' })).not.toBeInTheDocument()
  })

  it('lists the Pro features too when upgrading from Free to Team', async () => {
    await renderView({ planId: 'team', previousPlanId: 'free' })

    expect(screen.getByRole('heading', { name: 'Now included' })).toBeInTheDocument()
    expect(screen.getByText('Branching')).toBeInTheDocument()
    expect(screen.getByText('Dedicated pooler')).toBeInTheDocument()
    expect(screen.getByText('No project pausing')).toBeInTheDocument()
    expect(screen.getByText('Dashboard SSO')).toBeInTheDocument()
  })

  it('recommends the Pro setup steps too when upgrading from Free to Team', async () => {
    await renderView({ planId: 'team', previousPlanId: 'free', isSpendCapEnabled: true })

    expect(screen.getByText('Switch to the dedicated pooler')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cost control' })).toBeInTheDocument()
    expect(screen.getByText('Set up SSO')).toBeInTheDocument()
  })

  it('only lists what Team adds when upgrading from Pro', async () => {
    await renderView({ planId: 'team', previousPlanId: 'pro' })

    expect(screen.getByRole('heading', { name: 'Everything in Pro, plus' })).toBeInTheDocument()
    expect(screen.queryByText('Branching')).not.toBeInTheDocument()
    expect(screen.queryByText('Switch to the dedicated pooler')).not.toBeInTheDocument()
  })

  it('returns to the organization', async () => {
    const user = userEvent.setup()
    const { onClose } = await renderView()

    await user.click(screen.getByRole('button', { name: 'Back to your organization' }))
    expect(onClose).toHaveBeenCalled()
  })
})
