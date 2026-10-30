import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ComputeInstance } from '../Compute.types'
import { ComputeInstanceUsageSection } from './ComputeInstanceUsageSection'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default' }),
}))

const INSTANCE: ComputeInstance = {
  name: 'embed',
  buildState: 'active',
  isDeleting: false,
  runtime: 'node',
  size: '2gb-1vcpu',
  access: 'public',
  declaredInstances: 3,
  instances: { declared: 3, live: 3, ready: 3, stale: 0 },
}

describe('ComputeInstanceUsageSection', () => {
  it('renders the usage metrics for the instance', async () => {
    customRender(<ComputeInstanceUsageSection instance={INSTANCE} />)

    // "Active hours" labels both the metric and its chart.
    expect(await screen.findAllByText('Active hours')).not.toHaveLength(0)
    expect(await screen.findByText('vCPU-hours')).toBeInTheDocument()
    expect(await screen.findByText('GB-hours')).toBeInTheDocument()
    expect(await screen.findByText('Requests')).toBeInTheDocument()
  })

  it('states that figures are estimates while Compute is in alpha', async () => {
    customRender(<ComputeInstanceUsageSection instance={INSTANCE} />)

    expect(
      await screen.findByText(/Figures are estimates while Compute is in alpha/)
    ).toBeInTheDocument()
  })

  it('renders non-zero usage figures rather than empty placeholders', async () => {
    const { container } = customRender(<ComputeInstanceUsageSection instance={INSTANCE} />)

    await screen.findAllByText('Active hours')
    await waitFor(() => {
      const values = [...container.querySelectorAll('.tabular-nums')]
        .map((node) => Number(node.textContent?.replace(/[^0-9.]/g, '')))
        .filter((value) => Number.isFinite(value) && value > 0)
      expect(values.length).toBeGreaterThan(0)
    })
  })
})
