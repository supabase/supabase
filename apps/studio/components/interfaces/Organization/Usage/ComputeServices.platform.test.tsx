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

  it('summarizes vCPU and memory before the charts', async () => {
    renderOnPlan('pro')

    expect(await screen.findByText('vCPU-hours usage')).toBeInTheDocument()
    expect(await screen.findByText('GB-hours usage')).toBeInTheDocument()
    expect(await screen.findByText('vCPU-hours per day')).toBeInTheDocument()
    expect(await screen.findByText('Running hours by size')).toBeInTheDocument()
    expect(await screen.findByText('Usage by project')).toBeInTheDocument()
  })

  it('breaks each allowance down the way the other usage sections do', async () => {
    renderOnPlan('pro')

    const vcpu = await summary('vCPU-hours')
    expect(vcpu.getByText('Included in Pro Plan')).toBeInTheDocument()
    expect(vcpu.getByText('1,000 vCPU-hrs')).toBeInTheDocument()
    expect(vcpu.getByText('Used in period')).toBeInTheDocument()
    expect(vcpu.getByText('Overage in period')).toBeInTheDocument()

    const memory = await summary('GB-hours')
    expect(memory.getByText('2,000 GB-hrs')).toBeInTheDocument()
  })

  it('reports no overage while usage sits inside the allowance', async () => {
    renderOnPlan('team')

    const vcpu = await summary('vCPU-hours')
    const overage = vcpu.getByText('Overage in period').parentElement
    expect(within(overage!).getByText('0 vCPU-hrs')).toBeInTheDocument()
  })

  it('flags an exceeded limit as restrictive when the spend cap is on', async () => {
    renderOnPlan('free')

    const vcpu = await summary('vCPU-hours')
    expect(vcpu.getByText('Exceeded limit')).toHaveClass('text-destructive')
    const overage = vcpu.getByText('Overage in period').parentElement
    expect(within(overage!).queryByText('0 vCPU-hrs')).not.toBeInTheDocument()
  })

  it('flags an exceeded limit as billable overage when usage billing is on', async () => {
    renderOnPlan('free', { isUsageBillingEnabled: true })

    const vcpu = await summary('vCPU-hours')
    expect(vcpu.getByText('Exceeded limit')).toHaveClass('text-warning')
  })

  it('shows an unlimited allowance and no overage row on enterprise', async () => {
    renderOnPlan('enterprise')

    const vcpu = await summary('vCPU-hours')
    expect(vcpu.getByText('Unlimited')).toBeInTheDocument()
    expect(vcpu.getByText('No fixed limit on the Enterprise Plan')).toBeInTheDocument()
    expect(vcpu.queryByText('Overage in period')).not.toBeInTheDocument()
  })

  it('drops the period rows outside the current billing cycle', async () => {
    customRender(
      <ComputeServices
        orgSlug="acme"
        subscription={subscriptionOnPlan('pro')}
        currentBillingCycleSelected={false}
      />
    )

    const vcpu = await summary('vCPU-hours')
    expect(vcpu.getByText('Included in Pro Plan')).toBeInTheDocument()
    expect(vcpu.queryByText('Used in period')).not.toBeInTheDocument()
    expect(vcpu.queryByText('Overage in period')).not.toBeInTheDocument()
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
    expect(await screen.findByText('Sandbox')).toBeInTheDocument()
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
    expect(screen.queryByText('vCPU-hours usage')).not.toBeInTheDocument()
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

    const vcpu = await summary('vCPU-hours')
    expect(vcpu.getByText('Included in Private alpha')).toBeInTheDocument()
    expect(vcpu.getByText('Unlimited')).toBeInTheDocument()
    expect(vcpu.getByText('Not metered during private alpha')).toBeInTheDocument()
    expect(vcpu.queryByText('Overage in period')).not.toBeInTheDocument()
  })
})
