import { screen, waitFor, within } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ComputeServices } from './ComputeServices'
import type { OrgSubscription } from '@/data/subscriptions/types'
import { customRender } from '@/tests/lib/custom-render'

/** Only `plan` is read by this section; the rest of the subscription is irrelevant here. */
const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
}

const subscriptionOnPlan = (id: string) =>
  ({ plan: { id, name: PLAN_NAMES[id] } }) as unknown as OrgSubscription

const setComputeLimitsMode = (mode: 'alpha' | 'plans') => {
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'local')
  localStorage.setItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE, JSON.stringify(mode))
}

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.removeItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE)
})

describe('ComputeServices', () => {
  beforeEach(() => setComputeLimitsMode('plans'))

  it('renders the three Compute usage charts', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    expect(await screen.findByText('Active hours')).toBeInTheDocument()
    expect(await screen.findByText('Instance hours by size')).toBeInTheDocument()
    expect(await screen.findByText('Usage by project')).toBeInTheDocument()
  })

  it('breaks the allowance down the way the other usage sections do', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    expect(await screen.findByText('Included in Pro Plan')).toBeInTheDocument()
    expect(await screen.findByText('Used in period')).toBeInTheDocument()
    expect(await screen.findByText('Overage in period')).toBeInTheDocument()
  })

  it('reports no overage while usage sits inside the allowance', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    const overage = (await screen.findByText('Overage in period')).parentElement
    expect(within(overage!).getByText('0 hrs')).toBeInTheDocument()
  })

  it('reports the excess once usage passes the allowance', async () => {
    // The stand-in org runs ~1,860 hours, well past the 300 included on Free.
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('free')} />)

    const overage = (await screen.findByText('Overage in period')).parentElement
    expect(within(overage!).queryByText('0 hrs')).not.toBeInTheDocument()
  })

  it('shows an unlimited allowance and no overage row on enterprise', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('enterprise')} />)

    expect(await screen.findByText('Included in Enterprise Plan')).toBeInTheDocument()
    expect(await screen.findByText('Unlimited')).toBeInTheDocument()
    expect(screen.queryByText('Overage in period')).not.toBeInTheDocument()
  })

  it('drops the period rows outside the current billing cycle', async () => {
    customRender(
      <ComputeServices
        orgSlug="acme"
        subscription={subscriptionOnPlan('pro')}
        currentBillingCycleSelected={false}
      />
    )

    expect(await screen.findByText('Included in Pro Plan')).toBeInTheDocument()
    expect(screen.queryByText('Used in period')).not.toBeInTheDocument()
    expect(screen.queryByText('Overage in period')).not.toBeInTheDocument()
  })

  it('names the burn-down reference lines in a legend below the plot', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    // The threshold and limit sit within 20% of each other, so labelling them on the plot
    // overlapped. They belong in the legend instead.
    expect(await screen.findByText('Used')).toBeInTheDocument()
    expect(await screen.findByText(/80% threshold · 2,400 hrs/)).toBeInTheDocument()
    expect(await screen.findByText(/Plan limit · 3,000 hrs/)).toBeInTheDocument()
  })

  it('says there is no allowance rather than showing an empty legend on enterprise', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('enterprise')} />)

    expect(await screen.findByText(/No fixed limit on the Enterprise Plan/)).toBeInTheDocument()
    expect(screen.queryByText(/Plan limit ·/)).not.toBeInTheDocument()
  })

  it('renders instance hours by size as labelled meters', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    await screen.findByText('Instance hours by size')
    // Both stand-in sizes, rendered through the page's standard meter.
    expect(await screen.findByText('4 GB · 2 vCPU')).toBeInTheDocument()
    expect(await screen.findByText('2 GB · 1 vCPU')).toBeInTheDocument()
  })

  it('measures usage against the plan allowance and labels the limit', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    // Pro carries a 3,000 hour allowance, so the summary names it as the denominator.
    expect(await screen.findByText(/of 3,000 hrs used/)).toBeInTheDocument()
    expect(await screen.findByText('Remaining')).toBeInTheDocument()
  })

  it('shows a smaller allowance on Free than on Pro', async () => {
    const { unmount } = customRender(
      <ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('free')} />
    )
    expect(await screen.findByText(/of 300 hrs used/)).toBeInTheDocument()
    unmount()

    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('team')} />)
    expect(await screen.findByText(/of 12,000 hrs used/)).toBeInTheDocument()
  })

  it('reports no fixed allowance on enterprise rather than inventing a limit', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('enterprise')} />)

    expect(await screen.findByText(/No fixed limit on the Enterprise Plan/)).toBeInTheDocument()
    expect(await screen.findByText('No limit')).toBeInTheDocument()
  })

  it('lists projects with their share of org usage', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    expect(await screen.findByText('Production API')).toBeInTheDocument()
    expect(await screen.findByText('Sandbox')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/% from the largest project/)).toBeInTheDocument()
    })
  })

  it('narrows to a single project when one is selected', async () => {
    customRender(
      <ComputeServices
        orgSlug="acme"
        projectRef="webhooks"
        subscription={subscriptionOnPlan('pro')}
      />
    )

    expect(await screen.findByText('Webhook relay')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Production API')).not.toBeInTheDocument()
    })
  })

  it('states that Compute is in alpha and nothing is billed', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    expect(
      await screen.findByText(/Compute is in alpha and these figures are estimates/)
    ).toBeInTheDocument()
  })
})

describe('ComputeServices in private alpha', () => {
  beforeEach(() => setComputeLimitsMode('alpha'))

  it('labels the allowance as private alpha and drops the overage row', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    expect(await screen.findByText('Included in Private alpha')).toBeInTheDocument()
    expect(await screen.findByText('Unlimited')).toBeInTheDocument()
    expect(screen.queryByText('Overage in period')).not.toBeInTheDocument()
    expect(await screen.findByText(/Not metered during private alpha/)).toBeInTheDocument()
  })
})
