import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestartServerButton } from './RestartServerButton'
import { customRender } from '@/tests/lib/custom-render'

const {
  mockUseAsyncCheckPermissions,
  mockUseFlag,
  mockUseIsFeatureEnabled,
  mockUseSelectedProjectQuery,
} = vi.hoisted(() => ({
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseFlag: vi.fn(),
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseSelectedProjectQuery: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: mockUseFlag,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/data/projects/project-detail-query', () => ({
  useSetProjectStatus: () => ({ setProjectStatus: vi.fn() }),
}))

vi.mock('@/data/projects/project-restart-mutation', () => ({
  useProjectRestartMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/data/projects/project-restart-services-mutation', () => ({
  useProjectRestartServicesMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useIsAwsK8sCloudProvider: () => false,
  useIsProjectActive: () => true,
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

describe('RestartServerButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFlag.mockReturnValue(false)
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
    mockUseIsFeatureEnabled.mockReturnValue({ projectSettingsRestartProject: true })
    mockUseSelectedProjectQuery.mockReturnValue({
      data: { ref: 'default', region: 'us-east-1', status: 'ACTIVE_HEALTHY' },
    })
  })

  it('uses separate tab stops for the primary action and restart type menu', async () => {
    const user = userEvent.setup()
    customRender(<RestartServerButton />)

    const restartProject = screen.getByRole('button', { name: 'Restart project' })
    const chooseRestartType = screen.getByRole('button', { name: 'Choose restart type' })

    await user.tab()
    expect(restartProject).toHaveFocus()

    await user.tab()
    expect(chooseRestartType).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menuitem', { name: /Fast database reboot/ })).toHaveFocus()
    expect(screen.getByText(/Other project services remain running/)).toBeVisible()
  })
})
