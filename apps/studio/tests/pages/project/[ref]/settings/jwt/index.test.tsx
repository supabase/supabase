import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import JWTSigningKeysPage from '@/pages/project/[ref]/settings/jwt/index'

const { mockIsPlatform, mockUseAsyncCheckPermissions, mockUseDeploymentMode } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseDeploymentMode: vi.fn(),
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

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

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
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isSuccess: true })
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })
  })

  it('renders the JWT signing keys table on platform', () => {
    render(<JWTSigningKeysPage dehydratedState={{}} />)

    expect(screen.getByText('JWTSecretKeysTable')).toBeInTheDocument()
    expect(screen.queryByText('LocalSetupGuide')).not.toBeInTheDocument()
  })

  it('renders only the CLI LocalSetupGuide on self-hosted (CLI mode)', () => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: true,
      isSelfHosted: false,
    })

    render(<JWTSigningKeysPage dehydratedState={{}} />)

    expect(screen.queryByText('JWTSecretKeysTable')).not.toBeInTheDocument()
    expect(screen.getAllByText('LocalSetupGuide')).toHaveLength(1)
  })

  it('renders only the self-hosted LocalSetupGuide on self-hosted (Docker mode)', () => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: false,
      isSelfHosted: true,
    })

    render(<JWTSigningKeysPage dehydratedState={{}} />)

    expect(screen.queryByText('JWTSecretKeysTable')).not.toBeInTheDocument()
    expect(screen.getAllByText('LocalSetupGuide')).toHaveLength(1)
  })
})
