import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConnectButton } from './ConnectButton'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

describe('ConnectButton URL history', () => {
  it('pushes history when the connect sheet opens', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project response
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })

    const onUrlUpdate = vi.fn()
    customRender(<ConnectButton />, {
      nuqs: { hasMemory: true, rateLimitFactor: 1, onUrlUpdate },
    })

    // the inactive state stays focusable for its tooltip, so wait until the project is healthy
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Connect' })).not.toHaveAttribute('aria-disabled')
    )
    await userEvent.click(screen.getByRole('button', { name: 'Connect' }))

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const [update] = onUrlUpdate.mock.calls.at(-1)!
    expect(update.queryString).toContain('showConnect=true')
    expect(update.options.history).toBe('push')
  })
})
