import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApiKeysLegacyPage from '@/pages/project/[ref]/settings/api-keys/legacy'

const { mockIsPlatform } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
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

describe('/project/[ref]/settings/api-keys/legacy', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
  })

  it('renders both legacy keys and the disable toggle on platform', () => {
    render(<ApiKeysLegacyPage dehydratedState={{}} />)

    expect(screen.getByText('DisplayApiSettings')).toBeInTheDocument()
    expect(screen.getByText('ToggleLegacyApiKeysPanel')).toBeInTheDocument()
  })

  it('renders legacy keys but hides the disable toggle on self-hosted', () => {
    mockIsPlatform.value = false

    render(<ApiKeysLegacyPage dehydratedState={{}} />)

    expect(screen.getByText('DisplayApiSettings')).toBeInTheDocument()
    expect(screen.queryByText('ToggleLegacyApiKeysPanel')).not.toBeInTheDocument()
  })
})
