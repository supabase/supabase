import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/project/$ref/settings/api-keys/legacy'
import { renderRoute } from '@/tests/lib/route-render'

const { mockIsPlatform, mockUseHighAvailability } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseHighAvailability: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/components/ui/ProjectSettings/DisplayApiSettings', () => ({
  DisplayApiSettings: () => <div>DisplayApiSettings</div>,
}))

vi.mock('@/components/ui/ProjectSettings/ToggleLegacyApiKeys', () => ({
  ToggleLegacyApiKeysPanel: () => <div>ToggleLegacyApiKeysPanel</div>,
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: mockUseHighAvailability,
}))

const renderLegacyApiKeys = () =>
  renderRoute(Route, {
    routeId: '/project/$ref/settings/api-keys/legacy',
    url: '/project/default/settings/api-keys/legacy',
  })

describe('/project/$ref/settings/api-keys/legacy', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })
  })

  it('renders both legacy keys and the disable toggle on platform', async () => {
    await renderLegacyApiKeys()

    expect(screen.getByText('DisplayApiSettings')).toBeInTheDocument()
    expect(screen.getByText('ToggleLegacyApiKeysPanel')).toBeInTheDocument()
  })

  it('renders legacy keys but hides the disable toggle on self-hosted', async () => {
    mockIsPlatform.value = false

    await renderLegacyApiKeys()

    expect(screen.getByText('DisplayApiSettings')).toBeInTheDocument()
    expect(screen.queryByText('ToggleLegacyApiKeysPanel')).not.toBeInTheDocument()
  })

  it('hides the legacy keys entirely on High Availability projects', async () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })

    await renderLegacyApiKeys()

    expect(
      screen.getByText('Legacy API keys are unavailable on High Availability projects')
    ).toBeInTheDocument()
    expect(screen.queryByText('DisplayApiSettings')).not.toBeInTheDocument()
    expect(screen.queryByText('ToggleLegacyApiKeysPanel')).not.toBeInTheDocument()
  })
})
