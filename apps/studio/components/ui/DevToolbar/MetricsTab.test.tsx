import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, expect, it, vi } from 'vitest'

import { MetricsTab } from './MetricsTab'
import { setMemoryCommitmentPreview } from '@/state/metrics-preview'

vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'local')
})

afterAll(() => vi.unstubAllEnvs())

it('keeps the simulation selected when reopening the toolbar and lets users return to Default', async () => {
  const user = userEvent.setup()
  const first = render(<MetricsTab />)

  try {
    expect(screen.getByRole('combobox', { name: 'Memory commitment' })).toHaveTextContent(
      'Default (real data)'
    )
    await user.click(screen.getByRole('combobox', { name: 'Memory commitment' }))
    await user.click(screen.getByRole('option', { name: 'Warn' }))
    expect(screen.getByText('Simulated data is active for this project.')).toBeInTheDocument()

    first.unmount()
    render(<MetricsTab />)
    expect(screen.getByRole('combobox', { name: 'Memory commitment' })).toHaveTextContent('Warn')
    await user.click(screen.getByRole('combobox', { name: 'Memory commitment' }))
    await user.click(screen.getByRole('option', { name: 'Default (real data)' }))
    expect(screen.getByRole('combobox', { name: 'Memory commitment' })).toHaveTextContent(
      'Default (real data)'
    )
    expect(screen.queryByText('Simulated data is active for this project.')).not.toBeInTheDocument()
  } finally {
    act(() => setMemoryCommitmentPreview('default', 'default'))
  }
})
