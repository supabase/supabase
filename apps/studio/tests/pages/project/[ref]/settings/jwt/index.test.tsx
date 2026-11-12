import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import JWTSigningKeysPage from '@/pages/project/[ref]/settings/jwt/index'
import { customRender as render } from '@/tests/lib/custom-render'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

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

vi.mock('@/components/interfaces/JwtSecrets/jwt-secret-keys-table', () => ({
  JWTSecretKeysTable: () => <div>JWTSecretKeysTable</div>,
}))

vi.mock('@/components/ui/LocalSetupGuide', () => ({
  LocalSetupGuide: () => <div>LocalSetupGuide</div>,
}))

describe('/project/[ref]/settings/jwt', () => {
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
    render(<JWTSigningKeysPage dehydratedState={{}} />)

    expect(await screen.findByText('JWTSecretKeysTable')).toBeInTheDocument()
    expect(screen.queryByText('LocalSetupGuide')).not.toBeInTheDocument()
  })

  it.each([
    { mode: 'CLI', isCli: true, isSelfHosted: false },
    { mode: 'Docker', isCli: false, isSelfHosted: true },
  ])('renders only the LocalSetupGuide on self-hosted ($mode mode)', ({ isCli, isSelfHosted }) => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({ isPlatform: false, isCli, isSelfHosted })

    render(<JWTSigningKeysPage dehydratedState={{}} />)

    expect(screen.queryByText('JWTSecretKeysTable')).not.toBeInTheDocument()
    expect(screen.getAllByText('LocalSetupGuide')).toHaveLength(1)
  })
})
