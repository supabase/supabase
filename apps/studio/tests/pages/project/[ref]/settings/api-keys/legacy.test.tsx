import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApiKeysLegacyPage from '@/pages/project/[ref]/settings/api-keys/legacy'
import { customRender } from '@/tests/lib/custom-render'

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

vi.mock('@/components/layouts/DefaultLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/ProjectSettingsLayout/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/APIKeys/APIKeysLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/ProjectSettings/DisplayApiSettings', () => ({
  DisplayApiSettings: () => <div>DisplayApiSettings</div>,
}))

vi.mock('@/components/ui/ProjectSettings/ToggleLegacyApiKeys', () => ({
  ToggleLegacyApiKeysPanel: () => <div>ToggleLegacyApiKeysPanel</div>,
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: mockUseHighAvailability,
}))

describe('/project/[ref]/settings/api-keys/legacy', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })
  })

  it('renders both legacy keys and the disable toggle on platform', () => {
    customRender(<ApiKeysLegacyPage dehydratedState={{}} />)

    expect(screen.getByText('DisplayApiSettings')).toBeInTheDocument()
    expect(screen.getByText('ToggleLegacyApiKeysPanel')).toBeInTheDocument()
  })

  it('renders legacy keys but hides the disable toggle on self-hosted', () => {
    mockIsPlatform.value = false

    customRender(<ApiKeysLegacyPage dehydratedState={{}} />)

    expect(screen.getByText('DisplayApiSettings')).toBeInTheDocument()
    expect(screen.queryByText('ToggleLegacyApiKeysPanel')).not.toBeInTheDocument()
  })

  it('hides the legacy keys entirely on High Availability projects', () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })

    customRender(<ApiKeysLegacyPage dehydratedState={{}} />)

    expect(
      screen.getByText('Legacy API keys are unavailable on High Availability projects')
    ).toBeInTheDocument()
    expect(screen.queryByText('DisplayApiSettings')).not.toBeInTheDocument()
    expect(screen.queryByText('ToggleLegacyApiKeysPanel')).not.toBeInTheDocument()
  })
})
