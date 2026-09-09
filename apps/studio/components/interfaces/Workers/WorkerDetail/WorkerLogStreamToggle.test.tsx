import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WorkerLogStreamToggle } from './WorkerLogStreamToggle'
import { customRender } from '@/tests/lib/custom-render'

const pressed = (name: string) =>
  screen.getByRole('button', { name }).getAttribute('aria-pressed') === 'true'

describe('WorkerLogStreamToggle', () => {
  it('shows every stream on by default and hides one when toggled off', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<WorkerLogStreamToggle />, { nuqs: { onUrlUpdate } })

    expect(pressed('Invocations')).toBe(true)
    expect(pressed('Logs')).toBe(true)
    expect(pressed('Activity')).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: 'Logs' }))

    expect(pressed('Logs')).toBe(false)
    const { searchParams } = onUrlUpdate.mock.lastCall![0]
    expect(searchParams.get('worker_output')).toBe('false')
    expect(searchParams.get('worker_requests')).toBeNull()
    expect(searchParams.get('worker_builds')).toBeNull()
  })

  it('reads a hidden stream from the URL and refuses to hide the last visible one', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<WorkerLogStreamToggle />, {
      nuqs: { searchParams: '?worker_requests=false&worker_builds=false', onUrlUpdate },
    })

    expect(pressed('Invocations')).toBe(false)
    expect(pressed('Logs')).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: 'Logs' }))

    expect(pressed('Logs')).toBe(true)
    expect(onUrlUpdate).not.toHaveBeenCalled()
  })
})
