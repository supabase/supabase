import { screen } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ComputeRuntimeMetric } from './ComputeRuntimeMetric'
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
    <ComputeRuntimeMetric
      slug="acme"
      subscription={onPlan(plan)}
      relativeToSubscription={relativeToSubscription}
    />
  )

const setComputeLimitsMode = (mode: 'alpha' | 'plans') => {
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'local')
  localStorage.setItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE, JSON.stringify(mode))
}

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.removeItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE)
})

describe('ComputeRuntimeMetric', () => {
  beforeEach(() => setComputeLimitsMode('plans'))

  it('leads with runtime against the included quota', async () => {
    render('pro')

    expect(await screen.findByText('Compute Runtime')).toBeInTheDocument()
    // The RFC includes 500 minutes per cycle.
    expect(await screen.findByText(/\/ 500 min/)).toBeInTheDocument()
  })

  it('shows how many workers the runtime came from', async () => {
    render('pro')

    // Paid concurrency is undecided in the RFC, so there is no denominator to show.
    expect(await screen.findByText('6 workers')).toBeInTheDocument()
  })

  it('shows the concurrency limit on Free, where the RFC sets one', async () => {
    render('free')

    expect(await screen.findByText('6 of 1 concurrent workers')).toBeInTheDocument()
  })

  it('links through to the Compute section of the usage page', async () => {
    render('pro')

    const link = await screen.findByRole('link', { name: /Compute Runtime/ })
    expect(link).toHaveAttribute('href', '/org/acme/usage#compute-services')
  })

  it('drops the denominator outside the current billing cycle', async () => {
    render('pro', false)

    expect(await screen.findByText(/^\d[\d,]* min$/)).toBeInTheDocument()
    expect(screen.queryByText(/\/ 500 min/)).not.toBeInTheDocument()
  })

  it('includes the same quota on every plan, per the RFC', async () => {
    const { unmount } = render('free')
    expect(await screen.findByText(/\/ 500 min/)).toBeInTheDocument()
    unmount()

    render('team')
    expect(await screen.findByText(/\/ 500 min/)).toBeInTheDocument()
  })
})
