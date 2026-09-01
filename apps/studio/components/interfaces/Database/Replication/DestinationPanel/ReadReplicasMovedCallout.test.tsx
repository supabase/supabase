import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReadReplicasMovedCallout } from './ReadReplicasMovedCallout'
import { customRender } from '@/tests/lib/custom-render'

const mockInfrastructureReadReplicas = vi.fn(() => true)

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({
    infrastructureReadReplicas: mockInfrastructureReadReplicas(),
  }),
}))

describe('ReadReplicasMovedCallout', () => {
  beforeEach(() => {
    mockInfrastructureReadReplicas.mockReturnValue(true)
    window.localStorage.clear()
  })

  test('renders the notice with a link to Infrastructure', async () => {
    customRender(<ReadReplicasMovedCallout />)

    expect(await screen.findByText('Read replicas have moved')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Infrastructure' })).toHaveAttribute(
      'href',
      expect.stringContaining('/settings/infrastructure')
    )
  })

  test('hides after dismiss and persists via localStorage', async () => {
    const user = userEvent.setup()
    customRender(<ReadReplicasMovedCallout />)

    expect(await screen.findByText('Read replicas have moved')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dismiss read replicas moved notice' }))

    expect(screen.queryByText('Read replicas have moved')).not.toBeInTheDocument()
    expect(
      window.localStorage.getItem(
        LOCAL_STORAGE_KEYS.READ_REPLICAS_MOVED_CALLOUT_DISMISSED('default')
      )
    ).toBe('true')
  })

  test('stays hidden when previously dismissed', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEYS.READ_REPLICAS_MOVED_CALLOUT_DISMISSED('default'),
      'true'
    )

    customRender(<ReadReplicasMovedCallout />)

    await expect(screen.findByText('Read replicas have moved')).rejects.toThrow()
  })

  test('hides when Infrastructure read replicas are disabled', () => {
    mockInfrastructureReadReplicas.mockReturnValue(false)

    customRender(<ReadReplicasMovedCallout />)

    expect(screen.queryByText('Read replicas have moved')).not.toBeInTheDocument()
  })
})
