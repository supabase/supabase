import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import JWTKeysLegacyPage from '@/pages/project/[ref]/settings/jwt/legacy'
import { customRender as render } from '@/tests/lib/custom-render'

const { mockIsPlatform, mockUseIsFeatureEnabled, mockUseJwtSecretUpdatingStatusQuery } = vi.hoisted(
  () => ({
    mockIsPlatform: { value: true },
    mockUseIsFeatureEnabled: vi.fn(),
    mockUseJwtSecretUpdatingStatusQuery: vi.fn(),
  })
)

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
    useParams: () => ({ ref: 'project-ref' }),
  }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/data/config/jwt-secret-updating-status-query', () => ({
  useJwtSecretUpdatingStatusQuery: mockUseJwtSecretUpdatingStatusQuery,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/ProjectSettingsLayout/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/JWTKeys/JWTKeysLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/JwtSecrets/jwt-settings', () => ({
  JWTSettings: () => <div>JWTSettings</div>,
}))

describe('/project/[ref]/settings/jwt/legacy', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseIsFeatureEnabled.mockReturnValue({ projectSettingsLegacyJwtKeys: true })
    mockUseJwtSecretUpdatingStatusQuery.mockReturnValue({ data: undefined })
  })

  it('renders the JWT settings on platform', () => {
    render(<JWTKeysLegacyPage dehydratedState={{}} />)

    expect(screen.getByText('JWTSettings')).toBeInTheDocument()
  })

  it('renders the JWT settings on self-hosted', () => {
    mockIsPlatform.value = false

    render(<JWTKeysLegacyPage dehydratedState={{}} />)

    expect(screen.getByText('JWTSettings')).toBeInTheDocument()
  })
})
