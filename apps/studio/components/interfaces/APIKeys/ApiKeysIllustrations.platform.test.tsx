import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiKeysCreateCallout } from './ApiKeysIllustrations'
import { customRender } from '@/tests/lib/custom-render'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

describe('ApiKeysCreateCallout', () => {
  beforeEach(() => mockTrack.mockClear())

  it('renders the sample keys inert so their Copy and Reveal buttons are not interactive', () => {
    mockProjectGrantContext({ ref: 'default' })
    customRender(<ApiKeysCreateCallout />, { profileContext: createMockProfileContext() })

    const sampleButtons = [
      ...screen.getAllByRole('button', { name: 'Copy API key' }),
      ...screen.getAllByRole('button', { name: 'Reveal API key' }),
    ]

    expect(sampleButtons.length).toBeGreaterThan(0)
    for (const button of sampleButtons) {
      expect(button.closest('[inert]')).not.toBeNull()
    }
    expect(mockTrack).not.toHaveBeenCalled()
  })
})
