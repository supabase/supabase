import { screen } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

const setComputeLimitsMode = (mode: 'alpha' | 'plans') => {
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'local')
  localStorage.setItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE, JSON.stringify(mode))
}

afterEach(() => {
  vi.unstubAllEnvs()
  localStorage.removeItem(LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE)
})

describe('ComputeActiveHoursMetric', () => {
  beforeEach(() => setComputeLimitsMode('plans'))

  it('leads with active hours against the plan allowance', async () => {
    render('pro')

    expect(await screen.findByText('Compute Active Hours')).toBeInTheDocument()
    expect(await screen.findByText(/\/ 3,000 hours/)).toBeInTheDocument()
  })

  it('shows how many computes the hours came from', async () => {
    render('pro')

    // The five stand-in projects run seven computes between them.
    expect(await screen.findByText('7 of 10 computes')).toBeInTheDocument()
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
    expect(screen.queryByText(/\/ 3,000 hours/)).not.toBeInTheDocument()
  })

  it('reports a smaller allowance on Free than on Team', async () => {
    const { unmount } = render('free')
    expect(await screen.findByText(/\/ 300 hours/)).toBeInTheDocument()
    unmount()

    render('team')
    expect(await screen.findByText(/\/ 12,000 hours/)).toBeInTheDocument()
  })
})

describe('ComputeActiveHoursMetric in private alpha', () => {
  beforeEach(() => setComputeLimitsMode('alpha'))

  it('shows hours and computes without a plan denominator', async () => {
    render('pro')

    expect(await screen.findByText(/^\d[\d,]* hours$/)).toBeInTheDocument()
    expect(await screen.findByText('7 computes')).toBeInTheDocument()
  })
})
