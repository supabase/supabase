import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ComputeActiveHoursMetric } from './ComputeActiveHoursMetric'
import type { OrgPlan, OrgSubscription } from '@/data/subscriptions/types'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ slug: 'acme' }),
}))

/** Only `plan.id` is read here; the rest of the subscription is irrelevant. */
const onPlan = (id: OrgPlan['id']) => ({ plan: { id } }) as unknown as OrgSubscription

const render = (plan: OrgPlan['id'], relativeToSubscription = true) =>
  customRender(
    <ComputeActiveHoursMetric
      slug="acme"
      subscription={onPlan(plan)}
      relativeToSubscription={relativeToSubscription}
    />
  )

describe('ComputeActiveHoursMetric', () => {
  it('leads with active hours against the plan allowance', async () => {
    render('pro')

    expect(await screen.findByText('Compute Active Hours')).toBeInTheDocument()
    expect(await screen.findByText(/\/ 500 hours/)).toBeInTheDocument()
  })

  it('shows how many computes the hours came from', async () => {
    render('pro')

    // The five stand-in projects run nine computes between them.
    expect(await screen.findByText('9 of 5 computes')).toBeInTheDocument()
  })

  it('links through to the Compute section of the usage page', async () => {
    render('pro')

    const link = await screen.findByRole('link', { name: /Compute Active Hours/ })
    expect(link).toHaveAttribute('href', '/org/acme/usage#compute-services')
  })

  it('drops the denominator when the plan has no fixed allowance', async () => {
    render('enterprise')

    expect(await screen.findByText(/^\d[\d,]* hours$/)).toBeInTheDocument()
    expect(screen.queryByText(/\/ \d/)).not.toBeInTheDocument()
  })

  it('drops the denominator outside the current billing cycle', async () => {
    render('pro', false)

    expect(await screen.findByText(/^\d[\d,]* hours$/)).toBeInTheDocument()
    expect(screen.queryByText(/\/ 500 hours/)).not.toBeInTheDocument()
  })

  it('reports a smaller allowance on Free than on Team', async () => {
    const { unmount } = render('free')
    expect(await screen.findByText(/\/ 50 hours/)).toBeInTheDocument()
    unmount()

    render('team')
    expect(await screen.findByText(/\/ 2,000 hours/)).toBeInTheDocument()
  })
})
