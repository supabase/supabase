import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/project/$ref/settings/jwt/legacy'
import { renderRoute } from '@/tests/lib/route-render'

const { mockUseIsFeatureEnabled, mockUseJwtSecretUpdatingStatusQuery } = vi.hoisted(() => ({
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseJwtSecretUpdatingStatusQuery: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    useParams: () => ({ ref: 'project-ref' }),
  }
})

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/data/config/jwt-secret-updating-status-query', () => ({
  useJwtSecretUpdatingStatusQuery: mockUseJwtSecretUpdatingStatusQuery,
}))

vi.mock('@/components/layouts/JWTKeys/JWTKeysLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/JwtSecrets/jwt-settings', () => ({
  JWTSettings: () => <div>JWTSettings</div>,
}))

const renderLegacyJwtKeys = () =>
  renderRoute(Route, {
    routeId: '/project/$ref/settings/jwt/legacy',
    url: '/project/project-ref/settings/jwt/legacy',
  })

describe('/project/$ref/settings/jwt/legacy', () => {
  beforeEach(() => {
    mockUseIsFeatureEnabled.mockReturnValue({ projectSettingsLegacyJwtKeys: true })
    mockUseJwtSecretUpdatingStatusQuery.mockReturnValue({ data: undefined })
  })

  it('renders the JWT settings when legacy JWT keys are enabled', async () => {
    await renderLegacyJwtKeys()

    expect(screen.getByText('JWTSettings')).toBeInTheDocument()
  })

  it('hides the JWT settings when legacy JWT keys are disabled', async () => {
    mockUseIsFeatureEnabled.mockReturnValue({ projectSettingsLegacyJwtKeys: false })

    await renderLegacyJwtKeys()

    expect(screen.queryByText('JWTSettings')).not.toBeInTheDocument()
  })
})
