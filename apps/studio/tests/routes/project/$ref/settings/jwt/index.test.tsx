import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/project/$ref/settings/jwt/index'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'
import { renderRoute } from '@/tests/lib/route-render'

const { mockIsPlatform, mockUseDeploymentMode } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseDeploymentMode: vi.fn(),
}))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
    useIsLoggedIn: () => true,
    useParams: () => ({ ref: 'default' }),
  }
})

vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: mockUseDeploymentMode,
}))

vi.mock('@/components/layouts/JWTKeys/JWTKeysLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/JwtSecrets/jwt-secret-keys-table', () => ({
  JWTSecretKeysTable: () => <div>JWTSecretKeysTable</div>,
}))

vi.mock('@/components/ui/LocalSetupGuide', () => ({
  LocalSetupGuide: () => <div>LocalSetupGuide</div>,
}))

const renderJwtKeys = () =>
  renderRoute(Route, {
    routeId: '/project/$ref/settings/jwt/',
    url: '/project/default/settings/jwt',
  })

describe('/project/$ref/settings/jwt', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockProjectGrantContext({ ref: 'default' })
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })
  })

  it('renders the JWT signing keys table on platform', async () => {
    await renderJwtKeys()

    expect(await screen.findByText('JWTSecretKeysTable')).toBeInTheDocument()
    expect(screen.queryByText('LocalSetupGuide')).not.toBeInTheDocument()
  })

  it.each([
    { mode: 'CLI', isCli: true, isSelfHosted: false },
    { mode: 'Docker', isCli: false, isSelfHosted: true },
  ])(
    'renders only the LocalSetupGuide on self-hosted ($mode mode)',
    async ({ isCli, isSelfHosted }) => {
      mockIsPlatform.value = false
      mockUseDeploymentMode.mockReturnValue({ isPlatform: false, isCli, isSelfHosted })

      await renderJwtKeys()

      expect(screen.queryByText('JWTSecretKeysTable')).not.toBeInTheDocument()
      expect(screen.getAllByText('LocalSetupGuide')).toHaveLength(1)
    }
  )
})
