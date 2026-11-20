import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { BillingMetric } from './BillingMetric'
import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import type { OrgSubscription } from '@/data/subscriptions/types'
import type { OrgUsageResponse } from '@/data/usage/org-usage-query'
import { customRender } from '@/tests/lib/custom-render'

const usage = {
  usage_billing_enabled: true,
  usages: [
    {
      metric: PricingMetric.EGRESS,
      usage: 3,
      usage_original: 3e9,
      cost: 0,
      unit_price_desc: '',
      available_in_plan: true,
      unlimited: true,
      capped: false,
      pricing_strategy: 'NONE',
      project_allocations: [
        { ref: 'ref-one', name: 'Project One', usage: 2e9 },
        { ref: 'ref-two', name: 'Project Two', usage: 1e9 },
      ],
    },
  ],
} as OrgUsageResponse

const subscription = {
  plan: { id: 'pro', name: 'Pro' },
  usage_billing_enabled: true,
} as OrgSubscription

async function renderMetricWithOpenBreakdown(projectRef?: string | null) {
  const user = userEvent.setup()
  customRender(
    <BillingMetric
      idx={0}
      slug="test-org"
      metric={{ key: PricingMetric.EGRESS, name: 'Egress', units: 'bytes', category: 'Database' }}
      usage={usage}
      subscription={subscription}
      relativeToSubscription={false}
      projectRef={projectRef}
    />
  )
  await user.hover(screen.getByText('Egress'))
}

describe('BillingMetric project breakdown', () => {
  it('lets each project be selected when no project is filtered', async () => {
    await renderMetricWithOpenBreakdown(null)

    expect((await screen.findAllByRole('button', { name: 'Project One' })).length).toBeGreaterThan(
      0
    )
    expect(screen.getAllByRole('button', { name: 'Project Two' }).length).toBeGreaterThan(0)
  })

  it('renders the filtered project as plain text', async () => {
    await renderMetricWithOpenBreakdown('ref-one')

    expect((await screen.findAllByText('Project One')).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Project One' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Project Two' }).length).toBeGreaterThan(0)
  })
})
