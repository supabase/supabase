import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ApiKeysLayout from './APIKeysLayout'
import { customRender } from '@/tests/lib/custom-render'

const { mockUseHighAvailability } = vi.hoisted(() => ({
  mockUseHighAvailability: vi.fn(),
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: mockUseHighAvailability,
}))

const LEGACY_TAB = 'Legacy anon, service_role API keys'
const NEW_TAB = 'Publishable and secret API keys'

describe('ApiKeysLayout', () => {
  it('hides the legacy keys tab on High Availability projects', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })

    customRender(
      <ApiKeysLayout>
        <div>content</div>
      </ApiKeysLayout>
    )

    expect(screen.getByText(NEW_TAB)).toBeInTheDocument()
    expect(screen.queryByText(LEGACY_TAB)).not.toBeInTheDocument()
  })

  it('shows the legacy keys tab on other projects', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })

    customRender(
      <ApiKeysLayout>
        <div>content</div>
      </ApiKeysLayout>
    )

    expect(screen.getByText(NEW_TAB)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: LEGACY_TAB })).toHaveAttribute(
      'href',
      '/project/default/settings/api-keys/legacy'
    )
  })
})
