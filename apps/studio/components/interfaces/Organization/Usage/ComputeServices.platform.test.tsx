import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComputeServices } from './ComputeServices'
import type { OrgSubscription } from '@/data/subscriptions/types'
import { customRender } from '@/tests/lib/custom-render'

/** Only `plan.id` is read by this section; the rest of the subscription is irrelevant here. */
const subscriptionOnPlan = (id: string) => ({ plan: { id } }) as unknown as OrgSubscription

describe('ComputeServices', () => {
  it('renders the three Compute usage charts', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    expect(await screen.findByText('Active hours')).toBeInTheDocument()
    expect(await screen.findByText('Instance hours by size')).toBeInTheDocument()
    expect(await screen.findByText('Usage by project')).toBeInTheDocument()
  })

  it('measures usage against the plan allowance and labels the limit', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('pro')} />)

    // Pro carries a 500 hour allowance, so the summary names it as the denominator.
    expect(await screen.findByText(/of 500 hrs used/)).toBeInTheDocument()
    expect(await screen.findByText('Remaining')).toBeInTheDocument()
  })

  it('shows a smaller allowance on Free than on Pro', async () => {
    const { unmount } = customRender(
      <ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('free')} />
    )
    expect(await screen.findByText(/of 50 hrs used/)).toBeInTheDocument()
    unmount()

    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('team')} />)
    expect(await screen.findByText(/of 2,000 hrs used/)).toBeInTheDocument()
  })

  it('reports no fixed allowance on enterprise rather than inventing a limit', async () => {
    customRender(<ComputeServices orgSlug="acme" subscription={subscriptionOnPlan('enterprise')} />)

    expect(await screen.findByText(/no fixed allowance on this plan/)).toBeInTheDocument()
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
