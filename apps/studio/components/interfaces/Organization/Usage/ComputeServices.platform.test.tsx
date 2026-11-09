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

const subscriptionOnPlan = (id: string, isUsageBillingEnabled = false) =>
  ({
    plan: { id, name: PLAN_NAMES[id] },
    usage_billing_enabled: isUsageBillingEnabled,
  }) as unknown as OrgSubscription

const renderOnPlan = (id: string, props: { isUsageBillingEnabled?: boolean } = {}) =>
  customRender(
    <ComputeServices
      orgSlug="acme"
      subscription={subscriptionOnPlan(id, props.isUsageBillingEnabled)}
    />
  )

const summary = async (name: string) => {
  const heading = await screen.findByText(`${name} usage`)
  const block = heading.closest('div')?.parentElement
  if (!block) throw new Error(`No summary block for ${name}`)
  return within(block)
}

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

  it('summarizes the metered quota before the charts', async () => {
    renderOnPlan('pro')

    expect(await screen.findByText('Compute usage')).toBeInTheDocument()
    expect(await screen.findByText('vCPU-hours per day')).toBeInTheDocument()
    expect(await screen.findByText('Running hours by size')).toBeInTheDocument()
    expect(await screen.findByText('Usage by project')).toBeInTheDocument()
  })

  it('breaks the allowance down the way the other usage sections do', async () => {
    renderOnPlan('pro')

    const quota = await summary('Compute')
    expect(quota.getByText('Included in Pro Plan')).toBeInTheDocument()
    // The RFC includes 500 per cycle, read as vCPU-minutes, on free and paid alike.
    expect(quota.getByText('500 vCPU-min')).toBeInTheDocument()
    expect(quota.getByText('Used in period')).toBeInTheDocument()
    expect(quota.getByText('Overage in period')).toBeInTheDocument()
  })

  it('reports runtime and GB-hours alongside, neither of which is metered', async () => {
    renderOnPlan('pro')

    // Runtime is context; memory tracks vCPU at a fixed ratio, so neither can diverge.
    expect(await screen.findByText('Runtime in period')).toBeInTheDocument()
    expect(await screen.findByText('GB-hours in period')).toBeInTheDocument()
  })

  it('flags an exceeded quota as restrictive when the spend cap is on', async () => {
    // Every plan includes the same 500 minutes, and the stand-in org runs well past it.
    renderOnPlan('free')

    const quota = await summary('Compute')
    expect(quota.getByText('Exceeded limit')).toHaveClass('text-destructive')
    const overage = quota.getByText('Overage in period').parentElement
    expect(within(overage!).queryByText('0 vCPU-min')).not.toBeInTheDocument()
  })

  it('flags an exceeded quota as billable overage when usage billing is on', async () => {
    renderOnPlan('pro', { isUsageBillingEnabled: true })

    const quota = await summary('Compute')
    expect(quota.getByText('Exceeded limit')).toHaveClass('text-warning')
  })

  it('drops the period rows outside the current billing cycle', async () => {
    customRender(
      <ComputeServices
        orgSlug="acme"
        subscription={subscriptionOnPlan('pro')}
        currentBillingCycleSelected={false}
      />
    )

    const quota = await summary('Compute')
    expect(quota.getByText('Included in Pro Plan')).toBeInTheDocument()
    expect(quota.queryByText('Used in period')).not.toBeInTheDocument()
    expect(quota.queryByText('Overage in period')).not.toBeInTheDocument()
  })

  it('states how much of the reserved vCPU did work', async () => {
    renderOnPlan('pro')

    expect(await screen.findByText(/% of reserved vCPU did work this period/)).toBeInTheDocument()
  })

  it('renders running hours by size as labelled meters', async () => {
    renderOnPlan('pro')

    await screen.findByText('Running hours by size')
    expect(await screen.findByText('4 GB · 2 vCPU')).toBeInTheDocument()
    expect(await screen.findByText('2 GB · 1 vCPU')).toBeInTheDocument()
  })

  it('lists projects with their share of org usage', async () => {
    renderOnPlan('pro')

    expect(await screen.findByText('Production API')).toBeInTheDocument()
    expect(await screen.findByText('1 compute · 2 instances')).toBeInTheDocument()
    expect(await screen.findByText('Sandbox')).toBeInTheDocument()
    expect(await screen.findAllByText('1 compute · 1 instance')).not.toHaveLength(0)
    await waitFor(() => {
      expect(screen.getByText(/% from the largest project/)).toBeInTheDocument()
    })
  })

  it('narrows to a single project and hides the org allowance', async () => {
    customRender(
      <ComputeServices
        orgSlug="acme"
        projectRef="webhooks"
        subscription={subscriptionOnPlan('pro')}
      />
    )

    expect(await screen.findByText('Webhook relay')).toBeInTheDocument()
    expect(screen.queryByText('Production API')).not.toBeInTheDocument()
    expect(screen.queryByText('Compute usage')).not.toBeInTheDocument()
  })

  it('states that Compute is in alpha and nothing is billed', async () => {
    renderOnPlan('pro')

    expect(
      await screen.findByText(/Compute is in alpha and these figures are estimates/)
    ).toBeInTheDocument()
  })
})

describe('ComputeServices in private alpha', () => {
  beforeEach(() => setComputeLimitsMode('alpha'))

  it('labels the allowance as private alpha and drops the overage row', async () => {
    renderOnPlan('pro')

    const quota = await summary('Compute')
    expect(quota.getByText('Included in Private alpha')).toBeInTheDocument()
    expect(quota.getByText('Unlimited')).toBeInTheDocument()
    expect(quota.getByText('Not metered during private alpha')).toBeInTheDocument()
    expect(quota.queryByText('Overage in period')).not.toBeInTheDocument()
  })
})
