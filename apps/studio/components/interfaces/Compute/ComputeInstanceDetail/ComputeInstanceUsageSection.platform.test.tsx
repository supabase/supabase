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

    expect(await screen.findByText('Running hours')).toBeInTheDocument()
    expect(await screen.findAllByText('vCPU-hours')).not.toHaveLength(0)
    expect(await screen.findByText('CPU used')).toBeInTheDocument()
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

    await screen.findByText('Running hours')
    await waitFor(() => {
      const values = [...container.querySelectorAll('.tabular-nums')]
        .map((node) => Number(node.textContent?.replace(/[^0-9.]/g, '')))
        .filter((value) => Number.isFinite(value) && value > 0)
      expect(values.length).toBeGreaterThan(0)
    })
  })
})
